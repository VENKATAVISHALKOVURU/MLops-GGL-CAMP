import { churnDataset } from '../data/churn_dataset.js';
import { state } from '../data/models_state.js';

// Global Chart Instances
export let charts = {
  overview: null,
  drawer: null,
  drift: null,
  importance: null,
  gpuTelemetry: null,
  serverLoad: null
};

// Default Styling Options
const chartFont = {
  family: "'Inter', sans-serif",
  size: 11
};

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#cbd5e1',
        font: chartFont,
        usePointStyle: true,
        boxWidth: 6
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      titleFont: { family: "'Outfit', sans-serif", size: 12, weight: '600' },
      bodyFont: chartFont,
      padding: 12,
      cornerRadius: 8,
      displayColors: true
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'transparent'
      },
      ticks: {
        color: '#64748b',
        font: chartFont
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'transparent'
      },
      ticks: {
        color: '#64748b',
        font: chartFont
      }
    }
  }
};

// Initialize Main Dashboard Overview Charts
export function initCharts() {
  const overviewCanvas = document.getElementById('overview-chart');
  if (!overviewCanvas) return;
  
  const ctx = overviewCanvas.getContext('2d');
  
  // Gradients
  const gradCyan = ctx.createLinearGradient(0, 0, 0, 280);
  gradCyan.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
  gradCyan.addColorStop(1, 'rgba(6, 182, 212, 0)');
  
  const gradViolet = ctx.createLinearGradient(0, 0, 0, 280);
  gradViolet.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
  gradViolet.addColorStop(1, 'rgba(139, 92, 246, 0)');

  charts.overview = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: 12}, (_, i) => `${(i+1)*5}s ago`).reverse(),
      datasets: [
        {
          label: 'Inferences / Sec (Right Axis)',
          data: [1200, 1280, 1150, 1310, 1400, 1390, 1420, 1380, 1450, 1410, 1390, 1402],
          borderColor: '#06b6d4',
          borderWidth: 1.5,
          backgroundColor: gradCyan,
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointBackgroundColor: '#06b6d4',
          yAxisID: 'y1'
        },
        {
          label: 'Latency (ms) (Left Axis)',
          data: [21.4, 20.8, 22.1, 19.5, 18.2, 19.0, 18.7, 18.9, 17.5, 18.1, 18.6, 18.4],
          borderColor: '#8b5cf6',
          borderWidth: 1.5,
          backgroundColor: gradViolet,
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointBackgroundColor: '#8b5cf6',
          yAxisID: 'y'
        }
      ]
    },
    options: {
      ...commonOptions,
      scales: {
        x: commonOptions.scales.x,
        y: {
          ...commonOptions.scales.y,
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Latency (ms)', color: '#64748b' }
        },
        y1: {
          ...commonOptions.scales.y,
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Inferences/Sec', color: '#64748b' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });

  // Render initial card sparklines
  if (state && state.metricsHistory) {
    drawSparkline('sparkline-deployments', state.metricsHistory.deployments, 'rgba(16, 185, 129, 1)'); // Success / Emerald
    drawSparkline('sparkline-latency', state.metricsHistory.latency, 'rgba(139, 92, 246, 1)'); // Violet / Purple
    drawSparkline('sparkline-gpu', state.metricsHistory.gpu, 'rgba(245, 158, 11, 1)'); // Warning / Amber
    drawSparkline('sparkline-ips', state.metricsHistory.ips, 'rgba(6, 182, 212, 1)'); // Cyan
  }
}

// Update Drawer Inspection Performance History Chart
export function updateDrawerChart(historyData, modelName) {
  const drawerCanvas = document.getElementById('drawer-performance-chart');
  if (!drawerCanvas) return;
  
  if (charts.drawer) {
    charts.drawer.destroy();
  }
  
  const ctx = drawerCanvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 150);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
  
  charts.drawer = new Chart(ctx, {
    type: 'line',
    data: {
      labels: historyData.map((_, idx) => `v${idx + 1}.0`),
      datasets: [{
        label: `${modelName} Performance (Accuracy %)`,
        data: historyData,
        borderColor: '#06b6d4',
        borderWidth: 1.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: '#06b6d4'
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        x: commonOptions.scales.x,
        y: {
          ...commonOptions.scales.y,
          min: Math.max(0, Math.min(...historyData) - 5),
          max: 100
        }
      }
    }
  });
}

// Initialize Tab 4: Drift & Monitoring Charts
export function renderDriftCharts() {
  const driftCanvas = document.getElementById('drift-chart');
  const importanceCanvas = document.getElementById('importance-chart');
  if (!driftCanvas || !importanceCanvas) return;
  
  // 1. Churn Dataset Age Shift comparison
  const driftCtx = driftCanvas.getContext('2d');
  charts.drift = new Chart(driftCtx, {
    type: 'bar',
    data: {
      labels: churnDataset.ageDistribution.labels,
      datasets: [
        {
          label: 'Baseline Age Dist %',
          data: churnDataset.ageDistribution.baseline,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Production Age Dist % (Shifted)',
          data: churnDataset.ageDistribution.production,
          backgroundColor: 'rgba(236, 72, 153, 0.75)', // pink
          borderRadius: 4
        }
      ]
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        legend: {
          ...commonOptions.plugins.legend
        }
      }
    }
  });

  // 2. Churn Dataset Feature Importances comparison
  const impCtx = importanceCanvas.getContext('2d');
  charts.importance = new Chart(impCtx, {
    type: 'bar',
    data: {
      labels: churnDataset.importances.labels,
      datasets: [
        {
          label: 'Baseline Feature Attrib %',
          data: churnDataset.importances.baseline,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Production Attrib %',
          data: churnDataset.importances.production,
          backgroundColor: 'rgba(6, 182, 212, 0.75)', // cyan
          borderRadius: 4
        }
      ]
    },
    options: {
      ...commonOptions,
      indexAxis: 'y'
    }
  });
}

// Initialize Tab 5: Telemetry Charts
export function renderTelemetryCharts() {
  const gpuCanvas = document.getElementById('gpu-telemetry-chart');
  const serverCanvas = document.getElementById('server-load-chart');
  if (!gpuCanvas || !serverCanvas) return;
  
  // GPU Multi-Line
  const gpuCtx = gpuCanvas.getContext('2d');
  charts.gpuTelemetry = new Chart(gpuCtx, {
    type: 'line',
    data: {
      labels: Array.from({length: 10}, (_, i) => `${(10-i)*10}s ago`),
      datasets: [
        {
          label: 'Tesla A100 Temp (C)',
          data: [62, 63, 65, 64, 66, 68, 67, 65, 64, 63],
          borderColor: '#ef4444',
          borderWidth: 1.5,
          fill: false,
          tension: 0.3,
          pointRadius: 2
        },
        {
          label: 'VRAM Utilization (%)',
          data: [72, 70, 75, 78, 82, 85, 80, 77, 72, 70],
          borderColor: '#10b981',
          borderWidth: 1.5,
          fill: false,
          tension: 0.3,
          pointRadius: 2
        }
      ]
    },
    options: commonOptions
  });

  // Server Load Area
  const serverCtx = serverCanvas.getContext('2d');
  const gradServer = serverCtx.createLinearGradient(0, 0, 0, 250);
  gradServer.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
  gradServer.addColorStop(1, 'rgba(139, 92, 246, 0)');
  
  charts.serverLoad = new Chart(serverCtx, {
    type: 'line',
    data: {
      labels: Array.from({length: 10}, (_, i) => `${10-i}m ago`),
      datasets: [{
        label: 'Inference gateway queries / min',
        data: [7200, 7500, 8100, 8400, 9200, 11000, 10500, 9500, 9800, 10200],
        borderColor: '#8b5cf6',
        borderWidth: 1.5,
        backgroundColor: gradServer,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#8b5cf6'
      }]
    },
    options: commonOptions
  });
}

// Render dynamic canvas sparklines
export function drawSparkline(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  // Set display size
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.scale(dpr, dpr);
  
  const width = rect.width;
  const height = rect.height;
  
  ctx.clearRect(0, 0, width, height);
  
  if (data.length < 2) return;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  ctx.beginPath();
  
  // Map points to canvas coordinates
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    // Leave padding top and bottom
    const y = 6 + (1 - (val - min) / range) * (height - 12);
    return { x, y };
  });
  
  ctx.moveTo(points[0].x, points[0].y);
  
  // Draw curve using quadratic curves for smoothness
  for (let i = 0; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  
  // Create gradient fill underneath
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, color.replace(')', ', 0.15)'));
  gradient.addColorStop(1, color.replace(')', ', 0)'));
  ctx.fillStyle = gradient;
  ctx.fill();
}

