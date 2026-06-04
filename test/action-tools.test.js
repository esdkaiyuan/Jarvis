import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const {
  createActionRegistry,
  createDefaultTools,
  resolveActionConfig
} = require('../src/main/actionTools.cjs');
const { parseActionIntent } = require('../src/main/actionIntent.cjs');

describe('Jarvis action tools', () => {
  test('registers browser and Office tools for MCP exposure', () => {
    const registry = createActionRegistry();
    for (const tool of createDefaultTools(resolveActionConfig({ JARVIS_ACTION_DRY_RUN: 'true' }))) {
      registry.register(tool);
    }

    expect(registry.list().map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        'browser.open_url',
        'browser.search_web',
        'office.create_word_document',
        'office.create_excel_workbook',
        'office.create_powerpoint_deck',
        'office.open_file'
      ])
    );
  });

  test('parses Chinese browser and Office commands into actions', () => {
    expect(parseActionIntent('贾维斯，帮我用浏览器搜索小米汽车新闻')).toMatchObject({
      toolName: 'browser.search_web',
      args: { query: '小米汽车新闻' }
    });
    expect(parseActionIntent('贾维斯，使用浏览器搜索科技新闻')).toMatchObject({
      toolName: 'browser.search_web',
      args: { query: '科技新闻' }
    });
    expect(parseActionIntent('用浏览器搜一下人工智能新闻')).toMatchObject({
      toolName: 'browser.search_web',
      args: { query: '人工智能新闻' }
    });
    expect(parseActionIntent('找一下今天的财经新闻')).toMatchObject({
      toolName: 'browser.search_web',
      args: { query: '今天的财经新闻' }
    });
    expect(parseActionIntent('打开 https://example.com')).toMatchObject({
      toolName: 'browser.open_url',
      args: { url: 'https://example.com' }
    });
    expect(parseActionIntent('创建一个word文档，标题是会议纪要')).toMatchObject({
      toolName: 'office.create_word_document',
      args: { title: '会议纪要' }
    });
    expect(parseActionIntent('新建excel表格，标题是项目清单')).toMatchObject({
      toolName: 'office.create_excel_workbook',
      args: { title: '项目清单' }
    });
    expect(parseActionIntent('做一个ppt，标题是季度总结')).toMatchObject({
      toolName: 'office.create_powerpoint_deck',
      args: { title: '季度总结' }
    });
  });

  test('executes dry-run tools and rejects unknown tools', async () => {
    const registry = createActionRegistry();
    for (const tool of createDefaultTools(resolveActionConfig({ JARVIS_ACTION_DRY_RUN: 'true' }))) {
      registry.register(tool);
    }

    await expect(
      registry.run('browser.search_web', { query: '测试' })
    ).resolves.toMatchObject({
      ok: true,
      dryRun: true,
      message: expect.stringContaining('测试')
    });
    await expect(registry.run('system.delete_everything', {})).rejects.toThrow(/Unknown action tool/);
  });

  test('browser search opens the configured search URL when actions are enabled', async () => {
    const opened = [];
    const registry = createActionRegistry();
    for (const tool of createDefaultTools(
      resolveActionConfig(
        {
          JARVIS_ACTION_DRY_RUN: 'false',
          JARVIS_BROWSER_SEARCH_URL: 'https://search.example/?q='
        },
        {
          openExternal: async (url) => opened.push(url)
        }
      )
    )) {
      registry.register(tool);
    }

    await expect(registry.run('browser.search_web', { query: '小米汽车新闻' })).resolves.toMatchObject({
      ok: true,
      url: 'https://search.example/?q=%E5%B0%8F%E7%B1%B3%E6%B1%BD%E8%BD%A6%E6%96%B0%E9%97%BB'
    });
    expect(opened).toEqual(['https://search.example/?q=%E5%B0%8F%E7%B1%B3%E6%B1%BD%E8%BD%A6%E6%96%B0%E9%97%BB']);
  });
});
