export async function resolveAssistantReply(jarvis, transcript) {
  const action = await jarvis.tryAction(transcript);
  if (action?.handled) {
    return {
      text: action.message || '贾维斯已执行。',
      handledAction: true
    };
  }

  return {
    text: await jarvis.chat(transcript),
    handledAction: false
  };
}

export async function resolveConversationTranscript({
  initialTranscript = '',
  recordUtterance,
  transcribe
}) {
  const transcript = String(initialTranscript || '').trim();
  if (transcript) {
    return transcript;
  }

  const audioDataUrl = await recordUtterance();
  return transcribe(audioDataUrl);
}
