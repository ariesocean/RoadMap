/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Moon, Sun, ListTodo, X, Eye, EyeOff } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useMapsStore } from '@/store/mapsStore';
import { listMaps } from '@/services/fileService';
import type { MapInfo } from '@/services/fileService';
import { saveToLocalStorage } from '@/utils/storage';
import { PasswordInput } from '@/components/PasswordInput';
import { updateClientBaseUrl } from '@/services/opencodeClient';

export const LoginPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const { toggleConnected, refreshTasks } = useTaskStore.getState();
  const { theme, setTheme } = useThemeStore();
  const { setLoadingEnabled, setAvailableMaps, setCurrentMap, loadLastEditedMapId } = useMapsStore.getState();

  // Sync theme with themeStore
  useEffect(() => {
    setIsDarkMode(theme === 'dark');
  }, [theme]);

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    setTheme(newTheme);
  };

  // Initialize maps on login - same logic as when switching to connected
  const initializeMapsOnLogin = async () => {
    try {
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

      // Refresh tasks after login
      await refreshTasks();
    } catch (err) {
      console.error('Failed to initialize maps on login:', err);
    }
  };

  // Sync isConnected when auth state changes (handled by main.tsx init)
  useEffect(() => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      useTaskStore.setState({ isConnected: true });
      initializeMapsOnLogin();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Please check your username or password');
      return;
    }

    setIsLoggingIn(true);

    try {
      const deviceId = useAuthStore.getState().deviceId;
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
          deviceId,
          deviceInfo: navigator.userAgent
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setLoginError(error.error || 'Login failed');
        return;
      }

      const { userId, token, port } = await response.json();
      
      useAuthStore.getState().login(loginUsername, userId, token);
      if (port) {
        useAuthStore.getState().setUserPort(port);
        updateClientBaseUrl();
      }
      
      await initializeMapsOnLogin();
      toggleConnected();
      saveToLocalStorage('isConnected', 'true');

      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!registerUsername.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setRegisterError('Please fill in all fields');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters');
      return;
    }

    try {
      const deviceId = useAuthStore.getState().deviceId;
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerUsername,
          email: registerEmail,
          password: registerPassword,
          deviceId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setRegisterError(error.error || 'Registration failed');
        return;
      }

      const { userId, token, port } = await response.json();
      
      useAuthStore.getState().login(registerUsername, userId, token);
      if (port) {
        useAuthStore.getState().setUserPort(port);
        updateClientBaseUrl();
      }
      
      await initializeMapsOnLogin();
      toggleConnected();
      saveToLocalStorage('isConnected', 'true');

      setRegisterUsername('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      setShowRegister(false);
    } catch (err) {
      setRegisterError('Registration failed. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-[#1c1c1c] text-white' : 'bg-[#f9fafb] text-gray-900'}`}>
      {/* Theme Toggle */}
      <button
        onClick={handleThemeToggle}
        className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#2d2d2d] text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'}`}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Login Card */}
      <div className={`w-full max-w-md rounded-2xl shadow-lg border transition-colors duration-300 overflow-hidden ${isDarkMode ? 'bg-[#252525] border-[#333] shadow-black/50' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
        {/* Loading animation line */}
        <div className="h-0.5 overflow-hidden">
          <div className={`w-full h-full ${isLoggingIn ? 'gradient-line-animation' : ''}`} />
        </div>

        <div className="p-8">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#0066ff] rounded-xl flex items-center justify-center mb-4 shadow-md shadow-blue-600/20">
            <ListTodo className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">Roadmap Manager</h1>
          <p className={`text-sm text-center leading-relaxed px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            A Personal task management tool using LLM-assisted semantic analysis to manage to-do list with natural language commands.
          </p>
        </div>

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="login-username" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Username or Email</label>
            <input
              id="login-username"
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoggingIn}
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? 'bg-[#1c1c1c] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
              }`}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="login-password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
              <a href="#" className="text-sm text-[#0066ff] hover:text-blue-500 hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showLoginPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoggingIn}
                className={`w-full px-4 py-2.5 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-[#1c1c1c] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showLoginPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {loginError && (
            <div className={`p-3 rounded-lg text-sm ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {loginError}
            </div>
          )}

          <button disabled={isLoggingIn} className="w-full bg-[#0066ff] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors mt-2 shadow-md shadow-blue-600/20">
            {isLoggingIn ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Don't have an account?{' '}
            <button onClick={() => { setShowRegister(true); setRegisterError(null); }} className="text-[#0066ff] hover:text-blue-500 font-medium hover:underline">
              Sign up
            </button>
          </p>
        </div>
        </div>
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border relative animate-in fade-in zoom-in-95 duration-200 ${
              isDarkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-gray-100'
            }`}
          >
            <button
              onClick={() => setShowRegister(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'text-gray-400 hover:bg-[#333] hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight mb-1">Create an Account</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Join Roadmap Manager to organize your tasks.</p>
            </div>

            <form className="space-y-4" onSubmit={handleRegister} autoComplete="off">
              <div>
                <label htmlFor="register-username" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Username</label>
                <input
                  id="register-username"
                  type="text"
                  autoComplete="new-username"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  placeholder="Choose a username"
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50 transition-colors ${
                    isDarkMode
                      ? 'bg-[#1c1c1c] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="register-email" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="new-email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50 transition-colors ${
                    isDarkMode
                      ? 'bg-[#1c1c1c] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="register-password" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                <PasswordInput
                  id="register-password"
                  value={registerPassword}
                  onChange={setRegisterPassword}
                  placeholder="Create a password (min 6 characters)"
                  confirmValue={registerConfirmPassword}
                  confirmOnChange={setRegisterConfirmPassword}
                  confirmPlaceholder="Confirm your password"
                  autoComplete="new-password"
                  error={registerError && registerError.includes('match') ? registerError : null}
                />
              </div>

              {registerError && (
                <div className={`p-3 rounded-lg text-sm ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                  {registerError}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className={`flex-1 py-2.5 rounded-xl font-medium border transition-colors ${
                    isDarkMode
                      ? 'border-[#333] text-gray-300 hover:bg-[#333]'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button className="flex-1 bg-[#0066ff] hover:bg-blue-600 text-white font-medium py-2.5 rounded-xl transition-colors shadow-md shadow-blue-600/20">
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
