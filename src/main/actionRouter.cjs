const { parseActionIntent } = require('./actionIntent.cjs');
const {
  createActionRegistry,
  createDefaultTools,
  resolveActionConfig
} = require('./actionTools.cjs');

function createActionRouter(registry) {
  if (!registry || typeof registry.run !== 'function') {
    throw new Error('Action registry is required.');
  }

  return {
    async tryHandleAction(text) {
      const intent = parseActionIntent(text);
      if (!intent) {
        return { handled: false };
      }

      try {
        const result = await registry.run(intent.toolName, intent.args);
        return {
          handled: true,
          ok: true,
          toolName: intent.toolName,
          args: intent.args,
          message: result.message || '贾维斯已执行。',
          result
        };
      } catch (error) {
        return {
          handled: true,
          ok: false,
          toolName: intent.toolName,
          args: intent.args,
          message: `贾维斯执行失败：${error.message || String(error)}`
        };
      }
    }
  };
}

function createDefaultActionRouter({ env = process.env, configOverrides = {} } = {}) {
  const config = resolveActionConfig(env, configOverrides);
  const registry = createActionRegistry();
  for (const tool of createDefaultTools(config)) {
    registry.register(tool);
  }
  return createActionRouter(registry);
}

module.exports = {
  createActionRouter,
  createDefaultActionRouter
};
