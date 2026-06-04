const fetch = require('node-fetch');

const JARVIS_SYSTEM_PROMPT = [
  '你的名字叫贾维斯。',
  '你是一个悬浮在用户桌面的中文 AI 助手。',
  '回答要自然、简洁、可靠；用户语音交流时优先给出可以直接听懂的短句。',
  '不知道时直接说明，并给出下一步建议。'
].join('\n');

function createMiMoClient(config) {
  const fetchImpl = config.fetchImpl || fetch;
  const endpoint = `${config.baseUrl}/chat/completions`;

  async function postChatCompletions(body) {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'api-key': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const detail = await safeReadText(response);
      throw new Error(`MiMo request failed with status ${response.status}${detail ? `: ${detail}` : ''}`);
    }

    return response.json();
  }

  return {
    async chat(userText, history = []) {
      const payload = await postChatCompletions({
        model: config.chatModel,
        messages: [
          { role: 'system', content: JARVIS_SYSTEM_PROMPT },
          ...history.slice(-8),
          { role: 'user', content: userText }
        ],
        temperature: 0.65,
        max_completion_tokens: 700
      });

      return extractText(payload);
    },

    async transcribe(audioDataUrl) {
      const payload = await postChatCompletions({
        model: config.asrModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: {
                  data: audioDataUrl
                }
              }
            ]
          }
        ],
        temperature: 0
      });

      return extractText(payload);
    },

    async speak(text) {
      const payload = await postChatCompletions({
        model: config.ttsModel,
        messages: [
          { role: 'user', content: '使用稳定、清晰、有科技感的中文男声。' },
          { role: 'assistant', content: text }
        ],
        modalities: ['text', 'audio'],
        audio: {
          format: 'wav',
          voice: config.ttsVoice || '苏打'
        }
      });

      const audio = payload?.choices?.[0]?.message?.audio?.data;
      if (!audio) {
        throw new Error('MiMo TTS response did not include audio data.');
      }

      return `data:audio/wav;base64,${audio}`;
    }
  };
}

function extractText(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('')
      .trim();
  }

  throw new Error('MiMo response did not include text content.');
}

async function safeReadText(response) {
  try {
    const text = await response.text();
    return redactSecrets(text).slice(0, 800);
  } catch {
    return '';
  }
}

function redactSecrets(text) {
  return String(text).replace(/tp-[a-zA-Z0-9_-]+/g, 'tp-[redacted]');
}

module.exports = {
  JARVIS_SYSTEM_PROMPT,
  createMiMoClient
};
