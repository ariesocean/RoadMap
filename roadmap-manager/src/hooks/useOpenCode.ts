import { useState, useEffect, useCallback, useRef } from 'react';

export function useOpenCode() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const sdkInstanceRef = useRef<any>(null);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    isConnected,
    isChecking,
    checkConnection,
    sdkInstance: sdkInstanceRef.current,
  };
}
