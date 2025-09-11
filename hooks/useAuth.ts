import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { User, Permission, Role } from '../types';
import { initialRoles } from '../components/roles/RoleManagementPage';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('tabdeel-pulse-user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    try {
        const storedRoles = localStorage.getItem('tabdeel-pulse-roles');
        if (storedRoles) {
            const parsed = JSON.parse(storedRoles);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (error) {
        console.error("Failed to parse roles from localStorage", error);
    }
    return initialRoles;
  });
  
  const enhanceUser = useCallback((user: User): User => {
    const role = roles.find(r => r.id === user.roleId);
    return {
        ...user,
        permissions: role ? role.permissions : [],
        financialLimit: role?.id === 'Administrator' ? 100000 : (role?.id === 'Manager' ? 50000 : 0),
    };
  }, [roles]);

  useEffect(() => {
    try {
        localStorage.setItem('tabdeel-pulse-roles', JSON.stringify(roles));
    } catch (error) {
        console.error("Failed to save roles to localStorage", error);
    }
  }, [roles]);

  useEffect(() => {
    if (activeUser) {
        localStorage.setItem('tabdeel-pulse-user', JSON.stringify(activeUser));
    } else {
        localStorage.removeItem('tabdeel-pulse-user');
    }
  }, [activeUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/users`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const usersFromApi: User[] = await response.json();
        const enhancedUsers = usersFromApi.map(u => enhanceUser(u));
        setAllUsers(enhancedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [enhanceUser]);
  
  const login = async (email: string, password: string) => {
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
      const enhanced = enhanceUser(loggedInUser);
      setActiveUser(enhanced);
  };
  
  const logout = () => {
    setActiveUser(null);
  };


  const originalUser = useMemo(() => allUsers.find(u => u.id === 1) || null, [allUsers]);

  const switchUser = useCallback((userId: number) => {
    const userToSwitchTo = allUsers.find(u => u.id === userId);
    if(userToSwitchTo) {
      setActiveUser(enhanceUser(userToSwitchTo));
    }
  }, [allUsers, enhanceUser]);
  
  const addUser = async (newUserData: Omit<User, 'id' | 'role' | 'permissions' | 'financialLimit' | 'avatarUrl'>) => {
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
        const enhancedNewUser = enhanceUser(addedUserFromApi);
        setAllUsers(prevUsers => [enhancedNewUser, ...prevUsers]);
    } catch (error) {
        console.error("Error adding user:", error);
    }
  };
  
  const updateUser = async (updatedUser: User) => {
     try {
        const response = await fetch(`${backendUrl}/api/users/${updatedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser),
        });
        if (!response.ok) throw new Error('Failed to update user');
        const updatedUserFromApi = await response.json();
        const enhancedUser = enhanceUser(updatedUserFromApi);
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
        const response = await fetch(`${backendUrl}/api/users/${userId}`, {
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
      roles,
      setRoles,
      login,
      logout,
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