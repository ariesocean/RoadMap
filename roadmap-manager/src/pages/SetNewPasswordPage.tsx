import React, { useState } from 'react';
import { Moon, Sun, ListTodo } from 'lucide-react';
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
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'dark bg-[#1c1c1c] text-white' : 'bg-[#f9fafb] text-gray-900'}`}>
      <button
        onClick={handleThemeToggle}
        className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#2d2d2d] text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'}`}
        title={t('toggleTheme')}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <button
        onClick={handleLanguageToggle}
        className={`absolute top-6 right-16 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-semibold border ${isDarkMode ? 'bg-[#252525] border-[#333] hover:bg-[#2d2d2d] text-white' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-900'}`}
      >
        <span>{language === 'en' ? 'EN' : '中'}</span>
      </button>

      <div className={`w-full max-w-md mx-4 sm:mx-6 md:mx-0 rounded-2xl shadow-lg border transition-colors duration-300 overflow-hidden ${isDarkMode ? 'bg-[#252525] border-[#333] shadow-black/50' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>
        <div className="h-0.5 overflow-hidden">
          <div className={`w-full h-full ${isLoading ? 'gradient-line-animation' : ''}`} />
        </div>

        <div className="p-6 sm:p-7 md:p-8">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-7 md:mb-8">
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-[#0066ff] rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
              <ListTodo className="text-white" size={20} />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t('setNewPassword')}</h1>
          </div>

          {success ? (
            <div className="text-center">
              <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>
                {t('resetPasswordSuccess')}
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="new-password" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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

              {error && (
                <div className={`p-3 rounded-lg text-sm ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0066ff] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors mt-2 shadow-md shadow-blue-600/20"
              >
                {isLoading ? t('resetting') : t('resetPasswordBtn')}
              </button>
            </form>
          )}

          <div className="mt-6 sm:mt-7 md:mt-8 text-center">
            <button
              onClick={() => {
                clearResetToken();
                navigate('/');
              }}
              className="text-sm text-[#0066ff] hover:text-blue-500 font-medium hover:underline"
            >
              {t('backToLogin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetNewPasswordPage;
