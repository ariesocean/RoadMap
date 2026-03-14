import React, { useState } from 'react';
import { X, Eye, EyeOff, HelpCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className={`relative w-full max-w-md p-8 rounded-3xl border ${
          isDarkMode
            ? 'bg-[#1e1e1e] border-[#333] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]'
            : 'bg-white border-gray-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]'
        }`}
      >
        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className={`absolute top-5 right-5 p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            isDarkMode
              ? 'text-gray-500 hover:bg-[#2d2d2d] hover:text-gray-300'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          }`}
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        {/* Header - Centered */}
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('resetPassword')}
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('enterEmailAndResetCode')}
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleVerify}>
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="reset-email"
              className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
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
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? 'bg-[#252525] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
              }`}
            />
          </div>

          {/* Reset Code Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <label
                htmlFor="reset-code"
                className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                {t('resetCode')}
              </label>
              <span className="text-red-500">*</span>
            </div>
            <div className="relative">
              <input
                id="reset-code"
                type={showResetCode ? 'text' : 'password'}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder={t('enterResetCode')}
                disabled={isLoading}
                autoComplete="off"
                className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-[#252525] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowResetCode(!showResetCode)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                  isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {showResetCode ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            {/* Hint Text - Right aligned with icon */}
            <div className={`flex items-center justify-end gap-1.5 text-xs ${isDarkMode ? 'text-[#0066ff]' : 'text-[#0066ff]'}`}>
              <HelpCircle size={14} />
              <span>{t('contactHarvey')}</span>
            </div>
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

          {/* Submit Button - Full Width */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0066ff] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('verifying')}
                </span>
              ) : (
                t('verifyResetCode')
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
