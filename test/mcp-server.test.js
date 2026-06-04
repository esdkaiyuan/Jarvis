import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const { createMcpMessageHandler } = require('../src/main/mcpServer.cjs');

describe('Jarvis MCP server', () => {
  test('responds to initialize and tools/list', async () => {
    const handle = createMcpMessageHandler({ env: { JARVIS_ACTION_DRY_RUN: 'true' } });

    await expect(handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })).resolves.toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: {
        serverInfo: { name: 'jarvis-office-browser-mcp' }
      }
    });

    const list = await handle({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    expect(list.result.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining(['browser.search_web', 'office.create_word_document'])
    );
  });

  test('calls action tools through tools/call', async () => {
    const handle = createMcpMessageHandler({ env: { JARVIS_ACTION_DRY_RUN: 'true' } });

    await expect(
      handle({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'browser.search_web',
          arguments: { query: 'MCP 测试' }
        }
      })
    ).resolves.toMatchObject({
      result: {
        content: [
          {
            type: 'text',
            text: expect.stringContaining('MCP 测试')
          }
        ]
      }
    });
  });
});
