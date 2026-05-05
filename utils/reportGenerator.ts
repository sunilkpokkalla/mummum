import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, subDays, isWithinInterval } from 'date-fns';
import { Alert } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

export const generateBabyReport = async (baby: any, activities: any[], days: number) => {
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
    weight: parseFloat(a.details?.weight || a.details?.value || 0),
    height: parseFloat(a.details?.height || a.details?.value || 0)
  }));

  const html = `
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 25px; color: #1B3C35; background: #fff; line-height: 1.3; }
          .report-header { border-bottom: 4px solid #C69C82; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .main-title { font-size: 24px; font-weight: 900; color: #1B3C35; text-transform: uppercase; letter-spacing: 1px; }
          .clinical-tag { background: #1B3C35; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; vertical-align: middle; }
          
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
          
          .med-name { font-weight: 700; color: #1B3C35; font-size: 12px; }
          .vaccine-badge { background: #E8F5E9; color: #2E7D32; padding: 2px 6px; border-radius: 10px; font-weight: 800; font-size: 8px; }
          .old-badge { background: #ECEFF1; color: #546E7A; }
          
          .footer { margin-top: 40px; border-top: 1px solid #EEE; padding-top: 12px; text-align: center; font-size: 9px; color: #90A4AE; }
          @media print { .page-break { page-break-before: always; } }
        </style>
      </head>
      <body>
        <!-- PAGE 1: MUMMUM ANALYTICS -->
        <div class="report-header">
          <div>
            <span class="clinical-tag">${periodLabel.toUpperCase()} CLINICAL REPORT</span>
            <div class="main-title">${baby?.name || 'Baby'}'s ${periodLabel}</div>
            <div style="color: #607D8B; font-size: 12px; margin-top: 4px;">
              Born: ${baby?.birthDate ? format(new Date(baby.birthDate), 'PPP') : 'Not Recorded'} • Report: ${format(new Date(), 'PPP')}
            </div>
          </div>
          <div style="text-align: right">
            ${logoUri ? `<img src="${logoUri}" style="height: 50px; margin-bottom: 5px;" />` : `<div style="font-size: 20px; font-weight: 900; color: #C69C82">MUMMUM</div>`}
            <div style="font-size: 9px; color: #90A4AE">Premium Assistant</div>
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

        <div class="footer">
          Generated via Mummum Baby Assistant • Premium Clinical Records<br/>
          This document is a professional history of care events for ${baby?.name || 'the baby'}.
        </div>

        <script>
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
              scales: {
                yWeight: { type: 'linear', position: 'left', title: { display: true, text: 'Wt (kg)', font: { size: 9 } } },
                yHeight: { type: 'linear', position: 'right', title: { display: true, text: 'Ht (cm)', font: { size: 9 } }, grid: { drawOnChartArea: false } }
              },
              plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 9 } } } }
            }
          });
        </script>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Master Report Generation Error:', error);
  }
};
