import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { User, Notification as NotificationType, Task } from '../../types';
import { BellIcon, MagnifyingGlassIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Bars3Icon, CreditCardIcon, ChatBubbleBottomCenterTextIcon, CheckCircleIcon, XCircleIcon, SwitchHorizontalIcon, CheckIcon as CheckMarkIcon, ClipboardDocumentCheckIcon } from '../icons/Icons';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '../../hooks/useAuth';
import { backendUrl } from '../../config';

// A map to convert icon names from the API into actual React components
const iconMap: { [key: string]: React.ElementType } = {
  CheckCircleIcon: CheckCircleIcon,
  ChatBubbleBottomCenterTextIcon: ChatBubbleBottomCenterTextIcon,
  XCircleIcon: XCircleIcon,
  CreditCardIcon: CreditCardIcon,
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

interface HeaderProps {
  user: User;
  tasks: Task[];
  onLogout: () => void;
  onNavigate: (pageId: string) => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, tasks, onLogout, onNavigate, onToggleSidebar }) => {
  const { originalUser, allUsers, switchUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [impersonateOpen, setImpersonateOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const impersonateRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
        const response = await fetch(`${backendUrl}/api/notifications?userId=${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data: ApiNotification[] = await response.json();
        // Convert API data to the frontend's NotificationType
        const formattedNotifications = data.map(n => ({
            ...n,
            icon: iconMap[n.iconName] || CreditCardIcon // Use a default icon if name is invalid
        }));
        setNotifications(formattedNotifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (impersonateRef.current && !impersonateRef.current.contains(event.target as Node)) {
        setImpersonateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeAllDropdowns = () => {
    setDropdownOpen(false);
    setNotificationOpen(false);
    setImpersonateOpen(false);
  }

  const toggleUserDropdown = () => {
    const isOpen = dropdownOpen;
    closeAllDropdowns();
    setDropdownOpen(!isOpen);
  }

  const toggleNotificationDropdown = () => {
    const isOpen = notificationOpen;
    closeAllDropdowns();
    setNotificationOpen(!isOpen);
  }

  const toggleImpersonateDropdown = () => {
    const isOpen = impersonateOpen;
    closeAllDropdowns();
    setImpersonateOpen(!isOpen);
  }

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    // In a real app, you would also send a request to the backend to update the read status
  }

  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.read) {
        setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        // In a real app, you'd send a request to mark this specific notification as read on the backend
    }
    onNavigate(notification.link);
    setNotificationOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const incompleteTasksCount = tasks.filter(t => !t.isCompleted).length;

  return (
    <header className="h-20 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white mr-4"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex items-center space-x-3 sm:space-x-6">
        {/* User Impersonation */}
        {originalUser && user?.id === originalUser.id && (
           <div className="relative" ref={impersonateRef}>
             <button
                onClick={toggleImpersonateDropdown}
                className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white"
                aria-label="Switch user view"
              >
                <SwitchHorizontalIcon className="h-6 w-6" />
             </button>
             {impersonateOpen && (
                <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-md bg-white dark:bg-dark-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white px-2">Switch User View</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-2">Test application as another user.</p>
                    </div>
                    <ul className="py-1 max-h-80 overflow-y-auto">
                      {allUsers.map(testUser => (
                         <li key={testUser.id}>
                            <button
                                onClick={() => { switchUser(testUser.id); setImpersonateOpen(false); }}
                                className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <div className="flex items-center">
                                    <img src={testUser.avatarUrl} alt={testUser.name} className="h-8 w-8 rounded-full object-cover mr-3" />
                                    <div>
                                        <p className="font-medium">{testUser.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{testUser.role}</p>
                                    </div>
                                </div>
                                {user.id === testUser.id && <CheckMarkIcon className="h-5 w-5 text-primary" />}
                            </button>
                         </li>
                      ))}
                    </ul>
                </div>
             )}
           </div>
        )}

        {/* Tasks */}
        <div className="relative">
             <button 
                onClick={() => onNavigate('tasks')} 
                className="relative text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white"
                aria-label={`Tasks (${incompleteTasksCount} incomplete)`}
            >
                <ClipboardDocumentCheckIcon className="h-6 w-6" />
                {incompleteTasksCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary justify-center items-center text-xs text-white">{incompleteTasksCount}</span>
                </span>
                )}
            </button>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={toggleNotificationDropdown} 
            className="relative text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white"
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary justify-center items-center text-xs text-white">{unreadCount}</span>
              </span>
            )}
          </button>
          {notificationOpen && (
            <NotificationDropdown 
              notifications={notifications}
              onMarkAllRead={handleMarkAllRead}
              onNotificationClick={handleNotificationClick}
              onNavigate={onNavigate}
            />
          )}
        </div>
        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={toggleUserDropdown} className="flex items-center space-x-2">
            <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
            <div className="text-left hidden md:block">
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
            </div>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-dark-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <UserCircleIcon className="h-5 w-5 mr-3" />
                  Profile
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;