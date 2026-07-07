/**
 * Runtime application configuration (injected via config.runtime.js at deploy time).
 */

const DEFAULTS = {
  deploymentMode: 'development',
  defaultNetwork: 'testnet',
  appUrl: 'http://localhost:3000',
  xummApiKey: '',
  xummBackendEnabled: false,
  enableLocalDemo: true,
  defaultWallet: 'xaman',
  sampleXrplAddress: 'rG1QQv2dh2AGTf5gZUXyZEaXcRmGRHsGQE',
  version: '3.1.6'
};

export function getAppConfig() {
  if (typeof window !== 'undefined' && window.__APP_CONFIG__) {
    return { ...DEFAULTS, ...window.__APP_CONFIG__ };
  }
  return { ...DEFAULTS };
}

export function isProductionDeployment() {
  return getAppConfig().deploymentMode === 'production';
}

export function isLocalDemoEnabled() {
  return getAppConfig().enableLocalDemo === true;
}
