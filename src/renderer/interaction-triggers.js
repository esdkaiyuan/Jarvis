export const DEFAULT_WAKE_WORDS = ['贾维斯', 'jarvis', '嘉维斯', '贾维思', '加维斯'];

export function normalizeWakeTranscript(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[\s,，.。!！?？;；:：'"“”‘’`~·、\-_—]/g, '');
}

export function containsWakeWord(text, wakeWords = DEFAULT_WAKE_WORDS) {
  const normalized = normalizeWakeTranscript(text);
  return wakeWords.some((word) => normalized.includes(normalizeWakeTranscript(word)));
}

export function extractWakeCommand(text, wakeWords = DEFAULT_WAKE_WORDS) {
  const raw = String(text || '');
  const { normalized, map } = normalizeWakeTranscriptWithMap(raw);

  for (const word of wakeWords) {
    const normalizedWord = normalizeWakeTranscript(word);
    const index = normalized.indexOf(normalizedWord);
    if (index === -1) {
      continue;
    }

    const endIndex = index + normalizedWord.length - 1;
    const originalEnd = map[endIndex] + 1;
    return cleanupWakeCommand(raw.slice(originalEnd));
  }

  return '';
}

export function createPointerInteraction({
  dragThreshold = 6,
  onClick = () => {},
  onDragStart = () => {},
  onDragMove = () => {},
  onDragEnd = () => {}
} = {}) {
  let active = null;

  return {
    pointerDown(event) {
      active = {
        pointerId: event.pointerId,
        startX: event.screenX,
        startY: event.screenY,
        dragging: false
      };
    },

    pointerMove(event) {
      if (!active || event.pointerId !== active.pointerId) {
        return;
      }

      const distance = pointerDistance(active, event);
      if (!active.dragging && distance >= dragThreshold) {
        active.dragging = true;
        onDragStart({ screenX: active.startX, screenY: active.startY });
      }

      if (active.dragging) {
        onDragMove({ screenX: event.screenX, screenY: event.screenY });
      }
    },

    pointerUp(event) {
      if (!active || event.pointerId !== active.pointerId) {
        return;
      }

      if (active.dragging) {
        onDragEnd();
      } else if (pointerDistance(active, event) < dragThreshold) {
        onClick();
      }

      active = null;
    },

    pointerCancel(event) {
      if (!active || event.pointerId !== active.pointerId) {
        return;
      }

      if (active.dragging) {
        onDragEnd();
      }
      active = null;
    }
  };
}

export function createWakeWordListener({
  SpeechRecognitionCtor,
  wakeWords = DEFAULT_WAKE_WORDS,
  onWake = () => {},
  onError = () => {},
  lang = 'zh-CN',
  restartDelayMs = 600
} = {}) {
  const Recognition =
    SpeechRecognitionCtor ||
    globalThis.SpeechRecognition ||
    globalThis.webkitSpeechRecognition;

  if (!Recognition) {
    return {
      supported: false,
      start: () => false,
      stop: () => {},
      restart: () => false,
      isRunning: () => false
    };
  }

  const recognition = new Recognition();
  let running = false;
  let manuallyStopped = false;
  let restartTimer = null;

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;

  recognition.onstart = () => {
    running = true;
  };
  recognition.onerror = (event) => {
    onError(event);
  };
  recognition.onend = () => {
    running = false;
    if (!manuallyStopped) {
      restartTimer = setTimeout(() => start(), restartDelayMs);
    }
  };
  recognition.onresult = (event) => {
    const transcripts = collectFinalTranscripts(event);
    const matched = transcripts.find((text) => containsWakeWord(text, wakeWords));
    if (matched) {
      onWake({
        transcript: matched,
        command: extractWakeCommand(matched, wakeWords)
      });
    }
  };

  function start() {
    clearTimeout(restartTimer);
    if (running) {
      return true;
    }

    manuallyStopped = false;
    try {
      recognition.start();
      running = true;
      return true;
    } catch (error) {
      onError(error);
      return false;
    }
  }

  function stop() {
    clearTimeout(restartTimer);
    manuallyStopped = true;
    if (!running) {
      return;
    }
    recognition.stop();
    running = false;
  }

  return {
    supported: true,
    recognition,
    start,
    stop,
    restart() {
      stop();
      manuallyStopped = false;
      return start();
    },
    isRunning: () => running
  };
}

function collectFinalTranscripts(event) {
  const transcripts = [];
  const startIndex = event.resultIndex || 0;
  for (let i = startIndex; i < event.results.length; i += 1) {
    if (!event.results[i]?.isFinal) {
      continue;
    }
    const transcript = event.results[i]?.[0]?.transcript;
    if (transcript) {
      transcripts.push(transcript);
    }
  }
  return transcripts;
}

function normalizeWakeTranscriptWithMap(text) {
  const normalizedChars = [];
  const map = [];
  const raw = String(text || '');

  for (let i = 0; i < raw.length; i += 1) {
    const normalized = normalizeWakeTranscript(raw[i]);
    if (!normalized) {
      continue;
    }
    for (const char of normalized) {
      normalizedChars.push(char);
      map.push(i);
    }
  }

  return {
    normalized: normalizedChars.join(''),
    map
  };
}

function cleanupWakeCommand(text) {
  return String(text || '')
    .replace(/^[\s,，.。!！?？;；:：'"“”‘’`~·、\-_—]+/g, '')
    .trim();
}

function pointerDistance(active, event) {
  return Math.hypot(event.screenX - active.startX, event.screenY - active.startY);
}
