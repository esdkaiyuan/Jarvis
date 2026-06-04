import {
  ParticleDirector,
  createParticles,
  stepParticles
} from './particle-system.js';
import { createPointerInteraction, createWakeWordListener } from './interaction-triggers.js';
import { createThreeParticleScene } from './three-particle-scene.js';
import {
  resolveAssistantReply,
  resolveConversationTranscript
} from './conversation-flow.js';
import { recordUtterance } from './voice-recorder.js';
import './styles.css';

const canvas = document.querySelector('#particle-canvas');
const announcer = document.querySelector('#announcer');

let particles = [];
let director;
let particleScene;
let pointerInteraction;
let wakeWordController;
let state = 'idle';
let lastFrame = performance.now();
let isBusy = false;
let config = {
  particleCount: 1500,
  windowSize: 420,
  wakeWordEnabled: true,
  wakeWords: ['贾维斯', 'jarvis', '嘉维斯', '贾维思', '加维斯']
};

boot();

async function boot() {
  config = { ...config, ...(await window.jarvis.getConfig()) };
  const rect = canvas.getBoundingClientRect();
  particles = createParticles({
    count: config.particleCount,
    width: rect.width,
    height: rect.height,
    seed: 20260604
  });
  director = new ParticleDirector({
    count: config.particleCount,
    width: rect.width,
    height: rect.height,
    seed: 20260604
  });
  particleScene = createThreeParticleScene({
    canvas,
    particles,
    width: rect.width,
    height: rect.height
  });

  window.addEventListener('resize', resizeCanvas);
  bindPointerTriggers();
  window.jarvis.onStartListening(() => startConversation());
  startWakeWordMode();
  requestAnimationFrame(animate);
}

function bindPointerTriggers() {
  pointerInteraction = createPointerInteraction({
    onClick: () => startConversation('click'),
    onDragStart: (point) => window.jarvis.beginDrag(point),
    onDragMove: (point) => window.jarvis.moveDrag(point),
    onDragEnd: () => window.jarvis.endDrag()
  });

  canvas.addEventListener('pointerdown', (event) => {
    canvas.setPointerCapture?.(event.pointerId);
    pointerInteraction.pointerDown(event);
  });
  canvas.addEventListener('pointermove', (event) => pointerInteraction.pointerMove(event));
  canvas.addEventListener('pointerup', (event) => {
    pointerInteraction.pointerUp(event);
    canvas.releasePointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointercancel', (event) => {
    pointerInteraction.pointerCancel(event);
    canvas.releasePointerCapture?.(event.pointerId);
  });
}

function startWakeWordMode() {
  if (!config.wakeWordEnabled || wakeWordController) {
    return;
  }

  wakeWordController = createWakeWordListener({
    wakeWords: config.wakeWords,
    onWake: ({ command }) => startConversation('wake-word', command),
    onError: () => {}
  });
  wakeWordController.start();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  if (director) {
    director.resize(rect.width, rect.height);
  }
  if (particleScene) {
    particleScene.resize(rect.width, rect.height);
  }
}

function animate(now) {
  const rect = canvas.getBoundingClientRect();
  const delta = now - lastFrame;
  lastFrame = now;
  const targets = director.update(now);
  const energy = state === 'thinking' ? 1.55 : state === 'speaking' ? 1.35 : state === 'listening' ? 1.2 : 1;

  stepParticles(particles, targets, delta, now, energy);
  particleScene.render(particles, rect.width, rect.height, now, state);
  requestAnimationFrame(animate);
}

async function startConversation(source = 'manual', initialTranscript = '') {
  if (isBusy) {
    return;
  }

  isBusy = true;
  wakeWordController?.stop();
  try {
    setState('listening');
    director.forceShape('infinity', performance.now());

    setState('thinking');
    director.forceShape('helix', performance.now());
    const transcript = await resolveConversationTranscript({
      initialTranscript,
      recordUtterance,
      transcribe: (audioDataUrl) => window.jarvis.transcribe(audioDataUrl)
    });
    announce(`你说：${transcript}`);

    const reply = await resolveAssistantReply(window.jarvis, transcript);
    announce(reply.text);

    setState('speaking');
    director.forceShape(reply.handledAction ? 'quantumGate' : 'torus', performance.now());
    const audioUrl = await window.jarvis.speak(reply.text);
    await playAudio(audioUrl);
    setState('idle');
  } catch (error) {
    setState('error');
    announce(error?.message || '语音流程失败');
    director.forceShape('heart', performance.now());
    window.setTimeout(() => setState('idle'), 1800);
  } finally {
    isBusy = false;
    if (source !== 'manual') {
      window.setTimeout(() => wakeWordController?.start(), 700);
    } else {
      wakeWordController?.start();
    }
  }
}

function setState(nextState) {
  state = nextState;
  window.jarvis.notifyState(nextState);
}

function announce(text) {
  announcer.textContent = text;
}

function playAudio(dataUrl) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(dataUrl);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('TTS audio playback failed.'));
    audio.play().catch(reject);
  });
}
