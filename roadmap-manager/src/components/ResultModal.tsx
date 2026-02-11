import React, { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useResultModalStore } from '@/store/resultModalStore';

export const ResultModal: React.FC = () => {
  const { isOpen, title, content, closeModal, isStreaming } = useResultModalStore();
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (isOpen && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [content, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            {title}
            {isStreaming && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">
          <pre
            ref={preRef}
            className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded max-h-[60vh] overflow-auto"
          >
            {content || (isStreaming ? '等待输出...' : '执行完成')}
          </pre>
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isStreaming}
          >
            {isStreaming ? '执行中...' : '关闭'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
