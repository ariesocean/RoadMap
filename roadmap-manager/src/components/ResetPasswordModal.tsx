import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore } from '@/store/i18nStore';

interface ResetPasswordModalProps {
  isDarkMode: boolean;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isDarkMode, onClose }) => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetCode, setShowResetCode] = useState(false);
  const navigate = useNavigate();
  const { setResetToken } = useAuthStore();
  const { t } = useI18nStore();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !resetCode.trim()) {
      setError(t('fillAllFields'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t('verificationFailed'));
        return;
      }

      const { token, expiresAt } = await response.json();
      setResetToken(token, expiresAt);
      navigate('/set-new-password');
      onClose();
    } catch (err) {
      setError(t('verificationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
            isDarkMode ? 'text-gray-400 hover:bg-[#333] hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold tracking-tight mb-1">{t('resetPassword')}</h2>
        <p className={`text-sm mb-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('enterEmailAndResetCode')}
        </p>

        <form className="space-y-4" onSubmit={handleVerify}>
          <div>
            <label htmlFor="reset-email" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('email')}
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('enterEmail')}
              disabled={isLoading}
              autoComplete="off"
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? 'bg-[#1c1c1c] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
              }`}
            />
          </div>
          <div>
            <label htmlFor="reset-code" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('resetCode')}
            </label>
            <div className="relative">
              <input
                id="reset-code"
                type={showResetCode ? 'text' : 'password'}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder={t('enterResetCode')}
                disabled={isLoading}
                autoComplete="off"
                className={`w-full px-4 py-2.5 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-[#1c1c1c] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowResetCode(!showResetCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showResetCode ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('contactHarvey')}
          </p>

          {error && (
            <div className={`p-3 rounded-lg text-sm ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 py-2.5 rounded-xl font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? 'border-[#333] text-gray-300 hover:bg-[#333]'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#0066ff] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors shadow-md shadow-blue-600/20"
            >
              {isLoading ? t('verifying') : t('verifyResetCode')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
