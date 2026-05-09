import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, subDays, isWithinInterval } from 'date-fns';
import { Alert } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export const generateBabyReport = async (baby: any, activities: any[], days: number, memories: any[] = []) => {
  if (!Print.printToFileAsync || !Sharing.shareAsync) {
    Alert.alert('Rebuild Required', 'PDF modules are not yet linked. Please run "npx expo run:ios".');
    return;
  }

  // Load Logo as Base64 for PDF embedding
  let logoBase64 = '';
  try {
    const asset = Asset.fromModule(require('../assets/images/MUMMUM_FINAL.png'));
    await asset.downloadAsync();
    logoBase64 = await FileSystem.readAsStringAsync(asset.localUri || asset.uri, {
      encoding: FileSystem.EncodingType?.Base64 || 'base64',
    });
  } catch (error) {
    console.error('Logo Loading Error:', error);
  }

  const logoUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';

  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  // Categorized Data Filtering
  // Categorized Data Filtering (Period Specific)
  const medicineLogs = activities.filter(a => {
    const activityDate = new Date(a.timestamp);
    return a.type === 'medicine' && isWithinInterval(activityDate, { start: startDate, end: endDate });
  }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const vaccineHistory = activities.filter(a => {
    const activityDate = new Date(a.timestamp);
    return (a.type === 'vaccination' || a.type === 'vaccine') && isWithinInterval(activityDate, { start: startDate, end: endDate });
  }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const growthHistory = activities.filter(a => a.type === 'growth').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Convert baby photo to base64 for PDF rendering
  let babyPhotoBase64 = null;
  if (baby?.photoUri) {
    try {
      // Handle potential dynamic path issues (Simulator UUID changes)
      const fileName = baby.photoUri.split('/').pop();
      const actualUri = `${FileSystem.documentDirectory}${fileName}`;
      
      const fileInfo = await FileSystem.getInfoAsync(actualUri);
      if (fileInfo.exists) {
        const base64 = await FileSystem.readAsStringAsync(actualUri, { encoding: FileSystem.EncodingType.Base64 });
        babyPhotoBase64 = `data:image/jpeg;base64,${base64}`;
      }
    } catch (e) {
      console.error('Error reading baby photo:', e);
    }
  }

  // Get latest memory photo from Milestones for the final portrait
  let latestMemoryPhotoBase64 = null;
  const babyMemories = memories.filter(m => m.babyId === baby?.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const latestMemory = babyMemories.length > 0 ? babyMemories[0] : null;

  if (latestMemory?.uri) {
    try {
      const fileName = latestMemory.uri.split('/').pop();
      const actualUri = `${FileSystem.documentDirectory}${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(actualUri);
      if (fileInfo.exists) {
        const base64 = await FileSystem.readAsStringAsync(actualUri, { encoding: FileSystem.EncodingType.Base64 });
        latestMemoryPhotoBase64 = `data:image/jpeg;base64,${base64}`;
      }
    } catch (e) {
      console.error('Error reading memory photo:', e);
    }
  }

  const periodLabel = days === 1 ? 'Daily' : (days === 7 ? 'Weekly Summary' : 'Monthly Clinical');

  const weeklyCare = activities.filter(a => {
    const activityDate = new Date(a.timestamp);
    const isCare = ['feed', 'sleep', 'diaper'].includes(a.type);
    return isCare && isWithinInterval(activityDate, { start: startDate, end: endDate });
  }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Group weeklyCare by Date
  const groupedCareByDate: { [key: string]: any[] } = {};
  weeklyCare.forEach(activity => {
    const dateKey = format(new Date(activity.timestamp), 'yyyy-MM-dd');
    if (!groupedCareByDate[dateKey]) groupedCareByDate[dateKey] = [];
    groupedCareByDate[dateKey].push(activity);
  });

  const sortedDateKeys = Object.keys(groupedCareByDate).sort((a, b) => b.localeCompare(a));

  // Growth Chart Data (All Time)
  const growthChartData = growthHistory.slice().reverse().map(a => ({
    date: format(new Date(a.timestamp), 'MMM d'),
    weight: a.details?.metric === 'Weight' ? parseFloat(a.details?.value || 0) : 0,
    height: a.details?.metric === 'Height' ? parseFloat(a.details?.value || 0) : 0,
    head: a.details?.metric === 'Head Circ' ? parseFloat(a.details?.value || 0) : 0
  }));

  // Find latest head circumference specifically
  const headEntries = growthHistory.filter(a => a.details?.metric === 'Head Circ');
  const latestHead = headEntries.length > 0 ? parseFloat(headEntries[0].details?.value || 0) : 0;
  const prevHead = headEntries.length > 1 ? parseFloat(headEntries[1].details?.value || 0) : 0;
  const headDiff = latestHead && prevHead ? (latestHead - prevHead).toFixed(1) : '0.0';

  const html = `
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 25px; color: #1B3C35; background: #fff; line-height: 1.3; }
          .report-header { border-bottom: 4px solid #C69C82; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header-main { display: flex; align-items: flex-end; justify-content: space-between; width: 100%; border-bottom: 2px solid #EEE; padding-bottom: 15px; margin-bottom: 15px; }
          .patient-meta { display: flex; gap: 20px; font-size: 10px; color: #607D8B; margin-top: 8px; }
          .meta-item b { color: #1B3C35; }
          .clinical-id { font-size: 9px; color: #90A4AE; font-family: monospace; }
          .confidential { background: #FFF9C4; padding: 2px 6px; border-radius: 2px; font-size: 8px; color: #F57F17; font-weight: 800; display: inline-block; margin-bottom: 5px; }
          
          .section-header { background: #F1F4F6; padding: 8px 12px; border-radius: 6px; margin: 20px 0 10px 0; border-left: 4px solid #C69C82; font-weight: 800; color: #4A5D4C; text-transform: uppercase; font-size: 12px; }
          
          .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
          .stat-card { background: #fff; border: 1px solid #EEE; padding: 10px; border-radius: 10px; text-align: center; }
          .stat-card b { font-size: 16px; color: #C69C82; display: block; }
          .stat-card span { font-size: 8px; color: #90A4AE; text-transform: uppercase; font-weight: 700; }

          .chart-box { background: #fff; border: 1px solid #EEE; border-radius: 14px; padding: 15px; margin-bottom: 20px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { text-align: left; padding: 8px; font-size: 9px; color: #90A4AE; border-bottom: 2px solid #F1F4F6; text-transform: uppercase; }
          td { padding: 10px 8px; border-bottom: 1px solid #F1F4F6; font-size: 11px; vertical-align: top; }
          
          .date-day-header { background: #1B3C35; color: #fff; padding: 6px 12px; border-radius: 4px; margin: 15px 0 10px 0; font-size: 11px; font-weight: 800; }
          
          .cranial-card { background: #FDFCFB; border: 2px solid #E0E0E0; border-radius: 12px; padding: 15px; margin: 15px 0; display: flex; align-items: center; gap: 20px; }
          .head-shape { width: 45px; height: 55px; background: #C69C82; border-radius: 50% 50% 45% 45%; display: flex; align-items: center; justify-content: center; position: relative; }
          .head-shape::after { content: ''; position: absolute; width: 100%; height: 2px; background: rgba(255,255,255,0.4); top: 40%; }
          .cranial-value { font-size: 28px; font-weight: 900; color: #1B3C35; line-height: 1; }
          .cranial-label { font-size: 9px; color: #90A4AE; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
          
          .footer-grid { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #EEE; padding-top: 15px; margin-top: 40px; }
          .disclaimer { font-size: 8px; color: #90A4AE; width: 65%; line-height: 1.4; }
          .page-num { font-size: 10px; color: #C69C82; font-weight: 800; }
          
          .final-portrait-box { position: absolute; right: 0; bottom: 20px; text-align: right; z-index: 10; }
          .final-portrait { width: 110px; height: 140px; border: 6px solid #fff; border-radius: 2px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transform: rotate(3deg); object-fit: cover; }
          .portrait-label { font-size: 8px; color: #C69C82; font-weight: 800; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          
          @media print { .page-break { page-break-before: always; } }
        </style>
      </head>
      <body>
        <!-- PAGE 1: MUMMUM ANALYTICS -->
        <div class="header-main">
          <div>
            <div class="confidential">CONFIDENTIAL CLINICAL RECORD</div>
            <div class="main-title">${baby?.name || 'Patient'}'s ${periodLabel} Report</div>
            <div class="patient-meta">
              <div class="meta-item"><b>DOB:</b> ${baby?.birthDate ? format(new Date(baby.birthDate), 'MMM d, yyyy') : '--'}</div>
              <div class="meta-item"><b>Gender:</b> ${baby?.gender || 'Not Specified'}</div>
              <div class="meta-item"><b>Age:</b> ${baby?.birthDate ? Math.floor((new Date().getTime() - new Date(baby.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30)) + ' Months' : '--'}</div>
            </div>
            <div style="font-size: 8px; color: #90A4AE; margin-top: 5px;">Reference Standard: WHO Child Growth Standards (v1.0)</div>
          </div>
          <div style="text-align: right">
            <div class="clinical-id">REC-ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
            ${logoUri ? `<img src="${logoUri}" style="height: 45px; margin: 8px 0;" />` : `<div style="font-size: 22px; font-weight: 900; color: #C69C82">MUMMUM</div>`}
            <div style="font-size: 8px; color: #90A4AE; font-weight: 700;">DIGITAL HEALTH ASSISTANT</div>
          </div>
        </div>

        <div class="section-header">1. Growth & Health Analytics</div>
        <div class="chart-box">
          <canvas id="growthProgressionChart" height="110"></canvas>
        </div>
        <div class="stat-grid">
          <div class="stat-card"><b>${growthHistory[0]?.details?.weight || growthHistory[0]?.details?.value || '--'}kg</b><span>Current Weight</span></div>
          <div class="stat-card"><b>${growthHistory[0]?.details?.height || growthHistory[0]?.details?.value || '--'}cm</b><span>Current Height</span></div>
          <div class="stat-card"><b>${growthHistory.length}</b><span>Total Entries</span></div>
          <div class="stat-card"><b>${growthHistory.length > 1 ? (parseFloat(growthHistory[0]?.details?.weight || growthHistory[0]?.details?.value) - parseFloat(growthHistory[growthHistory.length-1]?.details?.weight || growthHistory[growthHistory.length-1]?.details?.value)).toFixed(2) : '0.0'}kg</b><span>Total Gain</span></div>
        </div>

        <div class="section-header">1.1 Cranial Development</div>
        <div class="cranial-card">
          <div class="head-shape">
            <div style="font-size: 10px; color: #fff; font-weight: 900;">HC</div>
          </div>
          <div style="flex: 1">
            <div class="cranial-label">Current Head Circumference</div>
            <div class="cranial-value">${latestHead ? latestHead + ' cm' : '--'}</div>
            <div style="font-size: 10px; color: ${parseFloat(headDiff) >= 0 ? '#2E7D32' : '#C62828'}; font-weight: 700; margin-top: 4px;">
              ${latestHead ? (parseFloat(headDiff) >= 0 ? '+' : '') + headDiff + ' cm growth since last measurement' : 'Waiting for more data'}
            </div>
          </div>
          <div style="width: 120px; border-left: 1px solid #EEE; padding-left: 15px;">
            <div class="cranial-label">Recent History</div>
            ${growthChartData.slice(-3).reverse().map(d => `
              <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px;">
                <span style="color: #90A4AE">${d.date}</span>
                <b style="color: #1B3C35">${d.head}cm</b>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="section-header">2. Medication & Dosage Log</div>
        <table>
          <thead>
            <tr>
              <th width="25%">Timestamp</th>
              <th width="45%">Medicine & Dosage</th>
              <th width="30%">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${medicineLogs.length > 0 ? medicineLogs.map(m => `
              <tr>
                <td><b>${format(new Date(m.timestamp), 'MMM d, yyyy')}</b><br/>${format(new Date(m.timestamp), 'h:mm a')}</td>
                <td><div class="med-name">${m.details?.name}</div><div style="color: #C69C82; font-weight: 700; font-size: 10px;">Dose: ${m.details?.dosage}</div></td>
                <td style="color: #607D8B; font-size: 10px;">${m.details?.reason || 'Routine care'}</td>
              </tr>
            `).join('') : '<tr><td colspan="3" style="text-align: center; color: #90A4AE;">No records.</td></tr>'}
          </tbody>
        </table>

        <div class="section-header">3. Immunization History</div>
        <table>
          <thead>
            <tr>
              <th width="25%">Date Given</th>
              <th width="55%">Vaccine Name</th>
              <th width="20%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${vaccineHistory.length > 0 ? vaccineHistory.map(v => {
              const isNew = isWithinInterval(new Date(v.timestamp), { start: startDate, end: endDate });
              return `
                <tr>
                  <td><b>${format(new Date(v.timestamp), 'MMM d, yyyy')}</b></td>
                  <td class="med-name">${v.details?.name}</td>
                  <td><span class="vaccine-badge ${isNew ? '' : 'old-badge'}">${isNew ? 'NEW' : 'OLD'}</span></td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="3" style="text-align: center; color: #90A4AE;">No records.</td></tr>'}
          </tbody>
        </table>

        <!-- PAGE 2: DAILY ACTIVITY LOG -->
        <div class="page-break"></div>
        <div class="report-header">
          <div>
            <span class="clinical-tag">DAILY CARE LOG • PAGE 2</span>
            <div class="main-title">Feeding & Activity History</div>
            <div style="color: #607D8B; font-size: 12px; margin-top: 4px;">
              Period: ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}
            </div>
          </div>
          <div style="text-align: right">
            ${logoUri ? `<img src="${logoUri}" style="height: 40px;" />` : ''}
          </div>
        </div>

        ${sortedDateKeys.length > 0 ? sortedDateKeys.map(dateKey => {
          const dailyActivities = groupedCareByDate[dateKey];
          return `
            <div class="date-day-header">${format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}</div>
            <table>
              <thead>
                <tr>
                  <th width="20%">Time</th>
                  <th width="20%">Category</th>
                  <th width="60%">Clinical Details</th>
                </tr>
              </thead>
              <tbody>
                ${dailyActivities.map(a => {
                  let details = 'Care entry';
                  if (a.type === 'feed') {
                    details = a.details?.feedMode === 'Breast' 
                      ? `Breastfeed • L: ${Math.round((a.details.leftDuration||0)/60)}m • R: ${Math.round((a.details.rightDuration||0)/60)}m`
                      : `${a.details?.feedMode} • ${a.details?.amount}${a.details?.unit}`;
                  } else if (a.type === 'sleep') {
                    details = `Duration: ${Math.round((a.details?.duration||0)/60)} mins • Quality: ${a.details?.quality || 'Good'}`;
                  } else if (a.type === 'diaper') {
                    details = `Type: ${a.details?.diaperType} • Status: ${a.details?.hasRash ? 'Rash noted' : 'Healthy'}`;
                  }
                  return `
                    <tr>
                      <td><b>${format(new Date(a.timestamp), 'h:mm a')}</b></td>
                      <td><span class="med-name" style="text-transform: uppercase; font-size: 9px; color: ${a.type === 'feed' ? '#2E7D32' : (a.type === 'sleep' ? '#1565C0' : '#E65100')}">${a.type}</span></td>
                      <td style="color: #4A5D4C;">${details}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `;
        }).join('') : '<div style="text-align: center; margin-top: 40px; color: #90A4AE;">No care activities recorded.</div>'}

        <div class="footer-grid">
          <div class="disclaimer">
            <b>CLINICAL DISCLAIMER:</b> This report is generated by Mummum Digital Assistant and is intended for informational and clinical record-keeping purposes only. It does not replace professional medical advice, diagnosis, or treatment. Please review these trends with your licensed pediatrician during your next consultation.
            <div style="margin-top: 5px; color: #607D8B;">Data Integrity Verified • Timestamp: ${format(new Date(), 'PPpp')}</div>
          </div>
          <div style="text-align: right">
            <div class="page-num">PAGE 1 of 2</div>
            ${latestMemoryPhotoBase64 ? `
              <div class="final-portrait-box">
                <img src="${latestMemoryPhotoBase64}" class="final-portrait" />
                <div class="portrait-label">Latest Achievement</div>
              </div>
            ` : ''}
          </div>
        </div>

        <script>
          window.onload = function() {
            const ctx = document.getElementById('growthProgressionChart').getContext('2d');
            new Chart(ctx, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(growthChartData.map(d => d.date))},
                datasets: [{
                  label: 'Weight (kg)',
                  data: ${JSON.stringify(growthChartData.map(d => d.weight))},
                  borderColor: '#C69C82',
                  backgroundColor: 'rgba(198, 156, 130, 0.1)',
                  yAxisID: 'yWeight',
                  tension: 0.4,
                  fill: true,
                  pointRadius: 4
                }, {
                  label: 'Height (cm)',
                  data: ${JSON.stringify(growthChartData.map(d => d.height))},
                  borderColor: '#1B3C35',
                  borderDash: [5, 5],
                  yAxisID: 'yHeight',
                  tension: 0.4,
                  fill: false,
                  pointRadius: 4
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Disable animation for PDF print stability
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: { boxWidth: 12, padding: 15, font: { size: 10, weight: 'bold' } }
                  }
                },
                scales: {
                  yWeight: { 
                    type: 'linear', 
                    display: true, 
                    position: 'left',
                    ticks: { color: '#C69C82' },
                    title: { 
                      display: true, 
                      text: 'Weight (kg)', 
                      color: '#C69C82',
                      font: { size: 10, weight: 'bold' } 
                    }
                  },
                  yHeight: { 
                    type: 'linear', 
                    display: true, 
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#1B3C35' },
                    title: { 
                      display: true, 
                      text: 'Height (cm)', 
                      color: '#1B3C35',
                      font: { size: 10, weight: 'bold' } 
                    }
                  }
                }
              }
            });
          };
        </script>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    
    // Safety delay for filesystem sync on iOS
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: `${baby?.name || 'Baby'}'s Clinical Report` });
    }
  } catch (error) {
    console.error('Master Report Generation Error:', error);
    Alert.alert('Export Failed', 'The PDF could not be generated. Please ensure you have enough storage space.');
  }
};
