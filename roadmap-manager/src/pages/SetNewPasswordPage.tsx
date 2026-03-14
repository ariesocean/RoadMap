import React, { useState } from 'react';
import { Moon, Sun, ListTodo } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { PasswordInput } from '@/components/PasswordInput';
import { useI18nStore } from '@/store/i18nStore';
import { useThemeStore } from '@/store/themeStore';

export const SetNewPasswordPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { resetToken, resetTokenExpiry, clearResetToken } = useAuthStore();
  const { t, language, setLanguage } = useI18nStore();
  const { theme, setTheme } = useThemeStore();

  React.useEffect(() => {
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetToken || !resetTokenExpiry) {
      setError(t('resetTokenMissing'));
      return;
    }

    if (Date.now() > resetTokenExpiry) {
      setError(t('resetTokenExpired'));
      clearResetToken();
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError(t('fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t('resetPasswordFailed'));
        return;
      }

      setSuccess(true);
      clearResetToken();
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(t('resetPasswordFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'dark bg-[#1c1c1c] text-white' : 'bg-[#f5f5f7] text-gray-900'}`}>
      {/* Theme Toggle */}
      <button
        onClick={handleThemeToggle}
        className={`absolute top-6 right-6 p-2.5 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-[#2d2d2d] text-gray-400 hover:text-white' : 'hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-900'}`}
        title={t('toggleTheme')}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Language Toggle */}
      <button
        onClick={handleLanguageToggle}
        className={`absolute top-6 right-16 px-3.5 py-2 rounded-xl transition-all duration-200 text-sm font-medium border ${isDarkMode ? 'bg-[#252525] border-[#333] hover:bg-[#2d2d2d] text-white' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900 shadow-sm'}`}
      >
        <span>{language === 'en' ? 'EN' : '中'}</span>
      </button>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className={`w-full max-w-md mx-4 rounded-3xl border transition-all duration-300 overflow-hidden ${
          isDarkMode
            ? 'bg-[#1e1e1e] border-[#333] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]'
            : 'bg-white border-gray-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)]'
        }`}
      >
        {/* Gradient Top Bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

        <div className="p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
              <div className="w-11 h-11 bg-[#0066ff] rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <ListTodo className="text-white" size={22} />
              </div>
            </div>
            <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('setNewPassword')}
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('enterNewPassword')}
            </p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className={`p-5 rounded-2xl mb-6 ${isDarkMode ? 'bg-green-900/20 text-green-400 border border-green-900/30' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">{t('resetPasswordSuccess')}</span>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-green-400/70' : 'text-green-600/70'}`}>
                  {t('redirectingToLogin')}
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-[#0066ff] hover:text-blue-500 font-medium transition-colors"
              >
                {t('backToLogin')}
              </button>
            </motion.div>
          ) : (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              {/* Password Inputs */}
              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {t('newPassword')}
                </label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder={t('enterNewPassword')}
                  confirmValue={confirmPassword}
                  confirmOnChange={setConfirmPassword}
                  confirmPlaceholder={t('confirmPasswordPlaceholder')}
                  autoComplete="off"
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-xl text-sm text-center ${isDarkMode ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-600 border border-red-100'}`}
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0066ff] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('resetting')}
                  </span>
                ) : (
                  t('resetPasswordBtn')
                )}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          {!success && (
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  clearResetToken();
                  navigate('/');
                }}
                className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-900'}`}
              >
                ← {t('backToLogin')}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SetNewPasswordPage;
