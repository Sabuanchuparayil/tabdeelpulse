import React from 'react';
import { ExclamationTriangleIcon } from '../icons/Icons';

interface ErrorFallbackProps {
  onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-8 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 font-header">
        Oops! Something went wrong.
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        We've encountered an unexpected issue. Please try again. If the problem persists, please contact support.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Try Again
      </button>
    </div>
  );
};

export default ErrorFallback;