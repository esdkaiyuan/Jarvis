import { describe, expect, test } from 'vitest';
import {
  containsWakeWord,
  createPointerInteraction,
  createWakeWordListener,
  extractWakeCommand,
  normalizeWakeTranscript
} from '../src/renderer/interaction-triggers.js';

describe('AI conversation triggers', () => {
  test('normalizes wake transcripts for Chinese and English wake words', () => {
    expect(normalizeWakeTranscript('嘿，贾 维 斯！')).toBe('嘿贾维斯');
    expect(normalizeWakeTranscript('Hello, JARVIS.')).toBe('hellojarvis');
  });

  test('detects Jarvis wake word variants', () => {
    expect(containsWakeWord('贾维斯，在吗')).toBe(true);
    expect(containsWakeWord('hello jarvis')).toBe(true);
    expect(containsWakeWord('嘉维斯帮我一下')).toBe(true);
    expect(containsWakeWord('你好，今天继续工作')).toBe(false);
  });

  test('extracts a one-shot command after the wake word', () => {
    expect(extractWakeCommand('贾维斯，使用浏览器搜索小米汽车新闻')).toBe('使用浏览器搜索小米汽车新闻');
    expect(extractWakeCommand('嘿，贾 维 斯！')).toBe('');
    expect(extractWakeCommand('hello jarvis search ai news', ['jarvis'])).toBe('search ai news');
  });

  test('waits for final wake recognition before triggering a one-shot command', () => {
    const calls = [];
    const listener = createWakeWordListener({
      SpeechRecognitionCtor: FakeSpeechRecognition,
      onWake: (event) => calls.push(event)
    });

    listener.start();
    FakeSpeechRecognition.instance.emitResult('贾维斯', false);
    expect(calls).toEqual([]);

    FakeSpeechRecognition.instance.emitResult('贾维斯，使用浏览器搜索小米汽车新闻', true);
    expect(calls).toEqual([
      {
        transcript: '贾维斯，使用浏览器搜索小米汽车新闻',
        command: '使用浏览器搜索小米汽车新闻'
      }
    ]);
  });

  test('single click on the particle group triggers a conversation without dragging', () => {
    const calls = [];
    const interaction = createPointerInteraction({
      onClick: () => calls.push('click'),
      onDragStart: () => calls.push('drag-start'),
      onDragMove: () => calls.push('drag-move'),
      onDragEnd: () => calls.push('drag-end')
    });

    interaction.pointerDown(pointerEvent(42, 100, 100));
    interaction.pointerUp(pointerEvent(42, 102, 103));

    expect(calls).toEqual(['click']);
  });

  test('dragging the particle group moves the window without triggering a conversation', () => {
    const calls = [];
    const interaction = createPointerInteraction({
      dragThreshold: 6,
      onClick: () => calls.push('click'),
      onDragStart: (point) => calls.push(`drag-start:${point.screenX},${point.screenY}`),
      onDragMove: (point) => calls.push(`drag-move:${point.screenX},${point.screenY}`),
      onDragEnd: () => calls.push('drag-end')
    });

    interaction.pointerDown(pointerEvent(7, 100, 100));
    interaction.pointerMove(pointerEvent(7, 118, 112));
    interaction.pointerMove(pointerEvent(7, 130, 128));
    interaction.pointerUp(pointerEvent(7, 130, 128));

    expect(calls).toEqual([
      'drag-start:100,100',
      'drag-move:118,112',
      'drag-move:130,128',
      'drag-end'
    ]);
  });
});

function pointerEvent(pointerId, screenX, screenY) {
  return {
    pointerId,
    screenX,
    screenY
  };
}

class FakeSpeechRecognition {
  static instance;

  constructor() {
    FakeSpeechRecognition.instance = this;
  }

  start() {
    this.onstart?.();
  }

  stop() {
    this.onend?.();
  }

  emitResult(transcript, isFinal) {
    const result = [{ transcript }];
    result.isFinal = isFinal;
    this.onresult?.({
      resultIndex: 0,
      results: [[{ transcript }]]
    });
    this.onresult?.({
      resultIndex: 0,
      results: [result]
    });
  }
}
