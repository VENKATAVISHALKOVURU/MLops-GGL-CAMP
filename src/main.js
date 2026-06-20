import { state } from './data/models_state.js';
import { initCharts, updateDrawerChart, renderDriftCharts, renderTelemetryCharts } from './services/charts_service.js';
import { startSimulator, stopTrainingRun, startTrainingRun } from './services/simulator_service.js';

// Export state for other services
export { state };

// UI Containers
const landingPage = document.getElementById('landing-page');
const dashboardApp = document.getElementById('dashboard-app');

// Landing Page Action Buttons
const btnNavLaunch = document.getElementById('btn-nav-launch');
const btnHeroLaunch = document.getElementById('btn-hero-launch');
const btnLandingExplore = document.getElementById('btn-landing-explore');

// Dashboard Return Button
const btnReturnLanding = document.getElementById('btn-return-landing');

// UI Elements
const sidebarLinks = document.querySelectorAll('.nav-link');
const tabPanes = document.querySelectorAll('.tab-pane');
const modelsTableBody = document.getElementById('models-table-body');
const modelFilterStage = document.getElementById('model-filter-stage');
const modelFilterFramework = document.getElementById('model-filter-framework');
const searchInput = document.getElementById('search-input');
const btnRegisterModel = document.getElementById('btn-register-model');

// Drawer Elements
const drawerBackdrop = document.getElementById('drawer-backdrop');
const drawer = document.getElementById('drawer');
const drawerClose = document.getElementById('drawer-close');
const drawerModelName = document.getElementById('drawer-model-name');
const drawerModelVersion = document.getElementById('drawer-model-version');
const drawerAccuracy = document.getElementById('drawer-accuracy');
const drawerF1 = document.getElementById('drawer-f1');
const drawerCost = document.getElementById('drawer-cost');
const drawerStage = document.getElementById('drawer-stage');
const drawerHyperparameters = document.getElementById('drawer-hyperparameters');
const drawerBtnPromote = document.getElementById('drawer-btn-promote');
const drawerBtnArchive = document.getElementById('drawer-btn-archive');

// Pipeline Run Buttons
const btnTriggerRun = document.getElementById('btn-trigger-run');
const btnAbortRun = document.getElementById('btn-abort-run');

// Notification Elements
const notificationBtn = document.getElementById('notification-btn');
const toastContainer = document.getElementById('toast-container');

// Mobile Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Init lucide icons
  lucide.createIcons();
  
  // Transition actions: Landing -> Dashboard Console
  if (btnNavLaunch) btnNavLaunch.addEventListener('click', () => launchConsole('overview'));
  if (btnHeroLaunch) btnHeroLaunch.addEventListener('click', () => launchConsole('overview'));
  if (btnLandingExplore) btnLandingExplore.addEventListener('click', () => launchConsole('models'));
  
  // Transition actions: Dashboard -> Landing Page
  if (btnReturnLanding) btnReturnLanding.addEventListener('click', returnToLanding);
  
  // Tab Management
  initTabs();
  
  // Load Models Table
  renderModelsTable();
  
  // Load Activity List
  renderActivityList();
  
  // Initialize Filters
  if (modelFilterStage) modelFilterStage.addEventListener('change', renderModelsTable);
  if (modelFilterFramework) modelFilterFramework.addEventListener('change', renderModelsTable);
  if (searchInput) searchInput.addEventListener('input', debounce(renderModelsTable, 250));
  
  // Register button action
  if (btnRegisterModel) btnRegisterModel.addEventListener('click', handleRegisterModel);
  
  // Init Drawer listeners
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);
  if (drawerBtnPromote) drawerBtnPromote.addEventListener('click', promoteModelStage);
  if (drawerBtnArchive) drawerBtnArchive.addEventListener('click', archiveModelStage);
  
  // Pipeline Trigger Actions
  if (btnTriggerRun) {
    btnTriggerRun.addEventListener('click', () => {
      startTrainingRun();
      showToast("Training Pipeline Triggered", "info");
    });
  }
  
  if (btnAbortRun) {
    btnAbortRun.addEventListener('click', () => {
      stopTrainingRun();
      showToast("Training Pipeline Terminated by User", "error");
    });
  }
  
  // Toast and Notification actions
  if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
      showToast("No new critical notifications. System healthy.", "success");
      const badge = notificationBtn.querySelector('.badge-dot');
      if (badge) badge.remove();
    });
  }
  
  // Responsive sidebar toggles
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }
});

// Launch Console from Landing Page
function launchConsole(targetTab = 'overview') {
  landingPage.classList.add('hidden');
  dashboardApp.classList.add('active');
  
  // Switch to correct tab
  switchTab(targetTab);
  
  // Lazy initialize metrics and charts on transition
  if (!state.isConsoleInitialized) {
    state.isConsoleInitialized = true;
    
    // Draw all charts
    initCharts();
    renderDriftCharts();
    renderTelemetryCharts();
    
    // Start metric simulators
    startSimulator();
  }
  
  showToast("Nexus control console online. Welcome back.", "success");
}

// Return to landing page
function returnToLanding() {
  dashboardApp.classList.remove('active');
  landingPage.classList.remove('hidden');
}

// Switch tabs programmatically
function switchTab(tabId) {
  // Update links
  sidebarLinks.forEach(link => {
    if (link.getAttribute('data-tab') === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  // Update panes
  tabPanes.forEach(pane => {
    if (pane.id === `${tabId}-pane`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
  
  window.dispatchEvent(new Event('resize'));
}

// Tab Switch Management
function initTabs() {
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      switchTab(tabId);
      
      // Close sidebar if open on mobile
      if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
      }
    });
  });
}

// Render Models Registry Table
export function renderModelsTable() {
  if (!modelsTableBody) return;
  const stageFilter = modelFilterStage.value;
  const frameworkFilter = modelFilterFramework.value;
  const query = searchInput.value.toLowerCase();
  
  modelsTableBody.innerHTML = '';
  
  const filteredModels = state.models.filter(model => {
    const matchesStage = stageFilter === 'all' || model.stage === stageFilter;
    const matchesFramework = frameworkFilter === 'all' || model.framework === frameworkFilter;
    const matchesSearch = model.name.toLowerCase().includes(query) || 
                          model.version.toLowerCase().includes(query) ||
                          model.id.toLowerCase().includes(query);
    return matchesStage && matchesFramework && matchesSearch;
  });
  
  if (filteredModels.length === 0) {
    modelsTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">
          No models matched the current filters.
        </td>
      </tr>
    `;
    return;
  }
  
  filteredModels.forEach(model => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="model-name-wrapper">
          <span class="model-name">${model.name}</span>
          <span class="model-type">${model.framework.toUpperCase()} • ${model.id}</span>
        </div>
      </td>
      <td><code>${model.version}</code></td>
      <td style="font-weight: 500; color: var(--text-main);">${model.accuracy}%</td>
      <td style="font-weight: 500; color: var(--text-main);">${model.f1}%</td>
      <td><span class="badge ${model.stage === 'production' ? 'prod' : model.stage === 'staging' ? 'staging' : 'archive'}">${model.stage}</span></td>
      <td>${model.updated}</td>
      <td>
        <button class="btn-icon inspect-btn" data-id="${model.id}" title="Inspect Model Details">
          <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
        </button>
      </td>
    `;
    
    // Add drawer trigger
    tr.querySelector('.inspect-btn').addEventListener('click', () => {
      openDrawer(model);
    });
    
    modelsTableBody.appendChild(tr);
  });
  
  lucide.createIcons();
}

// Render Recent System Activities
export function renderActivityList() {
  const container = document.getElementById('activity-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.activities.forEach(act => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-icon ${act.status === 'success' ? 'success' : act.status === 'running' ? 'running' : 'failed'}">
        <i data-lucide="${act.status === 'success' ? 'check-circle' : act.status === 'running' ? 'loader' : 'alert-triangle'}"></i>
      </div>
      <div class="activity-info">
        <div class="activity-name">${act.name}</div>
        <div class="activity-meta">${act.meta}</div>
      </div>
      <div>
        <div class="activity-status-text ${act.status}">${act.status === 'running' ? 'active' : act.status}</div>
        <div class="activity-meta" style="text-align: right; margin-top: 4px;">${act.time}</div>
      </div>
    `;
    container.appendChild(item);
  });
  
  lucide.createIcons();
}

// Open Inspect Drawer
function openDrawer(model) {
  state.selectedModel = model;
  
  drawerModelName.textContent = model.name;
  drawerModelVersion.textContent = `Version ${model.version} (ID: ${model.id}) • Dataset: ${model.dataset || "Kaggle Source"}`;
  drawerAccuracy.textContent = `${model.accuracy}%`;
  drawerF1.textContent = `${model.f1}%`;
  drawerCost.textContent = `$${model.cost.toFixed(4)}`;
  drawerStage.textContent = model.stage.toUpperCase();
  
  // Custom styling of details stage background
  drawerStage.className = 'detail-value badge';
  drawerStage.classList.add(model.stage === 'production' ? 'prod' : model.stage === 'staging' ? 'staging' : 'archive');
  
  // Populate Hyperparameters
  drawerHyperparameters.innerHTML = '';
  Object.entries(model.hyperparameters).forEach(([key, val]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 500; font-family: var(--font-mono); font-size: 0.75rem; width: 45%;">${key}</td>
      <td style="color: var(--text-main); font-family: var(--font-mono); font-size: 0.75rem;">${val}</td>
    `;
    drawerHyperparameters.appendChild(tr);
  });
  
  // Open animation triggers
  drawerBackdrop.classList.add('active');
  drawer.classList.add('active');
  
  // Render performance history chart
  setTimeout(() => {
    updateDrawerChart(model.history, model.name);
  }, 100);
}

// Close Inspect Drawer
function closeDrawer() {
  drawerBackdrop.classList.remove('active');
  drawer.classList.remove('active');
  state.selectedModel = null;
}

// Action: Promote Model Stage
function promoteModelStage() {
  if (!state.selectedModel) return;
  
  const model = state.models.find(m => m.id === state.selectedModel.id);
  if (!model) return;
  
  let oldStage = model.stage;
  let newStage = oldStage;
  
  if (oldStage === 'archive') {
    newStage = 'staging';
  } else if (oldStage === 'staging') {
    newStage = 'production';
  } else {
    showToast(`${model.name} is already in production!`, "info");
    return;
  }
  
  model.stage = newStage;
  model.updated = getFormattedTimestamp();
  
  // Update state activities list
  state.activities.unshift({
    id: Date.now(),
    name: model.name,
    type: "Stage Promotion",
    status: "success",
    time: "Just now",
    meta: `Version ${model.version} promoted from ${oldStage} to ${newStage}`
  });
  
  showToast(`${model.name} successfully promoted to ${newStage}!`, "success");
  
  // Redraw
  renderModelsTable();
  renderActivityList();
  openDrawer(model); // Refresh drawer details
}

// Action: Archive Model Stage
function archiveModelStage() {
  if (!state.selectedModel) return;
  
  const model = state.models.find(m => m.id === state.selectedModel.id);
  if (!model) return;
  
  if (model.stage === 'archive') {
    showToast(`${model.name} is already archived.`, "info");
    return;
  }
  
  let oldStage = model.stage;
  model.stage = 'archive';
  model.updated = getFormattedTimestamp();
  
  state.activities.unshift({
    id: Date.now(),
    name: model.name,
    type: "Stage Demoted",
    status: "failed",
    time: "Just now",
    meta: `Version ${model.version} demoted from ${oldStage} to archive`
  });
  
  showToast(`${model.name} successfully demoted to archive.`, "warn");
  
  // Redraw
  renderModelsTable();
  renderActivityList();
  openDrawer(model);
}

// Action: Register Model
function handleRegisterModel() {
  const modelNames = [
    "Bank-Churn-LightGBM",
    "Card-Fraud-AutoEncoder",
    "Customer-Risk-GradientBoost",
    "Transaction-Classify-CatBoost"
  ];
  
  const selectedName = modelNames[Math.floor(Math.random() * modelNames.length)];
  const framework = ["pytorch", "scikit-learn"][Math.floor(Math.random() * 2)];
  const idNum = Math.floor(100 + Math.random() * 900);
  const vNum = `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.0`;
  const accuracy = (90 + Math.random() * 9).toFixed(1);
  const f1 = (accuracy - (Math.random() * 1.5)).toFixed(1);
  
  const newModel = {
    id: `m-${idNum}`,
    name: selectedName,
    version: `v${vNum}`,
    accuracy: parseFloat(accuracy),
    f1: parseFloat(f1),
    stage: "staging",
    framework: framework,
    updated: getFormattedTimestamp(),
    cost: +(Math.random() * 0.005).toFixed(4),
    hyperparameters: {
      "initializer": "normal",
      "learning_rate": "0.01",
      "momentum": "0.9",
      "decay": "1e-6"
    },
    history: [85.5, 87.2, 88.9, parseFloat(accuracy)],
    dataset: "Kaggle Retrained Partition"
  };
  
  state.models.unshift(newModel);
  
  state.activities.unshift({
    id: Date.now(),
    name: newModel.name,
    type: "Model Registered",
    status: "success",
    time: "Just now",
    meta: `New model ${newModel.name} version ${newModel.version} registered successfully.`
  });
  
  showToast(`Successfully registered new model: ${newModel.name} (${newModel.version})`, "success");
  
  renderModelsTable();
  renderActivityList();
}

// Toast System
export function showToast(message, type = 'info') {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'warn') iconName = 'alert-circle';
  if (type === 'error') iconName = 'x-circle';
  
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span class="toast-message">${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  lucide.createIcons();
  
  // Auto-remove toast
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s reverse cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function getFormattedTimestamp() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
