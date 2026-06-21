# Aether AI | Autonomous ML Operations Hub

Aether AI is a premium, corporate-grade operations dashboard and landing page designed for monitoring and managing the lifecycle of machine learning models in production environments. Built with modern, high-performance modular Javascript and styled with a clean Vercel-inspired dark theme, it balances next-gen visuals with strict corporate utility.

---

## 🚀 Key Capabilities

* **Integrated Landing Page**: Enterprical marketing landing deck demonstrating platform value, pipelines, telemetry capabilities, and security.
* **Unified Console Portal**: Cross-fade warp transitions between landing and real-time dashboard operations.
* **Model Registry**: High-density registry managing model stages (Production, Staging, Archive), version rollouts, hyperparameter maps, and promotion gates.
* **Data Drift Guard**: Monitoring changes in data profiles using the **Population Stability Index (PSI)** to trigger alerts and automate retraining.
* **Simulated Telemetry**: Background tasks feeding live updates on GPU memory utilization, CPU thresholds, cluster temperatures, and API throughput.
* **Subscription Management**: In-console billing tab to manage access tiers (Free, Developer Pro, Enterprise Hub) and monitor deployments quotas.

---

## 📊 Real-world Kaggle Datasets Integrated

To maintain clinical and professional accuracy, the dashboard metrics and logs are driven by real data schemas from production ML environments:

1. **Bank Customer Churn Dataset (Kaggle)**
   * **Attributes Managed**: `Age`, `Balance`, `CreditScore`, `NumOfProducts`, `IsActiveMember`, `EstimatedSalary`.
   * **Attribution**: Features like `Age` and `NumOfProducts` are actively tracked for drift (PSI scores) and feature importance attributions in the **Data Drift** console tab.
2. **Credit Card Fraud Detection (Kaggle)**
   * **Attributes Managed**: Principal Component Components (`V1` to `V28`), transaction `Amount`.
   * **Attribution**: Performance metrics, Precision-Recall curves, and training logs simulate retrain workflows for anomaly classification.

---

## 📂 Project Structure

```
├── index.html                   # Main entry point (loads src/main.js)
├── package.json                 # Project configuration and scripting
├── README.md                    # Corporate-grade documentation
├── vercel.json                  # Vercel static serving configuration
└── src/
    ├── main.js                  # App router, event wiring, and transitions
    ├── assets/
    │   └── style.css            # Modular CSS style system
    ├── data/
    │   ├── churn_dataset.js     # Bank Churn dataset features & drift metrics
    │   ├── fraud_dataset.js     # Fraud Detection statistics
    │   └── models_state.js      # Global models state registry
    └── services/
        ├── auth_service.js      # Firebase Authentication service integration
        ├── subscription_service.js # User subscription tiered gating control
        ├── charts_service.js    # Data visualization configurations (Chart.js)
        └── simulator_service.js # Live background telemetry & logs simulator
```

---

## 🛠️ Local Development Setup

To run the console locally:

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Serve Locally**:
   ```bash
   npm run serve
   ```
   *The console will be served on `http://localhost:3000`.*
