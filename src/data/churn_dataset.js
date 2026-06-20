// Bank Customer Churn Dataset Configuration (Kaggle)
// Features: Age, Balance, CreditScore, NumOfProducts, IsActiveMember, EstimatedSalary

export const churnDataset = {
  name: "Bank Customer Churn Prediction",
  features: [
    "Age",
    "Balance",
    "CreditScore",
    "NumOfProducts",
    "IsActiveMember",
    "EstimatedSalary"
  ],
  importances: {
    labels: ["Age", "NumOfProducts", "Balance", "CreditScore", "IsActiveMember", "EstimatedSalary"],
    baseline: [35, 28, 15, 12, 10, 0],
    production: [42, 22, 16, 12, 8, 0]
  },
  driftMetrics: [
    { feature: "Age", psi: 0.28, threshold: 0.20, status: "High Drift", action: "Trigger retrain" },
    { feature: "Balance", psi: 0.22, threshold: 0.20, status: "High Drift", action: "Trigger retrain" },
    { feature: "CreditScore", psi: 0.08, threshold: 0.20, status: "Normal", action: "None" },
    { feature: "NumOfProducts", psi: 0.04, threshold: 0.20, status: "Normal", action: "None" },
    { feature: "IsActiveMember", psi: 0.05, threshold: 0.20, status: "Normal", action: "None" },
    { feature: "EstimatedSalary", psi: 0.09, threshold: 0.20, status: "Normal", action: "None" }
  ],
  // Age distribution for shift plotting
  ageDistribution: {
    labels: ["18-25", "26-35", "36-45", "46-55", "56-65", "66+"],
    baseline: [10, 45, 30, 10, 4, 1], // peak at 26-35
    production: [8, 30, 42, 14, 5, 1]  // peak shifted to 36-45 (drift indicator)
  }
};
