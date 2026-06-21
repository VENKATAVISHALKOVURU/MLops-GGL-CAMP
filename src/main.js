import { state } from './data/models_state.js';
import { initCharts, updateDrawerChart, renderDriftCharts, renderTelemetryCharts } from './services/charts_service.js';
import { startSimulator, stopTrainingRun, startTrainingRun } from './services/simulator_service.js';
import { initFirebase, signIn, signUp, signInWithGoogle, logout, checkAuthState, getSavedFirebaseConfig, saveFirebaseConfig } from './services/auth_service.js';
import { getUserTier, isFeatureAllowed, upgradeUserTier, TIER_DETAILS, TIERS } from './services/subscription_service.js';

// Export state for other services
export { state };

let currentUser = null;
let currentGatingTarget = null; // Stores feature context that triggered the gating lock

// UI Containers
const landingPage = document.getElementById('landing-page');
const dashboardApp = document.getElementById('dashboard-app');

// Landing Page Action Buttons
const btnNavLaunch = document.getElementById('btn-nav-launch');
const btnHeroLaunch = document.getElementById('btn-hero-launch');
const btnLandingExplore = document.getElementById('btn-landing-explore');


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

// Model Comparison Elements
const compareSelectA = document.getElementById('compare-select-a');
const compareSelectB = document.getElementById('compare-select-b');
const compareTriggerBtn = document.getElementById('compare-trigger-btn');
const comparisonWorkspace = document.getElementById('comparison-workspace');

// Settings Elements
const settingsSlack = document.getElementById('settings-slack');
const settingsDrift = document.getElementById('settings-drift');
const settingsLatency = document.getElementById('settings-latency');
const settingsKiggleUser = document.getElementById('settings-kaggle-user');
const settingsApiKey = document.getElementById('settings-api-key');
const settingsSaveBtn = document.getElementById('settings-save-btn');

// Notification Elements
const notificationBtn = document.getElementById('notification-btn');
const toastContainer = document.getElementById('toast-container');

// Mobile Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');

// Landing Page Code Templates
const codeTemplates = {
  python: {
    filename: "deploy_churn_predictor.py",
    html: `<span style="color: #f43f5e;">import</span> nexus

<span style="color: #64748b;"># Load the Kaggle Bank Customer Churn model</span>
model = nexus.models.load(<span style="color: #10b981;">"Bank-Churn-XGBoost:v2.4.1"</span>)

<span style="color: #64748b;"># Deploy to production cluster with drift guard enabled</span>
deploy = model.deploy(
    target=<span style="color: #10b981;">"prod-cluster-us-east"</span>,
    drift_detection=<span style="color: #06b6d4;">True</span>,
    drift_threshold=<span style="color: #fbbf24;">0.20</span>
)
print(<span style="color: #10b981;">f"Deployment online: {deploy.endpoint}"</span>)`
  },
  curl: {
    filename: "deploy_curl_request.sh",
    html: `<span style="color: #818cf8;">curl</span> -X POST https://api.nexus.ml/v1/deploy \\
  -H <span style="color: #10b981;">"Authorization: Bearer $NEXUS_API_KEY"</span> \\
  -H <span style="color: #10b981;">"Content-Type: application/json"</span> \\
  -d <span style="color: #06b6d4;">'{
    "model_id": "m-001",
    "version": "v2.4.1",
    "target_cluster": "prod-cluster-us-east",
    "drift_guard": {
      "metric": "PSI",
      "threshold": 0.20
    }
  }'</span>`
  },
  javascript: {
    filename: "deploy_recs.js",
    html: `<span style="color: #f43f5e;">import</span> { Nexus } <span style="color: #f43f5e;">from</span> <span style="color: #10b981;">'@nexus-ml/sdk'</span>;

<span style="color: #f43f5e;">const</span> nexus = <span style="color: #f43f5e;">new</span> <span style="color: #818cf8;">Nexus</span>({ apiKey: process.env.NEXUS_API_KEY });

<span style="color: #64748b;">// Deploy the XGBoost churn model</span>
<span style="color: #f43f5e;">const</span> deployment = <span style="color: #f43f5e;">await</span> nexus.deployments.create({
  modelId: <span style="color: #10b981;">'m-001'</span>,
  version: <span style="color: #10b981;">'v2.4.1'</span>,
  driftGuard: {
    metric: <span style="color: #10b981;">'PSI'</span>,
    threshold: <span style="color: #fbbf24;">0.20</span>
  }
});
console.log(<span style="color: #10b981;">\`Endpoint online: \${deployment.url}\`</span>);`
  }
};

function handleLaunchRequest(targetTab = 'overview') {
  if (currentUser) {
    launchConsole(targetTab);
  } else {
    openAuthPage(targetTab);
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Init lucide icons
  lucide.createIcons();
  
  // Transition actions: Landing -> Dashboard Console
  if (btnNavLaunch) btnNavLaunch.addEventListener('click', () => handleLaunchRequest('overview'));
  if (btnHeroLaunch) btnHeroLaunch.addEventListener('click', () => handleLaunchRequest('overview'));
  if (btnLandingExplore) btnLandingExplore.addEventListener('click', () => handleLaunchRequest('models'));
  
  
  // Code Tabs Switcher on Landing Page
  initCodeTabs();

  // Tab Management
  initTabs();
  
  // Load Models Table
  renderModelsTable();
  
  // Load Activity List
  renderActivityList();
  
  // Initialize Model Comparison dropdown selectors
  populateComparisonDropdowns();
  
  // Gated Model Comparison
  if (compareTriggerBtn) {
    compareTriggerBtn.addEventListener('click', () => {
      const tier = getUserTier(currentUser);
      if (!isFeatureAllowed('model_comparison', tier)) {
        showGatingLock('model_comparison');
      } else {
        runModelComparison();
      }
    });
  }
  
  // Save Settings actions
  if (settingsSaveBtn) settingsSaveBtn.addEventListener('click', saveSystemConfig);
  
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
  
  // Gated Pipeline Trigger Actions
  if (btnTriggerRun) {
    btnTriggerRun.addEventListener('click', () => {
      const tier = getUserTier(currentUser);
      if (!isFeatureAllowed('trigger_pipeline', tier)) {
        showGatingLock('trigger_pipeline');
      } else {
        startTrainingRun();
        showToast("Training Pipeline Triggered", "info");
      }
    });
  }
  
  if (btnAbortRun) {
    btnAbortRun.addEventListener('click', () => {
      const tier = getUserTier(currentUser);
      if (!isFeatureAllowed('trigger_pipeline', tier)) {
        showGatingLock('trigger_pipeline');
      } else {
        stopTrainingRun();
        showToast("Training Pipeline Terminated by User", "error");
      }
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

  // Auth Button Wiring
  const authNavBtn = document.getElementById('btn-nav-auth');
  if (authNavBtn) {
    authNavBtn.addEventListener('click', () => {
      if (currentUser) {
        logout().then(() => showToast("Logged out successfully.", "info"));
      } else {
        openAuthPage();
      }
    });
  }

  // Auth Page internal actions
  const authClose = document.getElementById('auth-close-btn');
  if (authClose) authClose.addEventListener('click', closeAuthPage);

  const authBackBtn = document.getElementById('auth-back-btn');
  if (authBackBtn) authBackBtn.addEventListener('click', closeAuthPage);
  
  const linkToSignup = document.getElementById('link-to-signup');
  const linkToSignin = document.getElementById('link-to-signin');
  if (linkToSignup) {
    linkToSignup.addEventListener('click', () => {
      document.getElementById('auth-view-signin').style.display = 'none';
      document.getElementById('auth-view-signup').style.display = 'block';
    });
  }
  if (linkToSignin) {
    linkToSignin.addEventListener('click', () => {
      document.getElementById('auth-view-signup').style.display = 'none';
      document.getElementById('auth-view-signin').style.display = 'block';
    });
  }

  // Auth Submit Handlers
  const btnSigninSubmit = document.getElementById('btn-signin-submit');
  if (btnSigninSubmit) btnSigninSubmit.addEventListener('click', handleSignin);
  
  const btnSignupSubmit = document.getElementById('btn-signup-submit');
  if (btnSignupSubmit) btnSignupSubmit.addEventListener('click', handleSignup);

  const btnSigninGoogle = document.getElementById('btn-signin-google');
  if (btnSigninGoogle) btnSigninGoogle.addEventListener('click', handleGoogleSignIn);

  const btnSignupGoogle = document.getElementById('btn-signup-google');
  if (btnSignupGoogle) btnSignupGoogle.addEventListener('click', handleGoogleSignIn);

  // Pricing Buttons Wiring
  const pricingBtns = document.querySelectorAll('.btn-pricing-select');
  pricingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTier = btn.getAttribute('data-tier');
      handlePricingSelect(targetTier);
    });
  });

  // Gating Modal Buttons Wiring
  const gatingClose = document.getElementById('gating-close-btn');
  if (gatingClose) gatingClose.addEventListener('click', closeGatingModal);
  const gatingCancel = document.getElementById('gating-btn-cancel');
  if (gatingCancel) gatingCancel.addEventListener('click', closeGatingModal);
  const gatingUpgrade = document.getElementById('gating-btn-upgrade');
  if (gatingUpgrade) gatingUpgrade.addEventListener('click', handleSimulateUpgrade);

  // Load Saved Firebase Config inputs
  const fbConfig = getSavedFirebaseConfig();
  if (fbConfig) {
    const settingsFbApiKey = document.getElementById('settings-fb-api-key');
    const settingsFbAuthDomain = document.getElementById('settings-fb-auth-domain');
    const settingsFbProjectId = document.getElementById('settings-fb-project-id');
    
    if (settingsFbApiKey) settingsFbApiKey.value = fbConfig.apiKey || "";
    if (settingsFbAuthDomain) settingsFbAuthDomain.value = fbConfig.authDomain || "";
    if (settingsFbProjectId) settingsFbProjectId.value = fbConfig.projectId || "";
  }

  // Initialize Firebase Auth Engine
  initFirebase().then(() => {
    checkAuthState(onUserChanged);
  });
  
  // Listen for custom tier change events
  window.addEventListener('nexus-tier-changed', (e) => {
    onUserChanged(e.detail.user);
  });
});

// Code Tabs Switcher
function initCodeTabs() {
  const tabButtons = document.querySelectorAll('.code-tab-btn');
  const filenameEl = document.getElementById('editor-filename');
  const codeBodyEl = document.getElementById('editor-code');
  
  if (tabButtons.length === 0 || !filenameEl || !codeBodyEl) return;
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (codeTemplates[lang]) {
        filenameEl.textContent = codeTemplates[lang].filename;
        codeBodyEl.innerHTML = codeTemplates[lang].html;
      }
    });
  });
}

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
  populateComparisonDropdowns(); // Refresh comparison dropdown lists
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
  populateComparisonDropdowns();
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
  populateComparisonDropdowns();
}

// Populate Comparison dropdown list selectors
function populateComparisonDropdowns() {
  if (!compareSelectA || !compareSelectB) return;
  
  compareSelectA.innerHTML = '';
  compareSelectB.innerHTML = '';
  
  state.models.forEach((model, index) => {
    const optA = document.createElement('option');
    optA.value = model.id;
    optA.textContent = `${model.name} (${model.version})`;
    if (index === 0) optA.selected = true;
    
    const optB = document.createElement('option');
    optB.value = model.id;
    optB.textContent = `${model.name} (${model.version})`;
    if (index === 1 || (index === 0 && state.models.length === 1)) optB.selected = true;
    
    compareSelectA.appendChild(optA);
    compareSelectB.appendChild(optB);
  });
}

// Calculate and render Side-by-Side Model Comparison
function runModelComparison() {
  if (!compareSelectA || !compareSelectB || !comparisonWorkspace) return;
  
  const idA = compareSelectA.value;
  const idB = compareSelectB.value;
  
  const modelA = state.models.find(m => m.id === idA);
  const modelB = state.models.find(m => m.id === idB);
  
  if (!modelA || !modelB) return;
  
  comparisonWorkspace.style.display = 'grid';
  comparisonWorkspace.innerHTML = `
    <!-- Column A -->
    <div class="comparison-column">
      <div class="comparison-model-title">
        <span>${modelA.name}</span>
        <span class="badge ${modelA.stage === 'production' ? 'prod' : modelA.stage === 'staging' ? 'staging' : 'archive'}">${modelA.version} • ${modelA.stage}</span>
      </div>
      
      <div class="comparison-metric-row">
        <div class="comparison-metric-header">
          <span>Validation Accuracy</span>
          <span>${modelA.accuracy}%</span>
        </div>
        <div class="comparison-bar-container">
          <div class="comparison-bar primary" style="width: ${modelA.accuracy}%"></div>
        </div>
      </div>

      <div class="comparison-metric-row">
        <div class="comparison-metric-header">
          <span>F1 Score Benchmark</span>
          <span>${modelA.f1}%</span>
        </div>
        <div class="comparison-bar-container">
          <div class="comparison-bar primary" style="width: ${modelA.f1}%"></div>
        </div>
      </div>

      <div class="comparison-metric-row" style="flex-direction: row; justify-content: space-between; padding: 14px 0;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Framework</span>
        <span style="font-family: var(--font-mono); font-size: 0.85rem; color: #fff;">${modelA.framework.toUpperCase()}</span>
      </div>

      <div class="comparison-metric-row" style="flex-direction: row; justify-content: space-between; padding: 14px 0;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Inference Cost / 1k</span>
        <span style="font-family: var(--font-mono); font-size: 0.85rem; color: #fff;">$${modelA.cost.toFixed(4)}</span>
      </div>

      <div class="comparison-metric-row" style="flex-direction: row; justify-content: space-between; padding: 14px 0;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Data Lineage</span>
        <span style="font-size: 0.85rem; color: #fff;">${modelA.dataset}</span>
      </div>
    </div>

    <!-- Column B -->
    <div class="comparison-column">
      <div class="comparison-model-title">
        <span>${modelB.name}</span>
        <span class="badge ${modelB.stage === 'production' ? 'prod' : modelB.stage === 'staging' ? 'staging' : 'archive'}">${modelB.version} • ${modelB.stage}</span>
      </div>
      
      <div class="comparison-metric-row">
        <div class="comparison-metric-header">
          <span>Validation Accuracy</span>
          <span>${modelB.accuracy}%</span>
        </div>
        <div class="comparison-bar-container">
          <div class="comparison-bar secondary" style="width: ${modelB.accuracy}%"></div>
        </div>
      </div>

      <div class="comparison-metric-row">
        <div class="comparison-metric-header">
          <span>F1 Score Benchmark</span>
          <span>${modelB.f1}%</span>
        </div>
        <div class="comparison-bar-container">
          <div class="comparison-bar secondary" style="width: ${modelB.f1}%"></div>
        </div>
      </div>

      <div class="comparison-metric-row" style="flex-direction: row; justify-content: space-between; padding: 14px 0;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Framework</span>
        <span style="font-family: var(--font-mono); font-size: 0.85rem; color: #fff;">${modelB.framework.toUpperCase()}</span>
      </div>

      <div class="comparison-metric-row" style="flex-direction: row; justify-content: space-between; padding: 14px 0;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Inference Cost / 1k</span>
        <span style="font-family: var(--font-mono); font-size: 0.85rem; color: #fff;">$${modelB.cost.toFixed(4)}</span>
      </div>

      <div class="comparison-metric-row" style="flex-direction: row; justify-content: space-between; padding: 14px 0;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Data Lineage</span>
        <span style="font-size: 0.85rem; color: #fff;">${modelB.dataset}</span>
      </div>
    </div>
  `;
  
  showToast("Comparison benchmark calculated.", "success");
}

// Action: Save System configuration alerts settings
function saveSystemConfig() {
  const slackVal = settingsSlack.value;
  const driftVal = settingsDrift.value;
  const latencyVal = settingsLatency.value;
  const userVal = settingsKiggleUser.value;
  
  // Gated slack webhook settings verification
  const tier = getUserTier(currentUser);
  if (slackVal !== "https://example.com/slack-webhook-placeholder" && !isFeatureAllowed('alert_webhooks', tier)) {
    showGatingLock('alert_webhooks');
    return;
  }

  // Get Firebase configuration inputs
  const settingsFbApiKey = document.getElementById('settings-fb-api-key');
  const settingsFbAuthDomain = document.getElementById('settings-fb-auth-domain');
  const settingsFbProjectId = document.getElementById('settings-fb-project-id');
  
  if (settingsFbApiKey && settingsFbAuthDomain && settingsFbProjectId) {
    const apiKey = settingsFbApiKey.value.trim();
    const authDomain = settingsFbAuthDomain.value.trim();
    const projectId = settingsFbProjectId.value.trim();
    
    if (apiKey && authDomain && projectId) {
      saveFirebaseConfig({ apiKey, authDomain, projectId });
      showToast("Firebase Config saved. Page reload required to connect.", "info");
    } else {
      saveFirebaseConfig(null);
    }
  }

  // Alert/log changes
  state.activities.unshift({
    id: Date.now(),
    name: "System Config",
    type: "Settings Update",
    status: "success",
    time: "Just now",
    meta: `Slack Webhook and thresholds modified. PSI warning: ${driftVal}.`
  });
  renderActivityList();
  
  showToast(`Settings saved successfully. Alert rules updated!`, "success");
}

// --- Auth and Gating Helper Actions ---
function openAuthPage(targetTab = 'overview') {
  const landingPage = document.getElementById('landing-page');
  const dashboardApp = document.getElementById('dashboard-app');
  const authPage = document.getElementById('auth-page');
  
  if (landingPage) landingPage.classList.add('hidden');
  if (dashboardApp) dashboardApp.classList.remove('active');
  
  if (authPage) {
    authPage.setAttribute('data-target-tab', targetTab);
    authPage.classList.add('active');
    document.getElementById('auth-view-signin').style.display = 'block';
    document.getElementById('auth-view-signup').style.display = 'none';
    clearAuthErrors();
  }
}

function closeAuthPage() {
  const authPage = document.getElementById('auth-page');
  if (authPage) {
    authPage.classList.remove('active');
    authPage.removeAttribute('data-target-tab');
  }
  const landingPage = document.getElementById('landing-page');
  if (landingPage) landingPage.classList.remove('hidden');
}

function clearAuthErrors() {
  const errIn = document.getElementById('auth-error-signin');
  const errUp = document.getElementById('auth-error-signup');
  if (errIn) { errIn.style.display = 'none'; errIn.textContent = ''; }
  if (errUp) { errUp.style.display = 'none'; errUp.textContent = ''; }
}

function handleSignin() {
  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value.trim();
  const errorEl = document.getElementById('auth-error-signin');
  
  if (!email || !password) {
    errorEl.textContent = "Please fill in all inputs.";
    errorEl.style.display = 'block';
    return;
  }
  
  signIn(email, password)
    .then((user) => {
      const authPage = document.getElementById('auth-page');
      const targetTab = authPage ? (authPage.getAttribute('data-target-tab') || 'overview') : 'overview';
      closeAuthPage();
      showToast(`Welcome back, ${user.displayName}!`, "success");
      launchConsole(targetTab);
    })
    .catch((err) => {
      errorEl.textContent = getAuthErrorMessage(err.message);
      errorEl.style.display = 'block';
    });
}

function handleSignup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  const errorEl = document.getElementById('auth-error-signup');
  
  if (!name || !email || !password) {
    errorEl.textContent = "Please fill in all inputs.";
    errorEl.style.display = 'block';
    return;
  }
  
  signUp(email, password, name)
    .then((user) => {
      const authPage = document.getElementById('auth-page');
      const targetTab = authPage ? (authPage.getAttribute('data-target-tab') || 'overview') : 'overview';
      closeAuthPage();
      showToast(`Account created. Welcome ${user.displayName}!`, "success");
      launchConsole(targetTab);
    })
    .catch((err) => {
      errorEl.textContent = getAuthErrorMessage(err.message);
      errorEl.style.display = 'block';
    });
}

function handleGoogleSignIn() {
  const errorElIn = document.getElementById('auth-error-signin');
  const errorElUp = document.getElementById('auth-error-signup');
  
  signInWithGoogle()
    .then((user) => {
      const authPage = document.getElementById('auth-page');
      const targetTab = authPage ? (authPage.getAttribute('data-target-tab') || 'overview') : 'overview';
      closeAuthPage();
      showToast(`Welcome, ${user.displayName}! Signed in with Google.`, "success");
      launchConsole(targetTab);
    })
    .catch((err) => {
      console.error(err);
      if (errorElIn) {
        errorElIn.textContent = "Google login failed: " + err.message;
        errorElIn.style.display = 'block';
      }
      if (errorElUp) {
        errorElUp.textContent = "Google login failed: " + err.message;
        errorElUp.style.display = 'block';
      }
    });
}

function getAuthErrorMessage(msg) {
  if (msg.includes('email-already-in-use')) return "This email is already in use.";
  if (msg.includes('user-not-found') || msg.includes('wrong-password')) return "Invalid email or password.";
  if (msg.includes('weak-password')) return "Password is too weak (min 6 characters).";
  return "Authentication failed. Error: " + msg;
}

function onUserChanged(user) {
  currentUser = user;
  
  const authNavBtn = document.getElementById('btn-nav-auth');
  const userNameEl = document.querySelector('.user-name');
  const userRoleEl = document.querySelector('.user-role');
  const userAvatarEl = document.querySelector('.user-avatar');
  
  const tier = getUserTier(user);
  
  if (user) {
    if (authNavBtn) authNavBtn.innerHTML = '<span>Sign Out</span>';
    if (userNameEl) {
      userNameEl.innerHTML = `${user.displayName} <span class="user-tier-badge ${tier}">${tier}</span>`;
    }
    if (userRoleEl) userRoleEl.textContent = user.email;
    
    // Dynamic avatar from Firebase photoURL or custom initials placeholder
    if (userAvatarEl) {
      if (user.photoURL) {
        userAvatarEl.src = user.photoURL;
      } else {
        userAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=6366f1&color=fff&bold=true`;
      }
    }
    syncPricingUI(tier);
  } else {
    if (authNavBtn) authNavBtn.innerHTML = '<span>Sign In</span>';
    if (userNameEl) {
      userNameEl.innerHTML = `Guest User <span class="user-tier-badge free">free</span>`;
    }
    if (userRoleEl) userRoleEl.textContent = 'guest@mlopsnexus.com';
    
    if (userAvatarEl) {
      // Default anonymous initials
      userAvatarEl.src = 'https://ui-avatars.com/api/?name=Guest&background=1e293b&color=94a3b8';
    }
    
    // Automatically drop user back to landing page if they log out inside console
    const dashboardApp = document.getElementById('dashboard-app');
    if (dashboardApp && dashboardApp.classList.contains('active')) {
      returnToLanding();
    }
    
    syncPricingUI('free');
  }
}

function syncPricingUI(activeTier) {
  const tiers = ['free', 'pro', 'enterprise'];
  tiers.forEach(t => {
    const card = document.getElementById(`pricing-card-${t}`);
    const btn = card?.querySelector('.btn-pricing-select');
    if (!btn) return;
    
    if (t === activeTier) {
      btn.textContent = 'Active Plan';
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.pointerEvents = 'none';
      if (card) card.style.borderColor = 'var(--success)';
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      if (card) {
        if (t === 'pro') card.style.borderColor = 'var(--accent-primary)';
        else card.style.borderColor = 'var(--border-color)';
      }
      
      if (t === 'free') btn.textContent = 'Downgrade Plan';
      else if (t === 'pro') btn.textContent = 'Upgrade to Pro';
      else btn.textContent = 'Upgrade to Enterprise';
    }
  });
}

function handlePricingSelect(targetTier) {
  if (!currentUser) {
    openAuthPage();
    showToast("Please sign in or register to choose a plan.", "warn");
    return;
  }
  
  const oldTier = getUserTier(currentUser);
  upgradeUserTier(currentUser, targetTier);
  showToast(`Successfully changed plan to ${TIER_DETAILS[targetTier].name}!`, "success");
  launchConsole('overview');
}

function showGatingLock(feature) {
  currentGatingTarget = feature;
  
  const overlay = document.getElementById('gating-overlay');
  if (!overlay) return;
  
  const title = document.getElementById('gating-title-text');
  const desc = document.getElementById('gating-desc-text');
  
  if (feature === 'model_comparison') {
    title.textContent = 'Developer Pro Locked';
    desc.textContent = 'The Model Side-by-Side Comparison Workspace is a premium Developer Pro feature. Upgrade now to unlock precision model matchups.';
  } else if (feature === 'trigger_pipeline') {
    title.textContent = 'Developer Pro Locked';
    desc.textContent = 'Triggering retraining pipelines on GPU nodes requires Developer Pro authorization. Upgrade to control builds manually.';
  } else if (feature === 'alert_webhooks') {
    title.textContent = 'Enterprise Hub Locked';
    desc.textContent = 'Custom Slack alarm webhook dispatches are restricted to Enterprise Hub licenses. Upgrade to unlock autonomous alert routing.';
  } else {
    title.textContent = 'Feature Restricted';
    desc.textContent = 'This operation requires a subscription upgrade. Choose a plan to unlock.';
  }
  
  overlay.classList.add('active');
}

function closeGatingModal() {
  const overlay = document.getElementById('gating-overlay');
  if (overlay) overlay.classList.remove('active');
  currentGatingTarget = null;
}

function handleSimulateUpgrade() {
  if (!currentUser) {
    closeGatingModal();
    openAuthPage();
    showToast("Please sign in to select subscription upgrades.", "warn");
    return;
  }
  
  let targetTier = TIERS.PRO;
  if (currentGatingTarget === 'alert_webhooks') {
    targetTier = TIERS.ENTERPRISE;
  }
  
  upgradeUserTier(currentUser, targetTier);
  closeGatingModal();
  showToast(`Successfully upgraded account to ${TIER_DETAILS[targetTier].name}! Feature unlocked.`, "success");
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
