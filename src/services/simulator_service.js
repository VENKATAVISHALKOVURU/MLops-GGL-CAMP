import { charts } from './charts_service.js';
import { state, showToast, renderModelsTable, renderActivityList } from '../main.js';

let telemetryInterval = null;
let pipelineInterval = null;

// Pipeline Training States
let isTrainingActive = true;
let trainingEpoch = 14;
const totalEpochs = 50;
let currentLoss = 0.24;

// Console log templates for Bank Churn XGBoost model
const trainingLogs = [
  "Initializing distributed XGBoost environment... Shards loaded.",
  "Importing Kaggle Bank Customer Churn dataset (10,000 samples)... Done.",
  "Running data validation schemas: Target class [Churn] balance ratio: 20.37% / 79.63%",
  "Encoding categorical properties: geography [one-hot], gender [binary]...",
  "Applying MinMaxScaler scaling factors on features: Balance, EstimatedSalary, CreditScore",
  "Compiling XGBoost parameters: eta=0.05, max_depth=6, gamma=0.1, subsample=0.8, colsample_bytree=0.8",
  "Beginning model retraining sequence..."
];

export function startSimulator() {
  // 1. Initial Logs Setup
  const consoleEl = document.getElementById('log-console');
  if (consoleEl) {
    consoleEl.innerHTML = '';
    trainingLogs.forEach(log => appendLogLine(log, 'info'));
    for (let i = 1; i <= trainingEpoch; i++) {
      currentLoss = +(currentLoss - (Math.random() * 0.01)).toFixed(4);
      if (currentLoss < 0.05) currentLoss = 0.05;
      appendLogLine(`Boosting Round ${i}/${totalEpochs} - train-logloss: ${currentLoss} - val-logloss: ${(currentLoss * 1.15).toFixed(4)} - auc: ${(88 + (i * 0.22)).toFixed(2)}%`, 'success');
    }
  }

  // 2. Start Periodic Telemetry Tickers
  telemetryInterval = setInterval(() => {
    updateDynamicMetrics();
  }, 2500);

  // 3. Start Training Loop Simulation
  runTrainingStep();
  pipelineInterval = setInterval(() => {
    if (isTrainingActive) {
      runTrainingStep();
    }
  }, 3000);

  // 4. Random Alerts Dispatcher
  setInterval(() => {
    if (Math.random() > 0.75) {
      triggerRandomAlert();
    }
  }, 15000);
}

// Telemetry Updates
function updateDynamicMetrics() {
  // Update numerical card nodes
  const latencyEl = document.getElementById('metric-latency');
  const gpuEl = document.getElementById('metric-gpu-load');
  const ipsEl = document.getElementById('metric-ips');
  
  const currentLatency = (16.5 + Math.random() * 4).toFixed(1);
  const currentGpu = (60 + Math.random() * 10).toFixed(1);
  const currentIps = Math.floor(1350 + Math.random() * 120);

  if (latencyEl) latencyEl.textContent = `${currentLatency} ms`;
  if (gpuEl) gpuEl.textContent = `${currentGpu}%`;
  if (ipsEl) ipsEl.textContent = currentIps.toLocaleString();

  // 1. Update Overview Chart
  if (charts.overview) {
    const data1 = charts.overview.data.datasets[0].data; // Req/sec
    const data2 = charts.overview.data.datasets[1].data; // Latency
    
    data1.shift();
    data1.push(currentIps);
    
    data2.shift();
    data2.push(parseFloat(currentLatency));
    
    charts.overview.update('none'); // Update smoothly without reset animations
  }

  // 2. Update Telemetry Charts (GPU & Load)
  if (charts.gpuTelemetry) {
    const tempDataset = charts.gpuTelemetry.data.datasets[0].data;
    const memDataset = charts.gpuTelemetry.data.datasets[1].data;
    
    tempDataset.shift();
    tempDataset.push(Math.floor(62 + Math.random() * 8));
    
    memDataset.shift();
    memDataset.push(Math.floor(70 + Math.random() * 18));
    
    charts.gpuTelemetry.update('none');
  }

  if (charts.serverLoad) {
    const loadDataset = charts.serverLoad.data.datasets[0].data;
    loadDataset.shift();
    loadDataset.push(Math.floor(9500 + Math.random() * 2000));
    
    charts.serverLoad.update('none');
  }
}

// Pipeline Step Simulation
function runTrainingStep() {
  const nodeTrainingDesc = document.getElementById('node-training-desc');
  const logConsole = document.getElementById('log-console');
  const nodeTraining = document.getElementById('node-training');
  const nodeEvaluation = document.getElementById('node-evaluation');
  const nodeDeployment = document.getElementById('node-deployment');
  const statusBadge = document.getElementById('pipeline-status-badge');
  
  if (trainingEpoch < totalEpochs) {
    trainingEpoch++;
    currentLoss = +(currentLoss - (Math.random() * 0.005)).toFixed(4);
    if (currentLoss < 0.03) currentLoss = 0.03;
    
    if (nodeTrainingDesc) {
      nodeTrainingDesc.textContent = `Round ${trainingEpoch}/${totalEpochs} | Loss: ${currentLoss}`;
    }
    
    appendLogLine(`Boosting Round ${trainingEpoch}/${totalEpochs} - train-logloss: ${currentLoss} - val-logloss: ${(currentLoss * 1.12).toFixed(4)} - auc: ${(88 + (trainingEpoch * 0.22)).toFixed(2)}%`, 'success');
  } 
  else if (trainingEpoch === totalEpochs) {
    // Transition to Evaluation Node
    trainingEpoch++; 
    
    if (nodeTraining) {
      nodeTraining.classList.remove('active');
      nodeTraining.querySelector('.node-status').className = 'node-status complete';
      nodeTraining.querySelector('.node-status').innerHTML = '<i data-lucide="check"></i>';
    }
    
    if (nodeEvaluation) {
      nodeEvaluation.classList.add('active');
      nodeEvaluation.querySelector('.node-status').className = 'node-status active';
      nodeEvaluation.querySelector('.node-status').innerHTML = '<i data-lucide="play" class="status-dot"></i>';
      nodeEvaluation.querySelector('.node-desc').textContent = 'Validating PR-AUC and F1...';
    }
    
    if (statusBadge) {
      statusBadge.textContent = 'Evaluating Model';
      statusBadge.className = 'badge staging';
    }
    
    appendLogLine("Training complete. Starting Model Evaluation splits...", "info");
    lucide.createIcons();
    
    // Schedule deployment step
    setTimeout(() => {
      if (!isTrainingActive) return;
      
      if (nodeEvaluation) {
        nodeEvaluation.classList.remove('active');
        nodeEvaluation.querySelector('.node-status').className = 'node-status complete';
        nodeEvaluation.querySelector('.node-status').innerHTML = '<i data-lucide="check"></i>';
        nodeEvaluation.querySelector('.node-desc').textContent = 'AUC: 94.2% | F1: 93.8%';
      }
      
      if (nodeDeployment) {
        nodeDeployment.classList.add('active');
        nodeDeployment.querySelector('.node-status').className = 'node-status active';
        nodeDeployment.querySelector('.node-status').innerHTML = '<i data-lucide="play" class="status-dot"></i>';
        nodeDeployment.querySelector('.node-desc').textContent = 'Saving serialized artifact...';
      }
      
      if (statusBadge) {
        statusBadge.textContent = 'Deploying Model';
        statusBadge.className = 'badge prod';
      }
      
      appendLogLine("Classification evaluation complete. [Accuracy: 94.22%], [F1-Score: 93.81%], [PR-AUC: 94.50%]", "success");
      appendLogLine("Uploading booster state variables to model registry store...", "info");
      lucide.createIcons();
      
      // Schedule completion
      setTimeout(() => {
        if (!isTrainingActive) return;
        
        if (nodeDeployment) {
          nodeDeployment.classList.remove('active');
          nodeDeployment.querySelector('.node-status').className = 'node-status complete';
          nodeDeployment.querySelector('.node-status').innerHTML = '<i data-lucide="check"></i>';
          nodeDeployment.querySelector('.node-desc').textContent = 'Successfully deployed';
        }
        
        if (statusBadge) {
          statusBadge.textContent = 'Completed';
          statusBadge.className = 'badge prod';
          statusBadge.style.background = 'rgba(16, 185, 129, 0.1)';
          statusBadge.style.color = 'var(--success)';
        }
        
        appendLogLine("Successfully deployed Bank-Churn-XGBoost [v2.4.1] model artifact to production cluster.", "success");
        appendLogLine("Pipeline finished. Status: SUCCESS.", "success");
        
        // Update models state
        const targetModel = state.models.find(m => m.id === "m-001");
        if (targetModel) {
          targetModel.accuracy = 94.2;
          targetModel.f1 = 93.8;
          targetModel.version = "v2.4.1";
          targetModel.stage = "production";
          targetModel.updated = new Date().toISOString().slice(0, 16).replace('T', ' ');
          targetModel.history.push(94.2);
          renderModelsTable();
        }
        
        state.activities.unshift({
          id: Date.now(),
          name: "Bank-Churn-XGBoost",
          type: "Retrain Pipeline",
          status: "success",
          time: "Just now",
          meta: "Pipeline completed. Promoted v2.4.1 to Production."
        });
        renderActivityList();
        
        showToast("Model retraining pipeline complete!", "success");
        isTrainingActive = false;
        lucide.createIcons();
      }, 5000);
      
    }, 5000);
  }
}

// Trigger Pipeline Run
export function startTrainingRun() {
  if (isTrainingActive) {
    showToast("A pipeline execution is currently active.", "warn");
    return;
  }
  
  isTrainingActive = true;
  trainingEpoch = 0;
  currentLoss = 0.65;
  
  const consoleEl = document.getElementById('log-console');
  if (consoleEl) consoleEl.innerHTML = '';
  
  resetPipelineNodes();
  
  const statusBadge = document.getElementById('pipeline-status-badge');
  if (statusBadge) {
    statusBadge.textContent = 'Training in Progress';
    statusBadge.className = 'badge staging';
    statusBadge.removeAttribute('style');
  }
  
  appendLogLine("Triggered pipeline execution manually. Downloading new partition...", "info");
  
  setTimeout(() => {
    if (!isTrainingActive) return;
    const nodeIngestion = document.getElementById('node-ingestion');
    if (nodeIngestion) {
      nodeIngestion.querySelector('.node-status').className = 'node-status complete';
      nodeIngestion.querySelector('.node-status').innerHTML = '<i data-lucide="check"></i>';
      nodeIngestion.querySelector('.node-desc').textContent = '10,000 samples imported';
    }
    appendLogLine("Kaggle CSV downloaded. Partition split complete.", "info");
    lucide.createIcons();
    
    setTimeout(() => {
      if (!isTrainingActive) return;
      const nodePrep = document.getElementById('node-preprocessing');
      if (nodePrep) {
        nodePrep.querySelector('.node-status').className = 'node-status complete';
        nodePrep.querySelector('.node-status').innerHTML = '<i data-lucide="check"></i>';
      }
      appendLogLine("Pre-computation parameters applied. Constructing boosting matrices...", "info");
      
      const nodeTraining = document.getElementById('node-training');
      if (nodeTraining) {
        nodeTraining.classList.add('active');
        nodeTraining.querySelector('.node-status').className = 'node-status active';
        nodeTraining.querySelector('.node-status').innerHTML = '<i data-lucide="play" class="status-dot"></i>';
      }
      lucide.createIcons();
    }, 3000);
    
  }, 2000);
}

// Abort Pipeline Run
export function stopTrainingRun() {
  if (!isTrainingActive) {
    showToast("No active training pipeline sequence to abort.", "warn");
    return;
  }
  
  isTrainingActive = false;
  
  const activeNodes = document.querySelectorAll('.pipeline-node.active');
  activeNodes.forEach(node => {
    node.classList.remove('active');
    node.querySelector('.node-status').className = 'node-status failed';
    node.querySelector('.node-status').innerHTML = '<i data-lucide="x"></i>';
  });
  
  const statusBadge = document.getElementById('pipeline-status-badge');
  if (statusBadge) {
    statusBadge.textContent = 'Aborted';
    statusBadge.className = 'badge archive';
    statusBadge.style.background = 'rgba(239, 68, 68, 0.1)';
    statusBadge.style.color = 'var(--danger)';
  }
  
  appendLogLine("PROCESS KILLED BY USER. Aborting model weights compilation. Releasing GPU locks.", "error");
  lucide.createIcons();
}

// Helper to write to console
function appendLogLine(message, level = 'info') {
  const consoleEl = document.getElementById('log-console');
  if (!consoleEl) return;
  
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  const logLine = document.createElement('div');
  logLine.className = 'log-line';
  logLine.innerHTML = `
    <span class="log-time">[${time}]</span>
    <span class="log-level ${level}">${level.toUpperCase()}:</span>
    <span class="log-text">${message}</span>
  `;
  
  consoleEl.appendChild(logLine);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

// Reset nodes visual style
function resetPipelineNodes() {
  const ids = ['node-ingestion', 'node-preprocessing', 'node-training', 'node-evaluation', 'node-deployment'];
  
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    
    el.classList.remove('active');
    const statusIcon = el.querySelector('.node-status');
    
    if (id === 'node-ingestion' || id === 'node-preprocessing') {
      statusIcon.className = 'node-status active';
      statusIcon.innerHTML = '<i data-lucide="play" class="status-dot"></i>';
      el.classList.add('active');
    } else {
      statusIcon.className = 'node-status pending';
      statusIcon.innerHTML = '<i data-lucide="circle"></i>';
    }
  });
  
  const nodeTrainingDesc = document.getElementById('node-training-desc');
  if (nodeTrainingDesc) nodeTrainingDesc.textContent = 'Round 0/50 | Loss: -';
  
  const nodeEvaluation = document.getElementById('node-evaluation');
  if (nodeEvaluation) nodeEvaluation.querySelector('.node-desc').textContent = 'Validate on test split';
  
  const nodeDeployment = document.getElementById('node-deployment');
  if (nodeDeployment) nodeDeployment.querySelector('.node-desc').textContent = 'Push to Registry';
  
  lucide.createIcons();
}

// Random alert events
function triggerRandomAlert() {
  const alerts = [
    { msg: "API Gateway throughput increased by 14%", type: "info" },
    { msg: "Drift warning: feature [Balance] drifted by PSI: 0.22", type: "warn" },
    { msg: "Tesla A100 GPU core utilization peak (91%) reached", type: "warn" },
    { msg: "Kolmogorov-Smirnov Test alert: Age feature drifted (p < 0.05)", type: "error" },
    { msg: "API gateway average response latency spiked to 22.8ms", type: "warn" }
  ];
  
  const selected = alerts[Math.floor(Math.random() * alerts.length)];
  showToast(selected.msg, selected.type);
  
  state.activities.unshift({
    id: Date.now(),
    name: "System Telemetry",
    type: "Real-time Event",
    status: selected.type === 'error' || selected.type === 'warn' ? 'failed' : 'success',
    time: "Just now",
    meta: selected.msg
  });
  renderActivityList();
}
