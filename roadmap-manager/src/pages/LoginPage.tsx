/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Moon, Sun, ListTodo, X, Eye, EyeOff, Copy, Check, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useI18nStore } from '@/store/i18nStore';
import { useMapsStore } from '@/store/mapsStore';
import { listMaps, readMapFile, writeRoadmapFile } from '@/services/fileService';
import type { MapInfo } from '@/services/fileService';
import { saveToLocalStorage } from '@/utils/storage';
import { PasswordInput } from '@/components/PasswordInput';
import { updateClientBaseUrl } from '@/services/opencodeClient';

export const LoginPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerInvitationCode, setRegisterInvitationCode] = useState('');
  const [showInvitationHelp, setShowInvitationHelp] = useState(false);
  const [copiedWeChatId, setCopiedWeChatId] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const handleCopyWeChatId = async () => {
    try {
      await navigator.clipboard.writeText('-harveyhe-');
      setCopiedWeChatId(true);
      setTimeout(() => setCopiedWeChatId(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const { toggleConnected, refreshTasks } = useTaskStore.getState();
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage, t } = useI18nStore();
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

  const handleLanguageToggle = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
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
          // Load map content into roadmap.md
          const mapContent = await readMapFile(targetMap);
          try {
            await writeRoadmapFile(mapContent, null);
          } catch (writeErr) {
            console.error('Failed to load map content into roadmap.md:', writeErr);
          }
        } else {
          // Map not found, will use default
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

      const { userId, token, port, username, email } = await response.json();
      
      useAuthStore.getState().login(username, email || '', userId, token);
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
          deviceId,
          invitationCode: registerInvitationCode
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setRegisterError(error.error || 'Registration failed');
        return;
      }

      setRegisterSuccess('Registration successful! Please log in with your credentials.');
      setRegisterUsername('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      setRegisterInvitationCode('');
      setShowRegister(false);
    } catch (err) {
      setRegisterError('Registration failed. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'dark bg-[#1c1c1c] text-white' : 'bg-[#f9fafb] text-gray-900'}`}>
      {/* Theme Toggle */}
      <button
        onClick={handleThemeToggle}
        className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#2d2d2d] text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'}`}
        title={t('toggleTheme')}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Language Toggle */}
      <button
        onClick={handleLanguageToggle}
        className={`absolute top-6 right-16 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-semibold border ${isDarkMode ? 'bg-[#252525] border-[#333] hover:bg-[#2d2d2d] text-white' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-900'}`}
        title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
      >
        <span>{language === 'en' ? 'EN' : '中'}</span>
      </button>

      {/* Login Card */}
      <div className={`w-full max-w-md mx-4 sm:mx-6 md:mx-0 rounded-2xl shadow-lg border transition-colors duration-300 overflow-hidden ${isDarkMode ? 'bg-[#252525] border-[#333] shadow-black/50' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
        {/* Loading animation line */}
        <div className="h-0.5 overflow-hidden">
          <div className={`w-full h-full ${isLoggingIn ? 'gradient-line-animation' : ''}`} />
        </div>

        <div className="p-6 sm:p-7 md:p-8">
        {/* Logo & Header */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-7 md:mb-8">
          <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-[#0066ff] rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
            <ListTodo className="text-white" size={20} />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t('loginTitle')}</h1>
        </div>

        {/* AI Assistant Tagline */}
        <div className="mb-6 sm:mb-7 md:mb-8">
          <p className="text-sm sm:text-base font-medium mb-1">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              {t('loginTagline')}
            </span>
          </p>
          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('loginSubTagline')}
          </p>
        </div>

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="login-username" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('usernameOrEmail')}</label>
            <input
              id="login-username"
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder={t('enterUsername')}
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
              <label htmlFor="login-password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('password')}</label>
              <a href="#" className="text-sm text-[#0066ff] hover:text-blue-500 hover:underline">{t('forgotPassword')}</a>
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

          {registerSuccess && (
            <div className={`p-3 rounded-lg text-sm ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>
              {registerSuccess}
            </div>
          )}

          <button disabled={isLoggingIn} className="w-full bg-[#0066ff] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors mt-2 shadow-md shadow-blue-600/20">
            {isLoggingIn ? t('signingIn') : t('signIn')}
          </button>
        </form>

        <div className="mt-6 sm:mt-7 md:mt-8 text-center">
          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('noAccount')}{' '}
            <button onClick={() => { setShowRegister(true); setRegisterError(null); setRegisterSuccess(null); }} className="text-[#0066ff] hover:text-blue-500 font-medium hover:underline">
              {t('signUp')}
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
              <h2 className="text-xl font-semibold tracking-tight mb-1">{t('createAccount')}</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('joinTagline')}</p>
            </div>

            <form className="space-y-4" onSubmit={handleRegister} autoComplete="off">
              <div>
                <label htmlFor="register-username" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('username')}</label>
                <input
                  id="register-username"
                  type="text"
                  autoComplete="new-username"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  placeholder={t('chooseUsername')}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50 transition-colors ${
                    isDarkMode
                      ? 'bg-[#1c1c1c] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="register-email" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('email')}</label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="new-email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder={t('enterEmail')}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50 transition-colors ${
                    isDarkMode
                      ? 'bg-[#1c1c1c] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="register-password" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('password')}</label>
                <PasswordInput
                  id="register-password"
                  value={registerPassword}
                  onChange={setRegisterPassword}
                  placeholder={t('createPassword')}
                  confirmValue={registerConfirmPassword}
                  confirmOnChange={setRegisterConfirmPassword}
                  confirmPlaceholder={t('confirmPassword')}
                  autoComplete="new-password"
                  error={registerError && registerError.includes('match') ? registerError : null}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    <label htmlFor="register-invitation-code" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('invitationCode')}</label>
                    <span className="text-red-500">*</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInvitationHelp(true)}
                    className="text-xs text-[#0066ff] hover:text-blue-500 underline"
                  >
                    {t('howToGetInvitationCode')}
                  </button>
                </div>
                <input
                  id="register-invitation-code"
                  type="text"
                  autoComplete="new-invitation-code"
                  value={registerInvitationCode}
                  onChange={(e) => setRegisterInvitationCode(e.target.value)}
                  placeholder={t('enterInvitationCode')}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50 transition-colors ${
                    isDarkMode
                      ? 'bg-[#1c1c1c] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
                  }`}
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
                  {t('cancel')}
                </button>
                <button className="flex-1 bg-[#0066ff] hover:bg-blue-600 text-white font-medium py-2.5 rounded-xl transition-colors shadow-md shadow-blue-600/20">
                  {t('signUp')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invitation Code Help Modal */}
      {showInvitationHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl border ${
              isDarkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-[#0066ff]/20' : 'bg-blue-50'}`}>
                <MessageCircle className="text-[#0066ff]" size={20} />
              </div>
              <h2 className="text-lg font-semibold">{t('getInvitationCode')}</h2>
            </div>

            <p className={`text-sm mb-5 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('invitationCodeHelp')}
            </p>

            <button
              onClick={handleCopyWeChatId}
              className={`w-full p-4 rounded-xl border transition-all duration-200 group cursor-pointer ${
                copiedWeChatId
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : isDarkMode
                    ? 'border-gray-600 bg-[#1c1c1c] hover:border-[#0066ff] hover:bg-[#252525]'
                    : 'border-gray-200 bg-gray-50 hover:border-[#0066ff] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>WeChat ID</p>
                  <p className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>-harveyhe-</p>
                </div>
                <div className={`flex items-center gap-1 transition-colors ${copiedWeChatId ? 'text-green-500' : 'text-gray-400 group-hover:text-[#0066ff]'}`}>
                  {copiedWeChatId ? (
                    <>
                      <Check size={18} />
                      <span className="text-sm">{t('copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      <span className="text-sm">{t('copy')}</span>
                    </>
                  )}
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowInvitationHelp(false)}
              className="w-full mt-5 bg-[#0066ff] hover:bg-blue-600 text-white font-medium py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30"
            >
              {t('gotIt')}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
