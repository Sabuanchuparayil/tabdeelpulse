import React from 'react';
import {
  PulseIcon,
  ClipboardDocumentCheckIcon,
} from '../icons/Icons';
import type { NavLink } from '../../types';

interface SidebarProps {
  activePage: string;
  onNavigate: (pageId: string) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen, setOpen }) => {
  const mainNav: NavLink[] = [
    { id: 'dashboard', href: '#', label: 'Dashboard' },
    { id: 'announcements', href: '#', label: 'Announcements' },
    { id: 'finance', href: '#', label: 'Finance' },
    { id: 'service-jobs', href: '#', label: 'Service Jobs' },
    { id: 'messages', href: '#', label: 'Messages' },
  ];

  const tasksNav: NavLink[] = [
      { id: 'tasks', href: '#', label: 'Tasks' },
  ];

  const accountNav: NavLink[] = [
    { id: 'profile', href: '#', label: 'Profile' },
  ];

  const adminNav: NavLink[] = [
    { id: 'users', href: '#', label: 'Users' },
    { id: 'roles', href: '#', label: 'Roles & Permissions' },
    { id: 'projects', href: '#', label: 'Projects' },
    { id: 'account-heads', href: '#', label: 'Account Heads' },
    { id: 'settings', href: '#', label: 'Settings' },
  ];

  const NavItem: React.FC<{ link: NavLink; isActive?: boolean; onClick: () => void }> = ({ link, isActive = false, onClick }) => (
    <li>
      <a
        href={link.href}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        className={`flex items-center p-3 my-1 rounded-lg transition-colors ${
          isActive
            ? 'bg-primary text-white shadow-lg'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        <span className="font-header font-medium">{link.label}</span>
      </a>
    </li>
  );

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      ></div>

      <aside className={`fixed inset-y-0 left-0 w-64 flex-shrink-0 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-700 flex flex-col z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-center px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <PulseIcon className="h-10 w-10 mr-3 text-primary" />
            <span className="text-2xl font-bold text-gray-800 dark:text-white font-header">Tabdeel Pulse</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <ul>
            {mainNav.map((link) => (
              <NavItem key={link.id} link={link} isActive={activePage === link.id} onClick={() => onNavigate(link.id)} />
            ))}
          </ul>
          <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Tasks</h3>
              <ul className="mt-2">
                  {tasksNav.map(link => (
                      <NavItem key={link.id} link={link} isActive={activePage === link.id} onClick={() => onNavigate(link.id)} />
                  ))}
              </ul>
          </div>
          <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Account</h3>
              <ul className="mt-2">
                  {accountNav.map(link => (
                      <NavItem key={link.id} link={link} isActive={activePage === link.id} onClick={() => onNavigate(link.id)} />
                  ))}
              </ul>
          </div>
          <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Administration</h3>
              <ul className="mt-2">
                  {adminNav.map(link => (
                      <NavItem key={link.id} link={link} isActive={activePage === link.id} onClick={() => onNavigate(link.id)} />
                  ))}
              </ul>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;