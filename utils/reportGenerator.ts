import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, subDays, isWithinInterval } from 'date-fns';
import { Alert } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export const generateBabyReport = async (baby: any, activities: any[], days: number, memories: any[] = [], appointments: any[] = [], dayCareLogs: any[] = []) => {
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
  const medicineLogs = activities.filter(a => {
    const activityDate = new Date(a.timestamp);
    return a.type === 'medicine' && isWithinInterval(activityDate, { start: startDate, end: endDate });
  }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const vaccineHistory = activities.filter(a => {
    const activityDate = new Date(a.timestamp);
    return (a.type === 'vaccination' || a.type === 'vaccine') && isWithinInterval(activityDate, { start: startDate, end: endDate });
  }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const growthHistory = activities.filter(a => a.type === 'growth').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const filteredAppointments = appointments.filter(a => {
    const apptDate = new Date(a.date);
    return isWithinInterval(apptDate, { start: startDate, end: endDate });
  }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredDayCare = dayCareLogs.filter(l => {
    const logDate = new Date(l.date);
    return isWithinInterval(logDate, { start: startDate, end: endDate });
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Convert baby photo to base64 for PDF rendering
  let babyPhotoBase64 = null;
  if (baby?.photoUri) {
    try {
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

  const groupedCareByDate: { [key: string]: any[] } = {};
  weeklyCare.forEach(activity => {
    const dateKey = format(new Date(activity.timestamp), 'yyyy-MM-dd');
    if (!groupedCareByDate[dateKey]) groupedCareByDate[dateKey] = [];
    groupedCareByDate[dateKey].push(activity);
  });

  const sortedDateKeys = Object.keys(groupedCareByDate).sort((a, b) => b.localeCompare(a));

  const growthChartData = growthHistory.slice().reverse().map(a => ({
    date: format(new Date(a.timestamp), 'MMM d'),
    weight: a.details?.metric === 'Weight' ? parseFloat(a.details?.value || 0) : 0,
    height: a.details?.metric === 'Height' ? parseFloat(a.details?.value || 0) : 0,
    head: a.details?.metric === 'Head Circ' ? parseFloat(a.details?.value || 0) : 0
  }));

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
          
          .dc-log-card { background: #F8F9FA; border-radius: 8px; padding: 10px; border-left: 3px solid #009688; margin-bottom: 10px; }
          .dc-meta { display: flex; justify-content: space-between; font-size: 10px; color: #607D8B; margin-bottom: 5px; }
          
          .footer-grid { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #EEE; padding-top: 15px; margin-top: 40px; }
          .disclaimer { font-size: 8px; color: #90A4AE; width: 65%; line-height: 1.4; }
          
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
          </div>
          <div style="text-align: right">
            ${logoUri ? `<img src="${logoUri}" style="height: 45px; margin: 8px 0;" />` : `<div style="font-size: 22px; font-weight: 900; color: #C69C82">MUMMUM</div>`}
          </div>
        </div>

        <div class="section-header">1. Growth & Health Analytics</div>
        <div class="chart-box">
          <canvas id="growthProgressionChart" height="110"></canvas>
        </div>

        <div class="section-header">2. Clinical Appointments</div>
        <table>
          <thead>
            <tr>
              <th width="20%">Date</th>
              <th width="40%">Visit Purpose</th>
              <th width="40%">Provider & Notes</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAppointments.length > 0 ? filteredAppointments.map(a => `
              <tr>
                <td><b>${format(parseISO(a.date), 'MMM d, yyyy')}</b><br/>${a.time}</td>
                <td><b style="color: #1B3C35">${a.title}</b></td>
                <td><div style="color: #607D8B; font-weight: 700;">Dr. ${a.doctor}</div><div style="font-size: 10px; margin-top: 4px;">${a.notes || 'No notes recorded.'}</div></td>
              </tr>
            `).join('') : '<tr><td colspan="3" style="text-align: center; color: #90A4AE; padding: 20px;">No appointments in this period.</td></tr>'}
          </tbody>
        </table>

        <div class="section-header">3. Day Care Reports</div>
        ${filteredDayCare.length > 0 ? filteredDayCare.map(l => `
          <div class="dc-log-card">
            <div class="dc-meta">
              <b>${format(parseISO(l.date), 'EEEE, MMMM dd')}</b>
              <span>Drop-off: ${l.dropOffTime || '--'} | Pick-up: ${l.pickUpTime || '--'}</span>
            </div>
            <div style="font-size: 11px; color: #1B3C35; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #E0E0E0;">
              <b>Teacher Notes:</b> ${l.notes || 'Routine day, no specific notes.'}
            </div>
          </div>
        `).join('') : '<div style="text-align: center; color: #90A4AE; padding: 10px; font-size: 11px;">No day care activity recorded.</div>'}

        <div class="section-header">4. Medication & Immunization</div>
        <table>
          <thead>
            <tr>
              <th width="30%">Timestamp</th>
              <th width="40%">Medicine/Vaccine</th>
              <th width="30%">Details</th>
            </tr>
          </thead>
          <tbody>
            ${medicineLogs.map(m => `
              <tr>
                <td>${format(new Date(m.timestamp), 'MMM d, h:mm a')}</td>
                <td><b>${m.details?.name}</b></td>
                <td>Dose: ${m.details?.dosage}</td>
              </tr>
            `).join('')}
            ${vaccineHistory.map(v => `
              <tr>
                <td>${format(new Date(v.timestamp), 'MMM d, yyyy')}</td>
                <td><b>${v.details?.name}</b></td>
                <td>Vaccination</td>
              </tr>
            `).join('')}
            ${medicineLogs.length === 0 && vaccineHistory.length === 0 ? '<tr><td colspan="3" style="text-align: center; color: #90A4AE;">No records.</td></tr>' : ''}
          </tbody>
        </table>

        <div class="page-break"></div>
        <div class="section-header">5. Daily Care Log (Feeding & Sleep)</div>
        ${sortedDateKeys.map(dateKey => {
          const dailyActivities = groupedCareByDate[dateKey];
          return `
            <div class="date-day-header">${format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}</div>
            <table>
              <thead>
                <tr>
                  <th width="20%">Time</th>
                  <th width="20%">Category</th>
                  <th width="60%">Details</th>
                </tr>
              </thead>
              <tbody>
                ${dailyActivities.map(a => {
                  let details = 'Care entry';
                  if (a.type === 'feed') details = a.details?.feedMode === 'Breast' ? `Breastfeed • L: ${Math.round((a.details.leftDuration||0)/60)}m • R: ${Math.round((a.details.rightDuration||0)/60)}m` : `${a.details?.feedMode} • ${a.details?.amount}${a.details?.unit}`;
                  else if (a.type === 'sleep') details = `Duration: ${Math.round((a.details?.duration||0)/60)} mins`;
                  else if (a.type === 'diaper') details = `Type: ${a.details?.diaperType}`;
                  return `<tr><td>${format(new Date(a.timestamp), 'h:mm a')}</td><td>${a.type}</td><td>${details}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          `;
        }).join('')}

        <div class="footer-grid">
          <div class="disclaimer">
            <b>CLINICAL DISCLAIMER:</b> This report is generated by Mummum Digital Assistant and is intended for informational and clinical record-keeping purposes only. It does not replace professional medical advice.
          </div>
          <div style="text-align: right">
            ${logoUri ? `<img src="${logoUri}" style="height: 30px;" />` : ''}
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
                }, {
                  label: 'Height (cm)',
                  data: ${JSON.stringify(growthChartData.map(d => d.height))},
                  borderColor: '#1B3C35',
                  borderDash: [5, 5],
                  yAxisID: 'yHeight',
                  tension: 0.4,
                  fill: false,
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: { legend: { display: true, position: 'top' } },
                scales: {
                  yWeight: { type: 'linear', position: 'left' },
                  yHeight: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } }
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
    await new Promise(resolve => setTimeout(resolve, 500));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: `${baby?.name || 'Baby'}'s Clinical Report` });
    }
  } catch (error) {
    console.error('Master Report Generation Error:', error);
    Alert.alert('Export Failed', 'The PDF could not be generated.');
  }
};

