import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const { resolveJarvisConfig } = require('../src/main/config.cjs');

describe('draggable desktop window', () => {
  test('defaults to 1500 particles after adding 500 more particles', () => {
    const config = resolveJarvisConfig({});

    expect(config.particleCount).toBe(1500);
  });

  test('defaults to receiving mouse events so the orb can be dragged', () => {
    const config = resolveJarvisConfig({});

    expect(config.mousePassthrough).toBe(false);
  });

  test('enables Jarvis wake words by default', () => {
    const config = resolveJarvisConfig({});

    expect(config.wakeWordEnabled).toBe(true);
    expect(config.wakeWords).toEqual(expect.arrayContaining(['贾维斯', 'jarvis']));
  });

  test('keeps the particle canvas interactive for click triggers', () => {
    const styles = readFileSync('src/renderer/styles.css', 'utf8');

    expect(styles).toContain('cursor: move');
    expect(styles).not.toContain('-webkit-app-region: drag');
  });
});
