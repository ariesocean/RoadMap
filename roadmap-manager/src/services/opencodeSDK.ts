export async function initOpencodeSDK(): Promise<void> {
  console.log('Running in SDK mode');
}

export async function navigateWithOpencode(prompt: string): Promise<string> {
  if (!prompt || !prompt.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  const { selectedModel } = await import('@/store/modelStore').then(m => m.useModelStore.getState());
  const modelInfo = selectedModel ? {
    providerID: selectedModel.providerID,
    modelID: selectedModel.modelID
  } : undefined;

  const { getOpenCodeClient, subscribeToEvents } = await import('@/services/opencodeClient');
  const client = getOpenCodeClient();

  const response = await client.session.create({ body: { title: `navigate: ${prompt}` } });
  const newSession = response.data;
  if (!newSession) throw new Error('Failed to create session');

  const payload = {
    parts: [{ type: 'text' as const, text: `use navigate: ${prompt}` }],
  };
  if (modelInfo) {
    (payload as any).model = modelInfo;
  }

  await client.session.promptAsync({ path: { id: newSession.id }, body: payload });

  let result = '';
  const events = await subscribeToEvents(newSession.id);
  
  for await (const event of events) {
    if (event.type === 'text') {
      result += event.content || '';
    } else if (event.type === 'done' || event.type === 'success') {
      break;
    }
  }

  return result;
}

export async function closeOpencodeSDK(): Promise<void> {
  // No cleanup needed for SDK mode
}
