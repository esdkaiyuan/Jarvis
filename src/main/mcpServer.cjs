const readline = require('node:readline');
const {
  createActionRegistry,
  createDefaultTools,
  resolveActionConfig
} = require('./actionTools.cjs');

function createMcpMessageHandler({ env = process.env, configOverrides = {} } = {}) {
  const config = resolveActionConfig(env, configOverrides);
  const registry = createActionRegistry();
  for (const tool of createDefaultTools(config)) {
    registry.register(tool);
  }

  return async function handle(message) {
    try {
      if (message.method === 'initialize') {
        return response(message.id, {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'jarvis-office-browser-mcp',
            version: '0.1.0'
          }
        });
      }

      if (message.method === 'tools/list') {
        return response(message.id, {
          tools: registry.list().map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        });
      }

      if (message.method === 'tools/call') {
        const name = message.params?.name;
        const args = message.params?.arguments || {};
        const result = await registry.run(name, args);
        return response(message.id, {
          content: [
            {
              type: 'text',
              text: result.message || JSON.stringify(result)
            }
          ],
          structuredContent: result
        });
      }

      if (message.method === 'notifications/initialized') {
        return null;
      }

      return errorResponse(message.id, -32601, `Unknown method: ${message.method}`);
    } catch (error) {
      return errorResponse(message.id, -32000, error.message || String(error));
    }
  };
}

function response(id, result) {
  return {
    jsonrpc: '2.0',
    id,
    result
  };
}

function errorResponse(id, code, message) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message
    }
  };
}

async function runStdioServer() {
  const handle = createMcpMessageHandler();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    let message;
    try {
      message = JSON.parse(trimmed);
    } catch (error) {
      process.stdout.write(
        `${JSON.stringify(errorResponse(null, -32700, `Parse error: ${error.message}`))}\n`
      );
      continue;
    }

    const reply = await handle(message);
    if (reply) {
      process.stdout.write(`${JSON.stringify(reply)}\n`);
    }
  }
}

if (require.main === module) {
  runStdioServer().catch((error) => {
    process.stderr.write(`${error.stack || error.message || String(error)}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  createMcpMessageHandler,
  runStdioServer
};
