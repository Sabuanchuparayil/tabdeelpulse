import React from 'react';
import { SunIcon, MoonIcon } from '../icons/Icons';

interface SettingsPageProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ isDarkMode, onToggleDarkMode }) => {

  const FormRow: React.FC<{ label: string, children: React.ReactNode, description?: string }> = ({ label, children, description }) => (
    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:py-5 border-b border-gray-200 dark:border-gray-700">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:mt-px sm:pt-2">
        {label}
      </label>
      <div className="mt-1 sm:mt-0 sm:col-span-2">
        {children}
        {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>

      <div className="bg-white dark:bg-dark-card shadow-md rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">General Settings</h3>
          <div className="mt-6">
            <FormRow label="Theme" description="Choose between a light or dark interface.">
              <div className="flex items-center space-x-2">
                  <SunIcon className={`h-6 w-6 ${!isDarkMode ? 'text-primary' : 'text-gray-400'}`} />
                  <button
                    type="button"
                    onClick={onToggleDarkMode}
                    className={`${isDarkMode ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                    role="switch"
                    aria-checked={isDarkMode}
                  >
                    <span
                      aria-hidden="true"
                      className={`${isDarkMode ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                    />
                  </button>
                  <MoonIcon className={`h-6 w-6 ${isDarkMode ? 'text-primary' : 'text-gray-400'}`} />
              </div>
            </FormRow>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;