import { describe, expect, test, vi } from 'vitest';
import {
  resolveAssistantReply,
  resolveConversationTranscript
} from '../src/renderer/conversation-flow.js';

describe('conversation flow', () => {
  test('speaks action acknowledgement and skips chat when an action is handled', async () => {
    const jarvis = {
      tryAction: vi.fn().mockResolvedValue({
        handled: true,
        message: '已打开浏览器搜索：小米汽车新闻'
      }),
      chat: vi.fn()
    };

    await expect(resolveAssistantReply(jarvis, '搜索小米汽车新闻')).resolves.toEqual({
      text: '已打开浏览器搜索：小米汽车新闻',
      handledAction: true
    });
    expect(jarvis.chat).not.toHaveBeenCalled();
  });

  test('falls back to MiMo chat when no action is handled', async () => {
    const jarvis = {
      tryAction: vi.fn().mockResolvedValue({ handled: false }),
      chat: vi.fn().mockResolvedValue('我在。')
    };

    await expect(resolveAssistantReply(jarvis, '你是谁')).resolves.toEqual({
      text: '我在。',
      handledAction: false
    });
    expect(jarvis.chat).toHaveBeenCalledWith('你是谁');
  });

  test('uses a one-shot wake command without recording a second utterance', async () => {
    const recordUtterance = vi.fn();
    const transcribe = vi.fn();

    await expect(
      resolveConversationTranscript({
        initialTranscript: '使用浏览器搜索小米汽车新闻',
        recordUtterance,
        transcribe
      })
    ).resolves.toBe('使用浏览器搜索小米汽车新闻');
    expect(recordUtterance).not.toHaveBeenCalled();
    expect(transcribe).not.toHaveBeenCalled();
  });

  test('records and transcribes when wake word has no command', async () => {
    const recordUtterance = vi.fn().mockResolvedValue('data:audio/wav;base64,test');
    const transcribe = vi.fn().mockResolvedValue('搜索小米汽车新闻');

    await expect(
      resolveConversationTranscript({
        initialTranscript: '',
        recordUtterance,
        transcribe
      })
    ).resolves.toBe('搜索小米汽车新闻');
    expect(recordUtterance).toHaveBeenCalled();
    expect(transcribe).toHaveBeenCalledWith('data:audio/wav;base64,test');
  });
});
