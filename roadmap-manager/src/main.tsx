import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import App from './components/App'
import { LoginPage } from './pages/LoginPage'
import SetNewPasswordPage from './pages/SetNewPasswordPage'
import { useTaskStore } from './store/taskStore'
import { useAuthStore } from './store/authStore'
import { useMapsStore } from './store/mapsStore'
import { loadFromLocalStorage } from './utils/storage'
import { listMaps, readMapFile, writeRoadmapFile } from './services/fileService'
import type { MapInfo } from './services/fileService'
import { updateClientBaseUrl } from './services/opencodeClient'
import './styles/index.css'

const IS_CONNECTED_KEY = 'isConnected'

useAuthStore.getState().initAuth();

const initializeMapsOnReconnect = async () => {
  try {
    const { setLoadingEnabled, setAvailableMaps, setCurrentMap, loadLastEditedMapId } = useMapsStore.getState();
    const { refreshTasks } = useTaskStore.getState();

    setLoadingEnabled(true);

    const maps = await listMaps();
    setAvailableMaps(maps);

    const lastEditedMapId = await loadLastEditedMapId();

    if (lastEditedMapId && maps.length > 0) {
      const targetMap = maps.find((m: MapInfo) => m.id === lastEditedMapId);
      if (targetMap) {
        setCurrentMap(targetMap);
        const mapContent = await readMapFile(targetMap);
        try {
          await writeRoadmapFile(mapContent, null);
        } catch (writeErr) {
          console.error('Failed to load map content into roadmap.md:', writeErr);
        }
      }
    }

    await refreshTasks();
  } catch (err) {
    console.error('Failed to initialize maps on reconnect:', err);
  }
};

const initConnectedState = async () => {
  const savedIsConnected = loadFromLocalStorage(IS_CONNECTED_KEY);
  
  if (savedIsConnected === 'true') {
    const { deviceId, userId: savedUserId } = useAuthStore.getState();
    
    if (savedUserId && deviceId) {
      try {
        const response = await fetch('/api/auth/auto-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId }),
        });

        if (response.ok) {
          const { userId, token, port, username, email } = await response.json();
          
          useAuthStore.getState().login(username, email || '', userId, token);
          if (port) {
            useAuthStore.getState().setUserPort(port);
            updateClientBaseUrl();
          }
          
          useTaskStore.setState({ isConnected: true });
          initializeMapsOnReconnect();
          return;
        }
      } catch (err) {
        console.error('Auto-login failed on reconnect:', err);
      }
    }
    
    useAuthStore.getState().logout();
    useTaskStore.setState({ isConnected: false });
  }
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConnected = useTaskStore(state => state.isConnected);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isConnected || !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const Root = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPageWrapper />} />
      <Route path="/set-new-password" element={<SetNewPasswordPageWrapper />} />
      <Route path="/app" element={
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const LoginPageWrapper: React.FC = () => {
  const isConnected = useTaskStore(state => state.isConnected);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (isConnected && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <LoginPage />;
};

const SetNewPasswordPageWrapper: React.FC = () => {
  const { resetToken, resetTokenExpiry } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!resetToken || !resetTokenExpiry || Date.now() > resetTokenExpiry) {
      navigate('/', { replace: true });
    }
  }, [resetToken, resetTokenExpiry, navigate]);

  return <SetNewPasswordPage />;
};

initConnectedState();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Root />
  </BrowserRouter>
)
