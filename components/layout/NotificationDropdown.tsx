import React from 'react';
import { Notification } from '../../types';

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onNotificationClick: (notification: Notification) => void;
  onNavigate: (pageId: string) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onMarkAllRead, onNotificationClick, onNavigate }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-md bg-white dark:bg-dark-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-sm font-medium text-primary hover:text-primary/80 focus:outline-none"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>
      <ul className="max-h-80 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
        {notifications.map(notification => (
          <li key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <button
              onClick={() => onNotificationClick(notification)}
              className="w-full text-left p-4 flex items-start space-x-4"
            >
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
            </button>
          </li>
        ))}
      </ul>
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-card/50 text-center">
        <button 
          onClick={() => onNavigate('notifications')}
          className="text-sm font-medium text-primary hover:text-primary/80 w-full"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;