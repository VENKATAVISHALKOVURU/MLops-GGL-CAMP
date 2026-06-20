// Credit Card Fraud Detection Dataset Configuration (Kaggle)
// Features: V1-V28 PCA features, Amount, Class

export const fraudDataset = {
  name: "Credit Card Fraud Anomaly Classifier",
  features: [
    "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10",
    "V11", "V12", "V13", "V14", "V15", "V16", "V17", "V18", "V19", "V20",
    "V21", "V22", "V23", "V24", "V25", "V26", "V27", "V28", "Amount"
  ],
  metrics: {
    precision: 0.942,
    recall: 0.825,
    f1: 0.880,
    pr_auc: 0.892,
    roc_auc: 0.984
  },
  hyperparameters: {
    "contamination": "0.0017",
    "n_estimators": "200",
    "max_samples": "auto",
    "bootstrap": "false"
  }
};
