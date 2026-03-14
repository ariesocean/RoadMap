/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LogOut, User, Key } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useMapsStore } from '@/store/mapsStore';
import { useI18nStore } from '@/store/i18nStore';
import { removeFromLocalStorage } from '@/utils/storage';
import { readRoadmapFile, writeMapFile } from '@/services/fileService';
import { PasswordInput } from '@/components/PasswordInput';

export const AccountPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUsernameEdit, setShowUsernameEdit] = useState(false);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { refreshTasks } = useTaskStore.getState();
  const username = useAuthStore((state) => state.username);
  const email = useAuthStore((state) => state.email);
  const setUsername = useAuthStore((state) => state.setUsername);
  const { setLoadingEnabled, setCurrentMap, resetLastEditedMapIdLoaded, currentMap, setSidebarCollapsed } = useMapsStore.getState();
  const { t } = useI18nStore();
  const popupRef = React.useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTogglePopup = () => {
    setIsOpen(!isOpen);
    // Reset states when opening/closing
    if (!isOpen) {
      setShowUsernameEdit(false);
      setShowPasswordEdit(false);
      setNewUsername('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }

    const userId = useAuthStore.getState().userId;
    if (!userId) {
      setError('User not logged in');
      return;
    }

    try {
      const response = await fetch('/api/auth/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username: newUsername.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update username');
        return;
      }

      setUsername(newUsername.trim());
      setShowUsernameEdit(false);
      setNewUsername('');
      setSuccess(t('usernameUpdated'));
    } catch (err) {
      setError(t('updateFailed'));
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword.trim()) {
      setError('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      setError('New password cannot be empty');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const userId = useAuthStore.getState().userId;
    if (!userId) {
      setError('User not logged in');
      return;
    }

    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update password');
        return;
      }

      setShowPasswordEdit(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSuccess(t('passwordUpdated'));
    } catch (err) {
      setError(t('updateFailed'));
    }
  };

  const handleLogout = async () => {
    setError(null);

    const { userId, logout } = useAuthStore.getState();

    try {
      // Save current roadmap to current map file before disconnecting
      if (currentMap) {
        const currentContent = await readRoadmapFile();
        await writeMapFile(currentMap, currentContent);
      }

      // Stop OpenCode server for this user
      if (userId) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
        } catch {
          // Continue with local logout even if server fails
        }
      }

      // Clear username from store and localStorage
      logout();

      // Clear connection state from localStorage
      removeFromLocalStorage('isConnected');

      // Set disconnected state to show login page
      useTaskStore.setState({ isConnected: false });

      // Cleanup maps state (same as original disconnect logic)
      setLoadingEnabled(false);
      setCurrentMap(null);
      setSidebarCollapsed(true);
      resetLastEditedMapIdLoaded();
      refreshTasks();

      // Close popup and navigate to login page
      setIsOpen(false);
    } catch (err) {
      setError('Failed to logout. Please try again.');
    }
  };

  return (
    <div className="relative" ref={popupRef}>
      {/* Username Display */}
      <div
        onClick={handleTogglePopup}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        <span className="text-sm font-medium text-secondary-text dark:text-dark-secondary-text">
          {username || 'User'}
        </span>
      </div>

      {/* Account Popup */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg border z-50 animate-in fade-in zoom-in-95 duration-200 bg-white dark:bg-dark-secondary-bg border-gray-200 dark:border-gray-700">
          <div className="p-4">
            {/* Header with username */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-[#0066ff] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {username || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {email || 'user@example.com'}
                </p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-3 p-2 rounded-lg text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="mt-3 p-2 rounded-lg text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                {success}
              </div>
            )}

            {/* Account Management Options */}
            <div className="mt-3 space-y-2">
              {/* Change Username */}
              {!showUsernameEdit ? (
                <button
                  onClick={() => setShowUsernameEdit(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('changeUsername')}</span>
                </button>
              ) : (
                <form onSubmit={handleUpdateUsername} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <input
                    id="new-username-input"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder={t('newUsername')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      className="flex-1 px-3 py-1.5 text-xs font-medium bg-[#0066ff] text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {t('confirm')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowUsernameEdit(false); setNewUsername(''); setError(null); setSuccess(null); }}
                      className="flex-1 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              )}

              {/* Change Password */}
              {!showPasswordEdit ? (
                <button
                  onClick={() => setShowPasswordEdit(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Key className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('changePassword')}</span>
                </button>
              ) : (
                <form onSubmit={handleUpdatePassword} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2">
                  <input
                    id="current-password-input"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('currentPassword')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50"
                    autoFocus
                  />
                  <PasswordInput
                    id="new-password-input"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder={t('newPassword')}
                    confirmValue={confirmNewPassword}
                    confirmOnChange={setConfirmNewPassword}
                    confirmPlaceholder={t('confirmNewPassword')}
                    error={error && error.includes('match') ? error : null}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-3 py-1.5 text-xs font-medium bg-[#0066ff] text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {t('confirm')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowPasswordEdit(false); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); setError(null); setSuccess(null); }}
                      className="flex-1 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPopup;
