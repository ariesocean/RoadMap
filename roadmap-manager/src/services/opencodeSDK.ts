const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;

export async function initOpencodeSDK(): Promise<void> {
  console.log('Running in Tauri mode:', isTauri);
}

export async function navigateWithOpencode(prompt: string): Promise<string> {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke('execute_navigate', { prompt });
    return result as string;
  }

  const response = await fetch('/api/execute-navigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to execute navigate');
  }

  const result = await response.json();
  return result.result || JSON.stringify(result);
}

export async function closeOpencodeSDK(): Promise<void> {
  // Handled by Rust backend
}
