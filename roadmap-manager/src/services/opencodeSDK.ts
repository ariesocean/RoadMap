import { createOpencode } from "@opencode-ai/sdk";

let opencodeInstance: Awaited<ReturnType<typeof createOpencode>> | null = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

export async function initOpencodeSDK(): Promise<void> {
  if (opencodeInstance) return;
  if (isInitializing && initPromise) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      opencodeInstance = await createOpencode({
        hostname: "127.0.0.1",
        port: 4096,
      });
    } catch (error) {
      console.error("Failed to initialize OpenCode SDK:", error);
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

export async function navigateWithOpencode(prompt: string): Promise<string> {
  if (!opencodeInstance) {
    await initOpencodeSDK();
  }

  if (!opencodeInstance) {
    throw new Error("OpenCode SDK not initialized");
  }

  try {
    const session = await opencodeInstance.client.session.create({
      body: { title: "Roadmap App" },
    });

    const response = await opencodeInstance.client.session.prompt({
      path: { id: session.id },
      body: {
        parts: [{ type: "text", text: `navigate: ${prompt}` }],
      },
    });

    return JSON.stringify(response);
  } catch (error) {
    console.error("OpenCode navigate error:", error);
    throw error;
  }
}

export async function closeOpencodeSDK(): Promise<void> {
  if (opencodeInstance) {
    opencodeInstance.server.close();
    opencodeInstance = null;
  }
}
