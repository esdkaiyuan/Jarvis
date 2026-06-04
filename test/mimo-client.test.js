import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const { createMiMoClient } = require('../src/main/mimoClient.cjs');
const { resolveMiMoConfig } = require('../src/main/config.cjs');

describe('MiMo configuration', () => {
  test('uses token-plan base URL for tp-prefixed keys', () => {
    const config = resolveMiMoConfig({
      MIMO_API_KEY: 'tp-test-secret'
    });

    expect(config.baseUrl).toBe('https://token-plan-cn.xiaomimimo.com/v1');
  });

  test('does not leak the API key in missing configuration errors', () => {
    expect(() => resolveMiMoConfig({})).toThrow(/MIMO_API_KEY/);
  });
});

describe('MiMo client', () => {
  test('sends chat requests with the Jarvis system identity', async () => {
    const calls = [];
    const client = createMiMoClient({
      apiKey: 'tp-test-secret',
      baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
      chatModel: 'mimo-v2.5-pro',
      asrModel: 'mimo-v2.5-asr',
      ttsModel: 'mimo-v2.5-tts',
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return jsonResponse({
          choices: [{ message: { content: '收到，我在。' } }]
        });
      }
    });

    const reply = await client.chat('你好');
    const body = JSON.parse(calls[0].options.body);

    expect(reply).toBe('收到，我在。');
    expect(calls[0].url).toBe('https://token-plan-cn.xiaomimimo.com/v1/chat/completions');
    expect(calls[0].options.headers.Authorization).toBe('Bearer tp-test-secret');
    expect(body.model).toBe('mimo-v2.5-pro');
    expect(body.messages[0].content).toContain('你的名字叫贾维斯');
    expect(body.messages[1]).toMatchObject({ role: 'user', content: '你好' });
  });

  test('sends wav data URL to ASR and extracts the transcript', async () => {
    const calls = [];
    const client = createMiMoClient({
      apiKey: 'tp-test-secret',
      baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
      chatModel: 'mimo-v2.5-pro',
      asrModel: 'mimo-v2.5-asr',
      ttsModel: 'mimo-v2.5-tts',
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return jsonResponse({
          choices: [{ message: { content: '现在几点' } }]
        });
      }
    });

    const transcript = await client.transcribe('data:audio/wav;base64,AAAA');
    const body = JSON.parse(calls[0].options.body);

    expect(transcript).toBe('现在几点');
    expect(body.model).toBe('mimo-v2.5-asr');
    expect(body.messages[0].content[0]).toEqual({
      type: 'input_audio',
      input_audio: {
        data: 'data:audio/wav;base64,AAAA'
      }
    });
  });

  test('requests wav TTS audio and returns a playable data URL', async () => {
    const calls = [];
    const client = createMiMoClient({
      apiKey: 'tp-test-secret',
      baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
      chatModel: 'mimo-v2.5-pro',
      asrModel: 'mimo-v2.5-asr',
      ttsModel: 'mimo-v2.5-tts',
      ttsVoice: '苏打',
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return jsonResponse({
          choices: [
            {
              message: {
                audio: {
                  data: 'UklGRgAAAAA='
                }
              }
            }
          ]
        });
      }
    });

    const audioUrl = await client.speak('系统已就绪。');
    const body = JSON.parse(calls[0].options.body);

    expect(audioUrl).toBe('data:audio/wav;base64,UklGRgAAAAA=');
    expect(body.messages).toEqual([
      {
        role: 'user',
        content: expect.stringContaining('中文男声')
      },
      {
        role: 'assistant',
        content: '系统已就绪。'
      }
    ]);
    expect(body.audio).toMatchObject({
      format: 'wav',
      voice: '苏打'
    });
  });
});

function jsonResponse(payload, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    }
  };
}
