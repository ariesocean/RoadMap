import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  confirmValue?: string;
  confirmOnChange?: (value: string) => void;
  confirmPlaceholder?: string;
  autoFocus?: boolean;
  error?: string | null;
  autoComplete?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  confirmValue,
  confirmOnChange,
  confirmPlaceholder = 'Confirm password',
  autoFocus = false,
  error,
  autoComplete,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const inputClass = `w-full px-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0066ff]/50 ${
    isDark
      ? 'bg-[#1c1c1c] border-[#333] text-white placeholder-gray-500 focus:border-[#0066ff]'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0066ff]'
  }`;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {confirmValue !== undefined && confirmOnChange && (
        <div className="relative">
          <input
            id={`${id}-confirm`}
            type={showConfirm ? 'text' : 'password'}
            value={confirmValue}
            onChange={(e) => confirmOnChange(e.target.value)}
            placeholder={confirmPlaceholder}
            autoComplete={autoComplete ? `${autoComplete}-confirmation` : undefined}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showConfirm ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
