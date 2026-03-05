import ReactDOM from 'react-dom/client'
import App from './components/App'
import { LoginPage } from './pages/LoginPage'
import { useTaskStore } from './store/taskStore'
import { useAuthStore } from './store/authStore'
import './styles/index.css'

// Initialize username from localStorage before rendering
useAuthStore.getState().initUsername();

const Root = () => {
  const { isConnected } = useTaskStore();

  // Show LoginPage when not connected (not logged in)
  if (!isConnected) {
    return <LoginPage />;
  }

  // Show App when connected (logged in)
  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Root />
)
