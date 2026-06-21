// Subscription Tiers config
export const TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

// Feature gating definition
const FEATURE_PERMISSIONS = {
  // Core dashboards
  'view_overview': [TIERS.FREE, TIERS.PRO, TIERS.ENTERPRISE],
  'view_drift': [TIERS.FREE, TIERS.PRO, TIERS.ENTERPRISE],
  'view_telemetry': [TIERS.FREE, TIERS.PRO, TIERS.ENTERPRISE],
  
  // Developer utilities
  'model_comparison': [TIERS.PRO, TIERS.ENTERPRISE],
  'trigger_pipeline': [TIERS.PRO, TIERS.ENTERPRISE],
  
  // Enterprise integrations
  'alert_webhooks': [TIERS.ENTERPRISE],
  'custom_credentials': [TIERS.PRO, TIERS.ENTERPRISE]
};

// Quota Limits definition
export const QUOTA_LIMITS = {
  [TIERS.FREE]: {
    deployments: 1,
    pipelines: 2,
    apiQueriesPerSec: 10
  },
  [TIERS.PRO]: {
    deployments: 15,
    pipelines: 10,
    apiQueriesPerSec: 100
  },
  [TIERS.ENTERPRISE]: {
    deployments: Infinity,
    pipelines: Infinity,
    apiQueriesPerSec: Infinity
  }
};

// Get user tier
export function getUserTier(user) {
  if (!user) return TIERS.FREE;
  return localStorage.getItem(`aether_tier_${user.uid}`) || user.tier || TIERS.FREE;
}

// Check feature access
export function isFeatureAllowed(feature, userTier) {
  const allowedTiers = FEATURE_PERMISSIONS[feature];
  if (!allowedTiers) return true; // Undefined features are open by default
  return allowedTiers.includes(userTier);
}

// Upgrade user tier
export function upgradeUserTier(user, newTier) {
  if (!user) return false;
  if (!Object.values(TIERS).includes(newTier)) return false;
  
  localStorage.setItem(`aether_tier_${user.uid}`, newTier);
  user.tier = newTier;
  
  // Save updated user to mock active user key if in mock mode
  const activeUser = localStorage.getItem('aether_mock_user');
  if (activeUser) {
    const parsed = JSON.parse(activeUser);
    if (parsed.uid === user.uid) {
      parsed.tier = newTier;
      localStorage.setItem('aether_mock_user', JSON.stringify(parsed));
    }
  }
  
  // Dispatch custom event to let main thread know tier was updated
  window.dispatchEvent(new CustomEvent('aether-tier-changed', { detail: { user, tier: newTier } }));
  return true;
}

// Get tier labels and pricing parameters
export const TIER_DETAILS = {
  [TIERS.FREE]: {
    name: 'Free Starter',
    price: '$0',
    desc: 'Core model and telemetry dashboards for small teams.'
  },
  [TIERS.PRO]: {
    name: 'Developer Pro',
    price: '$49',
    desc: 'Advanced comparison tools and training pipelines for professionals.'
  },
  [TIERS.ENTERPRISE]: {
    name: 'Enterprise Hub',
    price: '$199',
    desc: 'Complete webhook monitoring, private clusters, and custom API stores.'
  }
};
