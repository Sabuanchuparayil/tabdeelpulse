import React, { useState, useEffect, useCallback } from 'react';
import type { Notification } from '../../types';
import { backendUrl } from '../../config';
import { BellIcon, CheckCircleIcon, CreditCardIcon, ChatBubbleBottomCenterTextIcon, XCircleIcon } from '../icons/Icons';

// A map to convert icon names from the API into actual React components
const iconMap: { [key: string]: React.ElementType } = {
  CheckCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  XCircleIcon,
  CreditCardIcon,
};

// Define a type for notifications coming from the API
interface ApiNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  iconName: string; // The API will send the name of the icon
  link: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/notifications`);
      if (!response.ok) throw new Error('Failed to fetch notifications.');
      const data: ApiNotification[] = await response.json();
      const formattedNotifications = data.map(n => ({
        ...n,
        icon: iconMap[n.iconName] || BellIcon, // Use a default icon
      }));
      setNotifications(formattedNotifications);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // In a real app, this would also make a POST request to update the backend.
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Notifications</h1>
        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
        >
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          Mark All as Read
        </button>
      </div>
      
      {isLoading && <div className="text-center p-8">Loading notifications...</div>}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}

      {!isLoading && !error && (
        <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <li key={notification.id} className={`p-4 transition-colors ${notification.read ? 'opacity-60 bg-gray-50 dark:bg-dark-card/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  <div className="flex items-start space-x-4">
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <notification.icon className="h-5 w-5 text-primary" />
                      </div>
                      {!notification.read && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-dark-card" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{notification.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notification.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{notification.timestamp}</p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="p-6 text-center text-gray-500 dark:text-gray-400">
                You have no new notifications.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
