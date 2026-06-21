import { churnDataset } from './churn_dataset.js';
import { fraudDataset } from './fraud_dataset.js';

// Central Model Registry State
export const state = {
  models: [
    {
      id: "m-001",
      name: "Bank-Churn-XGBoost",
      version: "v2.4.1",
      accuracy: 94.2,
      f1: 93.8,
      stage: "production",
      framework: "scikit-learn",
      updated: "2026-06-18 10:42",
      cost: 0.0008,
      hyperparameters: {
        "learning_rate": "0.05",
        "max_depth": "6",
        "n_estimators": "150",
        "subsample": "0.8",
        "eval_metric": "logloss"
      },
      history: [90.5, 91.8, 92.4, 93.2, 94.2],
      dataset: churnDataset.name
    },
    {
      id: "m-002",
      name: "Card-Fraud-IsolationForest",
      version: "v3.0.0-rc2",
      accuracy: 98.1,
      f1: 97.9,
      stage: "staging",
      framework: "scikit-learn",
      updated: "2026-06-20 20:15",
      cost: 0.0045,
      hyperparameters: fraudDataset.hyperparameters,
      history: [95.2, 96.0, 97.1, 97.5, 98.1],
      dataset: fraudDataset.name
    },
    {
      id: "m-003",
      name: "Product-Recs-NeuralCF",
      version: "v1.2.0",
      accuracy: 89.7,
      f1: 89.2,
      stage: "archive",
      framework: "tensorflow",
      updated: "2026-06-12 14:30",
      cost: 0.0092,
      hyperparameters: {
        "embedding_dim": "64",
        "hidden_layers": "[128, 64, 32]",
        "dropout": "0.2"
      },
      history: [85.0, 87.2, 89.0, 89.7],
      dataset: "Kaggle H&M Recommendation Challenge"
    },
    {
      id: "m-004",
      name: "ImageNet-ResNet50",
      version: "v2.1.0",
      accuracy: 92.5,
      f1: 91.9,
      stage: "production",
      framework: "pytorch",
      updated: "2026-06-19 09:12",
      cost: 0.0021,
      hyperparameters: {
        "batch_size": "32",
        "learning_rate": "0.001",
        "optimizer": "AdamW",
        "backbone": "resnet50"
      },
      history: [89.1, 90.5, 91.8, 92.5],
      dataset: "Kaggle ImageNet Identification"
    }
  ],
  selectedModel: null,
  activities: [
    { id: 1, name: "Bank-Churn-XGBoost", type: "Deployment Promo", status: "success", time: "10 mins ago", meta: "v2.4.1 promoted to production" },
    { id: 2, name: "Card-Fraud Pipeline", type: "Training Run", status: "running", time: "Active", meta: "Currently running epoch 14/50" },
    { id: 3, name: "Anomaly-Detection-AutoEncoder", type: "Failed Build", status: "failed", time: "2 hours ago", meta: "Out of Memory on GPU node-4" },
    { id: 4, name: "Bank-Churn-XGBoost", type: "System Alert", status: "failed", time: "4 hours ago", meta: "Inference drift threshold exceeded (Age PSI: 0.28)" }
  ],
  metricsHistory: {
    deployments: [10, 11, 11, 12, 12, 13, 14],
    latency: [21.4, 20.8, 22.1, 19.5, 18.2, 19.0, 18.7, 18.9, 17.5, 18.1, 18.6, 18.4],
    gpu: [72, 70, 75, 78, 82, 85, 80, 77, 72, 70],
    ips: [1200, 1280, 1150, 1310, 1400, 1390, 1420, 1380, 1450, 1410, 1390, 1402]
  },
  isConsoleInitialized: false
};
