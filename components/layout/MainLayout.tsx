import React, { useState, useEffect, useCallback } from 'react';
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
import { backendUrl } from '../../config';

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
  const { user, originalUser, switchUser, allUsers } = useAuth();

  const fetchData = useCallback(async () => {
    try {
        const [tasksRes, announcementsRes] = await Promise.all([
            fetch(`${backendUrl}/api/tasks`),
            fetch(`${backendUrl}/api/announcements`)
        ]);

        if (!tasksRes.ok || !announcementsRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const tasksData = await tasksRes.json();
        const announcementsData = await announcementsRes.json();
        setTasks(tasksData);
        setAnnouncements(announcementsData);
    } catch (error) {
        console.error("Failed to fetch initial data for layout", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'isCompleted'>) => {
    try {
        const response = await fetch(`${backendUrl}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to add task');
        fetchData(); // Refetch data
    } catch (error) {
        console.error("Error adding task:", error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    try {
        const response = await fetch(`${backendUrl}/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isCompleted: !task.isCompleted })
        });
        if (!response.ok) throw new Error('Failed to toggle task');
        fetchData(); // Refetch data
    } catch (error) {
        console.error("Error toggling task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
        const response = await fetch(`${backendUrl}/api/tasks/${taskId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete task');
        fetchData(); // Refetch data
    } catch (error) {
        console.error("Error deleting task:", error);
    }
  };

  const handleAddAnnouncement = async (announcementData: { title: string; content: string }) => {
    if (!user) return;

    const newAnnouncementPayload = {
      title: announcementData.title,
      content: announcementData.content,
      author: {
        name: user.name,
        avatarUrl: user.avatarUrl || '',
      },
    };

    try {
      const response = await fetch(`${backendUrl}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAnnouncementPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error('Failed to add announcement');
      }
      fetchData(); // Refetch data
    } catch (error) {
      console.error("Error adding announcement:", error);
      throw new Error('Failed to add announcement');
    }
  };


  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
        const response = await fetch(`${backendUrl}/api/announcements/${announcementId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete announcement');
        fetchData(); // Refetch data
    } catch (error) {
        console.error("Error deleting announcement:", error);
    }
  };


  if (!user) {
    // This should ideally not be reached if App.tsx handles the check, but as a fallback:
    return <div className="flex items-center justify-center h-screen w-screen bg-light-bg dark:bg-dark-bg text-gray-500">Loading user data...</div>;
  }
  
  const isImpersonating = originalUser && user.id !== originalUser.id;
  
  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSidebarOpen(false); // Close sidebar on navigation
  }

  const renderContent = () => {
    switch (activePage) {
      case 'finance':
        return <FinancePage />;
      case 'service-jobs':
        return <ServiceJobsPage />;
      case 'messages':
        return <MessagesPage />;
      case 'tasks':
        return <TaskManagementPage tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} allUsers={allUsers} />;
      case 'users':
        return <UserManagementPage />;
      case 'profile':
        return <UserProfilePage />;
      case 'roles':
        return <RoleManagementPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'account-heads':
        return <AccountHeadsPage />;
      case 'settings':
        return <SettingsPage isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />;
      case 'announcements':
        return <AnnouncementsPage announcements={announcements} onAddAnnouncement={handleAddAnnouncement} onDeleteAnnouncement={handleDeleteAnnouncement} />;
      case 'dashboard':
      default:
        return <DashboardPage onNavigate={handleNavigate} announcements={announcements} />;
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
                    onClick={() => originalUser && switchUser(originalUser.id)}
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