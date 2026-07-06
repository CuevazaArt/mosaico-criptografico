import { test } from 'node:test';
import assert from 'node:assert';

// Simulate browser config injection for Node tests
globalThis.window = { __APP_CONFIG__: undefined };

import { getAppConfig, isProductionDeployment, isLocalDemoEnabled } from '../src/app-config.js';

test('App Config - returns development defaults without runtime injection', () => {
  const config = getAppConfig();
  assert.strictEqual(config.deploymentMode, 'development');
  assert.strictEqual(config.defaultNetwork, 'testnet');
  assert.strictEqual(config.enableLocalDemo, true);
  assert.ok(config.sampleXrplAddress.startsWith('r'));
});

test('App Config - respects injected production runtime config', () => {
  window.__APP_CONFIG__ = {
    deploymentMode: 'production',
    defaultNetwork: 'mainnet',
    enableLocalDemo: false,
    xummApiKey: 'test-key',
    xummBackendEnabled: true
  };

  const config = getAppConfig();
  assert.strictEqual(config.deploymentMode, 'production');
  assert.strictEqual(config.defaultNetwork, 'mainnet');
  assert.strictEqual(config.xummApiKey, 'test-key');
  assert.strictEqual(isProductionDeployment(), true);
  assert.strictEqual(isLocalDemoEnabled(), false);

  delete window.__APP_CONFIG__;
});
