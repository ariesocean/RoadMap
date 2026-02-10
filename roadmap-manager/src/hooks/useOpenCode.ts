import { useState, useEffect, useCallback } from 'react';
import { checkServerHealth, startServer } from '@/services/opencodeAPI';

export function useOpenCode() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      const healthy = await checkServerHealth();
      setIsConnected(healthy);
    } catch {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const ensureServerRunning = useCallback(async () => {
    const healthy = await checkServerHealth();
    if (!healthy) {
      await startServer();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    await checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    isConnected,
    isChecking,
    checkConnection,
    ensureServerRunning,
  };
}
