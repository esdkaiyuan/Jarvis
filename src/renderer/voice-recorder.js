export async function recordUtterance({
  maxDurationMs = 12000,
  silenceMs = 1300,
  targetSampleRate = 16000,
  silenceThreshold = 0.018
} = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const chunks = [];
  const start = performance.now();
  let lastSpeechAt = start;
  let hasSpeech = false;
  let settled = false;

  source.connect(processor);
  processor.connect(audioContext.destination);

  const result = await new Promise((resolve, reject) => {
    const maxTimer = window.setTimeout(() => finish(resolve), maxDurationMs);

    processor.onaudioprocess = (event) => {
      if (settled) {
        return;
      }

      const input = event.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      chunks.push(copy);

      const now = performance.now();
      const rms = rootMeanSquare(input);
      if (rms > silenceThreshold) {
        hasSpeech = true;
        lastSpeechAt = now;
      }

      const heardEnoughSilence = hasSpeech && now - lastSpeechAt > silenceMs;
      const heardNothing = !hasSpeech && now - start > 4500;
      if (heardEnoughSilence || heardNothing) {
        window.clearTimeout(maxTimer);
        finish(resolve);
      }
    };

    processor.onerror = (error) => {
      window.clearTimeout(maxTimer);
      cleanup();
      reject(error);
    };
  });

  return result;

  function finish(resolve) {
    if (settled) {
      return;
    }
    settled = true;
    cleanup();
    const samples = mergeChunks(chunks);
    const wav = encodeWav(resample(samples, audioContext.sampleRate, targetSampleRate), targetSampleRate);
    resolve(`data:audio/wav;base64,${arrayBufferToBase64(wav)}`);
  }

  function cleanup() {
    processor.disconnect();
    source.disconnect();
    for (const track of stream.getTracks()) {
      track.stop();
    }
    audioContext.close();
  }
}

function rootMeanSquare(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

function mergeChunks(chunks) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function resample(samples, fromSampleRate, toSampleRate) {
  if (fromSampleRate === toSampleRate) {
    return samples;
  }

  const ratio = fromSampleRate / toSampleRate;
  const length = Math.round(samples.length / ratio);
  const result = new Float32Array(length);

  for (let i = 0; i < length; i += 1) {
    const sourceIndex = i * ratio;
    const left = Math.floor(sourceIndex);
    const right = Math.min(left + 1, samples.length - 1);
    const fraction = sourceIndex - left;
    result[i] = samples[left] * (1 - fraction) + samples[right] * fraction;
  }

  return result;
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view, offset, value) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
