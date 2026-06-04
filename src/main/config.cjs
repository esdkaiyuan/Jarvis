const fs = require('node:fs');
const path = require('node:path');

const TOKEN_PLAN_BASE_URL = 'https://token-plan-cn.xiaomimimo.com/v1';
const STANDARD_BASE_URL = 'https://api.xiaomimimo.com/v1';

function loadDotEnv(filePath = path.join(process.cwd(), '.env')) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function resolveMiMoConfig(env = process.env) {
  const apiKey = env.MIMO_API_KEY;
  if (!apiKey) {
    throw new Error('MIMO_API_KEY is required. Put it in a local .env file.');
  }

  const defaultBaseUrl = apiKey.startsWith('tp-') ? TOKEN_PLAN_BASE_URL : STANDARD_BASE_URL;

  return {
    apiKey,
    baseUrl: removeTrailingSlash(env.MIMO_BASE_URL || defaultBaseUrl),
    chatModel: env.MIMO_CHAT_MODEL || 'mimo-v2.5-pro',
    asrModel: env.MIMO_ASR_MODEL || 'mimo-v2.5-asr',
    ttsModel: env.MIMO_TTS_MODEL || 'mimo-v2.5-tts',
    ttsVoice: env.MIMO_TTS_VOICE || '苏打'
  };
}

function resolveJarvisConfig(env = process.env) {
  return {
    particleCount: toNumber(env.JARVIS_PARTICLE_COUNT, 1500),
    windowSize: toNumber(env.JARVIS_WINDOW_SIZE, 420),
    mousePassthrough: toBoolean(env.JARVIS_MOUSE_PASSTHROUGH, false),
    wakeWordEnabled: toBoolean(env.JARVIS_WAKE_WORD_ENABLED, true),
    wakeWords: splitList(env.JARVIS_WAKE_WORDS, ['贾维斯', 'jarvis', '嘉维斯', '贾维思', '加维斯']),
    startShortcut: env.JARVIS_START_SHORTCUT || 'CommandOrControl+Shift+J',
    mouseShortcut: env.JARVIS_MOUSE_SHORTCUT || 'CommandOrControl+Shift+M',
    quitShortcut: env.JARVIS_QUIT_SHORTCUT || 'CommandOrControl+Shift+Q'
  };
}

function removeTrailingSlash(value) {
  return String(value).replace(/\/+$/, '');
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function splitList(value, fallback) {
  if (!value) {
    return fallback;
  }

  const items = String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
}

module.exports = {
  TOKEN_PLAN_BASE_URL,
  STANDARD_BASE_URL,
  loadDotEnv,
  resolveMiMoConfig,
  resolveJarvisConfig
};
