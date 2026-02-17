export async function initOpencodeSDK(): Promise<void> {
  console.log('Running in pure Vite mode');
}

export async function navigateWithOpencode(prompt: string): Promise<string> {
  const { selectedModel } = await import('@/store/modelStore').then(m => m.useModelStore.getState());
  const modelInfo = selectedModel ? {
    providerID: selectedModel.providerID,
    modelID: selectedModel.modelID
  } : undefined;

  const response = await fetch('/api/execute-navigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model: modelInfo }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to execute navigate');
  }

  const result = await response.json();
  return result.result || JSON.stringify(result);
}

export async function closeOpencodeSDK(): Promise<void> {
  // No cleanup needed for Vite mode
}
