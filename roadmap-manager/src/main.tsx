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
useAuthStore.getState().initUsername();

// Initialize connected state from localStorage and set up maps if connected
const initConnectedState = () => {
  const savedIsConnected = loadFromLocalStorage(IS_CONNECTED_KEY);
  if (savedIsConnected === 'true') {
    // Mark as connected without triggering full refresh yet
    useTaskStore.setState({ isConnected: true });
    // Initialize maps in background
    initializeMapsOnReconnect();
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
  const { username } = useAuthStore();

  // Show LoginPage when not connected or no username (handles incomplete logout)
  if (!isConnected || !username) {
    return <LoginPage />;
  }

  // Show App when connected and has username
  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Root />
)
