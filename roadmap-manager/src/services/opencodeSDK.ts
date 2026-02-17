import { isTauri } from '@tauri-apps/api/core';

export async function initOpencodeSDK(): Promise<void> {
  console.log('Running in Tauri mode:', isTauri());
}

export async function navigateWithOpencode(prompt: string): Promise<string> {
  const { selectedModel } = await import('@/store/modelStore').then(m => m.useModelStore.getState());
  const modelInfo = selectedModel ? {
    providerID: selectedModel.providerID,
    modelID: selectedModel.modelID
  } : undefined;

  if (isTauri()) {
    // Tauri 模式：直接调用 OpenCode 原生 API，不需要 Vite 服务器
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
    const baseUrl = `http://127.0.0.1:51466`;

    // 创建会话
    const createRes = await tauriFetch(`${baseUrl}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `navigate: ${prompt}` }),
    });

    if (!createRes.ok) {
      throw new Error('Failed to create session');
    }

    const sessionData = await createRes.json();
    const sessionId = sessionData.id;

    // 发送消息
    const payload: any = {
      parts: [{ type: 'text', text: `use navigate: ${prompt}` }]
    };
    if (modelInfo) {
      payload.model = modelInfo;
    }

    const sendRes = await tauriFetch(`${baseUrl}/session/${sessionId}/prompt_async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!sendRes.ok) {
      throw new Error('Failed to send prompt');
    }

    return sessionId;
  }

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
  // Handled by Rust backend
}
