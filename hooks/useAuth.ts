import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { User, Permission, Role } from '../types';
import { backendUrl } from '../config';

interface AuthContextType {
  user: User | null;
  originalUser: User | null;
  allUsers: User[];
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchUser: (userId: number) => void;
  hasPermission: (permission: Permission) => boolean;
  addUser: (newUser: Omit<User, 'id' | 'role' | 'permissions' | 'financialLimit' | 'avatarUrl'>) => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  changePassword: (userId: number, currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawAllUsers, setRawAllUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('tabdeel-pulse-user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });

  const [roles, setRoles] = useState<Role[]>([]);
  
  const enhanceUser = useCallback((user: User): User => {
    const role = roles.find(r => r.id === user.roleId);
    return {
        ...user,
        role: role ? role.name : user.roleId,
        permissions: role ? role.permissions : [],
        financialLimit: role?.id === 'Administrator' ? 100000 : (role?.id === 'Manager' ? 50000 : 0),
    };
  }, [roles]);
  
  const persistRoles = useCallback(async (newRoles: Role[]) => {
      try {
          await fetch(`${backendUrl}/api/roles`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newRoles),
          });
      } catch (error) {
          console.error("Failed to persist roles to backend:", error);
      }
  }, []);

  const handleSetRoles = (newRolesOrUpdater: React.SetStateAction<Role[]>) => {
        setRoles(prevRoles => {
            const newRoles = typeof newRolesOrUpdater === 'function'
                ? newRolesOrUpdater(prevRoles)
                : newRolesOrUpdater;

            if (JSON.stringify(newRoles) !== JSON.stringify(prevRoles)) {
                 persistRoles(newRoles);
            }
            return newRoles;
        });
    };


  useEffect(() => {
    if (activeUser) {
        localStorage.setItem('tabdeel-pulse-user', JSON.stringify(activeUser));
    } else {
        localStorage.removeItem('tabdeel-pulse-user');
    }
  }, [activeUser]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          fetch(`${backendUrl}/api/users`),
          fetch(`${backendUrl}/api/roles`)
        ]);

        if (!usersRes.ok) throw new Error('Failed to fetch users');
        if (!rolesRes.ok) throw new Error('Failed to fetch roles');
        
        const usersFromApi = await usersRes.json();
        const rolesFromApi = await rolesRes.json();
        
        setRawAllUsers(usersFromApi);
        setRoles(rolesFromApi);

      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, []);
  
  const login = useCallback(async (email: string, password: string) => {
      const response = await fetch(`${backendUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed.');
      }

      const { user: loggedInUser } = await response.json();
      setActiveUser(loggedInUser);
  }, []);
  
  const logout = useCallback(() => {
    setActiveUser(null);
  }, []);

  const allUsers = useMemo(() => rawAllUsers.map(u => enhanceUser(u)), [rawAllUsers, enhanceUser]);

  const originalUser = useMemo(() => {
      const user = allUsers.find(u => u.id === 1);
      return user || null;
  }, [allUsers]);

  const switchUser = useCallback((userId: number) => {
    const userToSwitchTo = rawAllUsers.find(u => u.id === userId);
    if(userToSwitchTo) {
      setActiveUser(userToSwitchTo);
    }
  }, [rawAllUsers]);
  
  const addUser = useCallback(async (newUserData: Omit<User, 'id' | 'role' | 'permissions' | 'financialLimit' | 'avatarUrl'>) => {
    try {
        const userDataWithAvatar = {
            ...newUserData,
            avatarUrl: `https://picsum.photos/seed/${newUserData.name.replace(/\s+/g, '')}/100/100`
        };
        const response = await fetch(`${backendUrl}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userDataWithAvatar),
        });
        if (!response.ok) throw new Error('Failed to add user');
        const addedUserFromApi = await response.json();
        setRawAllUsers(prevUsers => [addedUserFromApi, ...prevUsers]);
    } catch (error) {
        console.error("Error adding user:", error);
        throw error;
    }
  }, []);
  
  const updateUser = useCallback(async (updatedUser: User) => {
     try {
        const response = await fetch(`${backendUrl}/api/users/${updatedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser),
        });
        if (!response.ok) throw new Error('Failed to update user');
        const updatedUserFromApi = await response.json();
        setRawAllUsers(users => users.map(user => user.id === updatedUserFromApi.id ? updatedUserFromApi : user));
        setActiveUser(currentActiveUser => {
            if (currentActiveUser?.id === updatedUserFromApi.id) {
                return updatedUserFromApi;
            }
            return currentActiveUser;
        });
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
  }, []);

  const deleteUser = useCallback(async (userId: number) => {
    try {
        const response = await fetch(`${backendUrl}/api/users/${userId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete user');
        }
        setRawAllUsers(users => users.filter(user => user.id !== userId));
        setActiveUser(currentActiveUser => {
            if (currentActiveUser?.id === userId) {
                const adminUser = rawAllUsers.find(u => u.id === 1);
                return adminUser || null;
            }
            return currentActiveUser;
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
  }, [rawAllUsers]);
  
  const changePassword = useCallback(async (userId: number, currentPassword: string, newPassword: string) => {
    const response = await fetch(`${backendUrl}/api/users/${userId}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password.');
    }
  }, []);

  const user = useMemo(() => activeUser ? enhanceUser(activeUser) : null, [activeUser, enhanceUser]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    if (user.permissions.includes('system:admin')) {
      return true;
    }
    return user.permissions.includes(permission);
  }, [user]);

  const value = useMemo(() => ({ 
      user, 
      originalUser,
      allUsers,
      roles,
      setRoles: handleSetRoles,
      login,
      logout,
      switchUser,
      hasPermission,
      addUser,
      updateUser,
      deleteUser,
      changePassword,
  }), [user, originalUser, allUsers, roles, login, logout, switchUser, hasPermission, addUser, updateUser, deleteUser, changePassword, handleSetRoles]);

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
