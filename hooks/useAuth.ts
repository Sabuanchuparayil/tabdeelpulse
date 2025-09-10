
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { User, Permission } from '../types';
import { initialRoles } from '../components/roles/RoleManagementPage';

interface AuthContextType {
  user: User | null;
  originalUser: User | null;
  allUsers: User[];
  switchUser: (userId: number) => void;
  hasPermission: (permission: Permission) => boolean;
  addUser: (newUser: Omit<User, 'id' | 'role' | 'permissions' | 'financialLimit' | 'avatarUrl'> & { avatarUrl?: string }) => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const enhanceUser = (user: User, roles: typeof initialRoles): User => {
    const role = roles.find(r => r.id === user.roleId);
    return {
        ...user,
        permissions: role ? role.permissions : [],
        financialLimit: role?.id === 'Administrator' ? 100000 : (role?.id === 'Manager' ? 50000 : 0),
    };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const usersFromApi: User[] = await response.json();
        const enhancedUsers = usersFromApi.map(u => enhanceUser(u, initialRoles));
        setAllUsers(enhancedUsers);
        
        // Set the initial user after fetching
        const initialAdmin = enhancedUsers.find(u => u.id === 1);
        if (initialAdmin) {
            setActiveUser(initialAdmin);
        }

      } catch (error) {
        console.error("Error fetching users:", error);
        // In a real app, you'd want to set an error state to show the user
      }
    };
    fetchUsers();
  }, []);

  const originalUser = useMemo(() => allUsers.find(u => u.id === 1) || null, [allUsers]);

  const switchUser = useCallback((userId: number) => {
    const userToSwitchTo = allUsers.find(u => u.id === userId);
    setActiveUser(userToSwitchTo || null);
  }, [allUsers]);
  
  const addUser = async (newUserData: Omit<User, 'id' | 'role' | 'permissions' | 'financialLimit'>) => {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUserData),
        });
        if (!response.ok) throw new Error('Failed to add user');
        const addedUserFromApi = await response.json();
        const enhancedNewUser = enhanceUser(addedUserFromApi, initialRoles);
        setAllUsers(prevUsers => [enhancedNewUser, ...prevUsers]);
    } catch (error) {
        console.error("Error adding user:", error);
    }
  };
  
  const updateUser = async (updatedUser: User) => {
     try {
        const response = await fetch(`/api/users/${updatedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser),
        });
        if (!response.ok) throw new Error('Failed to update user');
        const updatedUserFromApi = await response.json();
        const enhancedUser = enhanceUser(updatedUserFromApi, initialRoles);
        setAllUsers(users => users.map(user => user.id === enhancedUser.id ? enhancedUser : user));
        if (activeUser?.id === enhancedUser.id) {
            setActiveUser(enhancedUser);
        }
    } catch (error) {
        console.error("Error updating user:", error);
    }
  };

  const deleteUser = async (userId: number) => {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete user');
        }
        setAllUsers(users => users.filter(user => user.id !== userId));
        if (activeUser?.id === userId && originalUser) {
            setActiveUser(originalUser);
        }
    } catch (error) {
        console.error("Error deleting user:", error);
    }
  };

  const hasPermission = useMemo(() => (permission: Permission): boolean => {
    if (!activeUser) return false;
    if (activeUser.permissions.includes('system:admin')) {
      return true;
    }
    return activeUser.permissions.includes(permission);
  }, [activeUser]);

  const value = { 
      user: activeUser, 
      originalUser,
      allUsers,
      switchUser,
      hasPermission,
      addUser,
      updateUser,
      deleteUser
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
