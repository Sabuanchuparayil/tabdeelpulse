import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardPage from '../dashboard/DashboardPage';
import UserManagementPage from '../users/UserManagementPage';
import UserProfilePage from '../users/UserProfilePage';
import RoleManagementPage, { initialRoles } from '../roles/RoleManagementPage';
import FinancePage from '../finance/FinancePage';
import ServiceJobsPage from '../jobs/ServiceJobsPage';
import MessagesPage from '../messages/MessagesPage';
import ProjectsPage from '../projects/ProjectsPage';
import AccountHeadsPage from '../accounts/AccountHeadsPage';
import SettingsPage from '../settings/SettingsPage';
import TaskManagementPage from '../tasks/TaskManagementPage';
import AnnouncementsPage from '../announcements/AnnouncementsPage';
import type { Role, Task, Announcement } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { mockAnnouncements } from '../../data/mockData';
import { ExclamationTriangleIcon } from '../icons/Icons';

const mockTasks: Task[] = [
    { id: 'task-1', description: 'Review Q3 budget proposals', deadline: '2024-07-25', isCompleted: false },
    { id: 'task-2', description: 'Follow up with Al Naboodah on pending invoice', deadline: '2024-07-24', isCompleted: false },
    { id: 'task-3', description: 'Prepare for weekly sync meeting', deadline: '2024-07-23', isCompleted: true },
    { id: 'task-4', description: 'Onboard new technician hires', deadline: '2024-07-26', isCompleted: false },
];


interface MainLayoutProps {
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onLogout, isDarkMode, toggleDarkMode }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [roles, setRoles] = useState<Role[]>(() => {
    try {
        const storedRoles = localStorage.getItem('tabdeel-pulse-roles');
        if (storedRoles) {
            return JSON.parse(storedRoles);
        }
    } catch (error) {
        console.error("Failed to parse roles from localStorage", error);
    }
    return initialRoles;
  });
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, originalUser, switchUser } = useAuth();
  
  useEffect(() => {
    try {
        localStorage.setItem('tabdeel-pulse-roles', JSON.stringify(roles));
    } catch (error) {
        console.error("Failed to save roles to localStorage", error);
    }
  }, [roles]);
  
  const handleAddTask = (taskData: Omit<Task, 'id' | 'isCompleted'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      isCompleted: false,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  const handleAddAnnouncement = (announcementData: Omit<Announcement, 'id' | 'author' | 'timestamp'>) => {
    if (!user) return;
    const newAnnouncement: Announcement = {
        ...announcementData,
        id: `ann-${Date.now()}`,
        author: {
            name: user.name,
            avatarUrl: user.avatarUrl || ''
        },
        timestamp: new Date().toISOString().split('T')[0],
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };


  if (!user) {
    // Handle loading state or redirect
    return <div>Loading...</div>;
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
        return <TaskManagementPage tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} />;
      case 'users':
        return <UserManagementPage roles={roles} />;
      case 'profile':
        return <UserProfilePage user={user} />;
      case 'roles':
        return <RoleManagementPage roles={roles} setRoles={setRoles} />;
      case 'projects':
        return <ProjectsPage />;
      case 'account-heads':
        return <AccountHeadsPage />;
      case 'settings':
        return <SettingsPage isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />;
      case 'announcements':
        return <AnnouncementsPage announcements={announcements} onAddAnnouncement={handleAddAnnouncement} />;
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