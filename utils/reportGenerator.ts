import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, subDays, isWithinInterval } from 'date-fns';
import { Alert } from 'react-native';

export const generateBabyReport = async (baby: any, activities: any[], days: number) => {
  if (!Print.printToFileAsync || !Sharing.shareAsync) {
    Alert.alert('Rebuild Required', 'PDF modules are not yet linked. Please run "npx expo run:ios".');
    return;
  }

  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  const filteredActivities = activities.filter(a => {
    const activityDate = new Date(a.timestamp);
    return isWithinInterval(activityDate, { start: startDate, end: endDate });
  }).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Data Processing for Charts
  const growthData = filteredActivities.filter(a => a.type === 'growth').map(a => ({
    x: format(new Date(a.timestamp), 'MMM d'),
    y: parseFloat(a.details?.weight || 0)
  }));

  const diaperStats = {
    wet: filteredActivities.filter(a => a.type === 'diaper' && a.details?.diaperType === 'Wet').length,
    dirty: filteredActivities.filter(a => a.type === 'diaper' && a.details?.diaperType === 'Dirty').length,
    mixed: filteredActivities.filter(a => a.type === 'diaper' && a.details?.diaperType === 'Mixed').length,
  };

  const activityCounts = {
    Feeding: filteredActivities.filter(a => a.type === 'feed').length,
    Sleep: filteredActivities.filter(a => a.type === 'sleep').length,
    Diaper: filteredActivities.filter(a => a.type === 'diaper').length,
    Milestones: filteredActivities.filter(a => a.type === 'milestone').length,
  };

  const html = `
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #1B3C35; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #C69C82; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 32px; font-weight: 800; color: #1B3C35; }
          .baby-info { font-size: 16px; color: #607D8B; margin-top: 8px; }
          
          .summary-dashboard { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 40px; }
          .summary-card { background: #F8FAFB; padding: 15px; border-radius: 20px; text-align: center; border: 1px solid #E3F2FD; }
          .summary-card b { font-size: 20px; color: #C69C82; display: block; }
          .summary-card span { font-size: 10px; text-transform: uppercase; color: #90A4AE; letter-spacing: 1px; }

          .chart-section { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; margin-bottom: 40px; }
          .chart-container { background: #fff; border-radius: 24px; padding: 20px; border: 1px solid #F0F0F0; }
          .chart-title { font-size: 14px; font-weight: 700; margin-bottom: 15px; color: #4A5D4C; text-transform: uppercase; }

          .pie-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
          
          table { width: 100%; border-collapse: separate; border-spacing: 0 8px; margin-top: 20px; }
          th { text-align: left; padding: 12px; font-size: 11px; color: #90A4AE; text-transform: uppercase; }
          td { padding: 12px; background: #F8FAFB; font-size: 13px; }
          td:first-child { border-radius: 12px 0 0 12px; }
          td:last-child { border-radius: 0 12px 12px 0; }
          
          .type-tag { font-weight: 800; font-size: 10px; padding: 4px 8px; border-radius: 6px; background: #C69C82; color: #fff; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #B0BEC5; border-top: 1px solid #EEE; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Mummum Analytics</div>
            <div class="baby-info"><b>${baby?.name || 'Patient'}</b> • ${days} Day Clinical History • ${format(new Date(), 'MMM d, yyyy')}</div>
          </div>
          <div style="text-align: right">
            <div style="font-weight: bold; color: #C69C82">PREMIUM REPORT</div>
            <div style="font-size: 12px; color: #90A4AE">v2.4.0</div>
          </div>
        </div>

        <div class="summary-dashboard">
          <div class="summary-card"><b>${activityCounts.Feeding}</b><span>Total Feeds</span></div>
          <div class="summary-card"><b>${activityCounts.Diaper}</b><span>Diapers</span></div>
          <div class="summary-card"><b>${activityCounts.Milestones}</b><span>Milestones</span></div>
          <div class="summary-card"><b>${(filteredActivities.length / days).toFixed(1)}</b><span>Daily Avg</span></div>
        </div>

        <div class="chart-section">
          <div class="chart-container">
            <div class="chart-title">Weight Progression (Trend Analysis)</div>
            <canvas id="growthChart" height="180"></canvas>
          </div>
          <div class="pie-grid">
            <div class="chart-container">
              <div class="chart-title">Diaper Health Distribution</div>
              <canvas id="diaperChart" height="150"></canvas>
            </div>
          </div>
        </div>

        <h3>Detailed Clinical Timeline</h3>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Category</th>
              <th>Clinical Details</th>
            </tr>
          </thead>
          <tbody>
            ${filteredActivities.slice().reverse().map(a => {
              let details = 'Standard Entry';
              if (a.type === 'feed') {
                if (a.details?.feedMode === 'Breast') {
                  const left = a.details.leftDuration ? `L: ${Math.round(a.details.leftDuration/60)}m` : '';
                  const right = a.details.rightDuration ? `R: ${Math.round(a.details.rightDuration/60)}m` : '';
                  details = `Breastfeed • ${[left, right].filter(Boolean).join(' • ')}`;
                } else {
                  details = `${a.details?.feedMode} • ${a.details?.amount}${a.details?.unit}`;
                }
              } else if (a.type === 'sleep') {
                details = `Slept for ${Math.round((a.details?.duration || 0)/60)} mins • ${a.details?.quality || 'Peaceful'}`;
              } else if (a.type === 'diaper') {
                details = `${a.details?.diaperType} • ${a.details?.hasRash ? 'Rash noted' : 'Clean'}`;
              }

              return `
                <tr>
                  <td><b>${format(new Date(a.timestamp), 'MMM d')}</b><br/>${format(new Date(a.timestamp), 'h:mm a')}</td>
                  <td><span class="type-tag" style="background: ${a.type === 'feed' ? '#2E7D32' : (a.type === 'sleep' ? '#1565C0' : '#E65100')}">${a.type.toUpperCase()}</span></td>
                  <td>${details}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          Confidential Medical Data Generated via Mummum Baby Assistant.<br/>
          This document is intended for professional pediatric review.
        </div>

        <script>
          // Growth Chart
          new Chart(document.getElementById('growthChart'), {
            type: 'line',
            data: {
              labels: ${JSON.stringify(growthData.map(d => d.x))},
              datasets: [{
                label: 'Weight (kg)',
                data: ${JSON.stringify(growthData.map(d => d.y))},
                borderColor: '#C69C82',
                backgroundColor: 'rgba(198, 156, 130, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointBackgroundColor: '#C69C82'
              }]
            },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } }
          });

          // Diaper Chart
          new Chart(document.getElementById('diaperChart'), {
            type: 'doughnut',
            data: {
              labels: ['Wet', 'Dirty', 'Mixed'],
              datasets: [{
                data: [${diaperStats.wet}, ${diaperStats.dirty}, ${diaperStats.mixed}],
                backgroundColor: ['#90CAF9', '#FFAB91', '#A5D6A7'],
                borderWidth: 0
              }]
            },
            options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
          });
        </script>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Advanced PDF Generation Error:', error);
  }
};
