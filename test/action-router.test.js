import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const {
  createActionRegistry,
  createDefaultTools,
  resolveActionConfig
} = require('../src/main/actionTools.cjs');
const {
  createActionRouter,
  createDefaultActionRouter
} = require('../src/main/actionRouter.cjs');

function createDryRunRouter() {
  const registry = createActionRegistry();
  for (const tool of createDefaultTools(resolveActionConfig({ JARVIS_ACTION_DRY_RUN: 'true' }))) {
    registry.register(tool);
  }
  return createActionRouter(registry);
}

describe('Jarvis action router', () => {
  test('ignores normal chat text without running an action', async () => {
    const router = createDryRunRouter();

    await expect(router.tryHandleAction('贾维斯，今天状态怎么样')).resolves.toEqual({
      handled: false
    });
  });

  test('executes a parsed browser action and returns a spoken acknowledgement', async () => {
    const router = createDryRunRouter();

    await expect(router.tryHandleAction('贾维斯，帮我用浏览器搜索小米汽车新闻')).resolves.toMatchObject({
      handled: true,
      toolName: 'browser.search_web',
      message: expect.stringContaining('小米汽车新闻'),
      result: {
        ok: true,
        dryRun: true
      }
    });
  });

  test('executes one-shot wake browser search phrasing', async () => {
    const router = createDryRunRouter();

    await expect(router.tryHandleAction('使用浏览器搜索科技新闻')).resolves.toMatchObject({
      handled: true,
      toolName: 'browser.search_web',
      message: expect.stringContaining('科技新闻')
    });
  });

  test('creates a default dry-run router from environment configuration', async () => {
    const router = createDefaultActionRouter({
      env: { JARVIS_ACTION_DRY_RUN: 'true' }
    });

    await expect(router.tryHandleAction('创建一个word文档，标题是行动计划')).resolves.toMatchObject({
      handled: true,
      toolName: 'office.create_word_document',
      result: {
        dryRun: true
      },
      message: expect.stringContaining('行动计划')
    });
  });

  test('turns action execution failures into handled error messages', async () => {
    const registry = createActionRegistry();
    registry.register({
      name: 'browser.open_url',
      description: 'Broken URL opener.',
      inputSchema: { type: 'object' },
      async run() {
        throw new Error('browser unavailable');
      }
    });
    const router = createActionRouter(registry);

    await expect(router.tryHandleAction('打开 https://example.com')).resolves.toMatchObject({
      handled: true,
      ok: false,
      toolName: 'browser.open_url',
      message: expect.stringContaining('browser unavailable')
    });
  });
});
