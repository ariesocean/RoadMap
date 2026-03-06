import ReactDOM from 'react-dom/client'
import App from './components/App'
import { LoginPage } from './pages/LoginPage'
import { useTaskStore } from './store/taskStore'
import { useAuthStore } from './store/authStore'
import { useMapsStore } from './store/mapsStore'
import { loadFromLocalStorage } from './utils/storage'
import { listMaps } from './services/fileService'
import type { MapInfo } from './services/fileService'
import './styles/index.css'

const IS_CONNECTED_KEY = 'isConnected'

// Initialize username from localStorage before rendering
useAuthStore.getState().initAuth();

// Initialize connected state from localStorage and set up maps if connected
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
          const { userId, token, port, username } = await response.json();
          
          useAuthStore.getState().login(username, userId, token);
          if (port) {
            useAuthStore.getState().setUserPort(port);
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

// Initialize maps when reconnecting (same as login flow)
const initializeMapsOnReconnect = async () => {
  try {
    const { setLoadingEnabled, setAvailableMaps, setCurrentMap, loadLastEditedMapId } = useMapsStore.getState();
    const { refreshTasks } = useTaskStore.getState();

    // Enable maps loading
    setLoadingEnabled(true);

    // Discover available maps
    const maps = await listMaps();
    setAvailableMaps(maps);

    // Load last edited map ID from backend
    const lastEditedMapId = await loadLastEditedMapId();

    // If there's a last edited map, select it
    if (lastEditedMapId && maps.length > 0) {
      const targetMap = maps.find((m: MapInfo) => m.id === lastEditedMapId);
      if (targetMap) {
        setCurrentMap(targetMap);
      }
    }

    // Refresh tasks
    await refreshTasks();
  } catch (err) {
    console.error('Failed to initialize maps on reconnect:', err);
  }
};

// Initialize on load
initConnectedState();

const Root = () => {
  const { isConnected } = useTaskStore();
  const { isAuthenticated } = useAuthStore();

  // Show LoginPage when not connected or not authenticated
  if (!isConnected || !isAuthenticated) {
    return <LoginPage />;
  }

  // Show App when connected and authenticated
  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Root />
)
