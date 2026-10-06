import assert from 'node:assert/strict';
import { brokenFactory, fixedFactory } from './models.mjs';
import { runScenario } from './scenario.mjs';
await assert.rejects(() => runScenario(brokenFactory), assert.AssertionError,
 'the proposed scenario does not detect the lost update');
await runScenario(fixedFactory);
console.log('PASS scenario rejects broken behavior and accepts the complete update');
