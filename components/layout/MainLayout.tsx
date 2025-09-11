import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardPage from '../dashboard/DashboardPage';
import UserManagementPage from '../users/UserManagementPage';
import UserProfilePage from '../users/UserProfilePage';
import RoleManagementPage from '../roles/RoleManagementPage';
import FinancePage from '../finance/FinancePage';
import ServiceJobsPage from '../jobs/ServiceJobsPage';
import MessagesPage from '../messages/MessagesPage';
import ProjectsPage from '../projects/ProjectsPage';
import AccountHeadsPage from '../accounts/AccountHeadsPage';
import SettingsPage from '../settings/SettingsPage';
import TaskManagementPage from '../tasks/TaskManagementPage';
import AnnouncementsPage from '../announcements/AnnouncementsPage';
import type { Task, Announcement } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ExclamationTriangleIcon } from '../icons/Icons';

// ✅ import shared API base
import API_BASE from '../../config';

interface MainLayoutProps {
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onLogout, isDarkMode, toggleDarkMode }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, originalUser, switchUser } = useAuth();

  useEffect(() => {
    // ✅ consistent API_BASE
    fetch(`${API_BASE}/api/tasks`)
      .then(res => res.json())
      .then(setTasks)
      .catch(err => console.error("Error fetching tasks:", err));

    fetch(`${API_BASE}/api/announcements`)
      .then(res => res.json())
      .then(setAnnouncements)
      .catch(err => console.error("Error fetching announcements:", err));
  }, []);

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'isCompleted'>) => {
    const response = await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    const newTask = await response.json();
    setTasks(prev => [newTask, ...prev]);
  };

  const handleToggleTask = async (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
    await fetch(`${API_BASE}/api/tasks/${taskId}/toggle`, { method: 'PUT' });
  };

  const handleAddAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'author' | 'timestamp'>) => {
    if (!user) return;
    const newAnnouncementData = {
      ...announcementData,
      author: {
        name: user.name,
        avatarUrl: user.avatarUrl || '',
      },
    };

    const response = await fetch(`${API_BASE}/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnnouncementData),
    });
    const newAnnouncement = await response.json();
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const isImpersonating = originalUser && user.id !== originalUser.id;

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'finance': return <FinancePage />;
      case 'service-jobs': return <ServiceJobsPage />;
      case 'messages': return <MessagesPage />;
      case 'tasks': return <TaskManagementPage tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} />;
      case 'users': return <UserManagementPage />;
      case 'profile': return <UserProfilePage user={user} />;
      case 'roles': return <RoleManagementPage />;
      case 'projects': return <ProjectsPage />;
      case 'account-heads': return <AccountHeadsPage />;
      case 'settings': return <SettingsPage isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />;
      case 'announcements': return <AnnouncementsPage announcements={announcements} onAddAnnouncement={handleAddAnnouncement} />;
      case 'dashboard':
      default: return <DashboardPage onNavigate={handleNavigate} announcements={announcements} />;
    }
  };

  return (
    <div className="flex h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} tasks={tasks} onLogout={onLogout} onNavigate={handleNavigate} onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />

        {isImpersonating && (
          <div className="bg-yellow-100 dark:bg-yellow-900/50 border-b-2 border-yellow-500 text-yellow-800 dark:text-yellow-300 px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-4">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>
              Viewing as <strong>{user.name} ({user.role})</strong>.
            </span>
            <button
              onClick={() => switchUser(originalUser.id)}
              className="underline hover:text-yellow-600 dark:hover:text-yellow-200"
            >
              Return to Admin View
            </button>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light-bg dark:bg-dark-bg p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
