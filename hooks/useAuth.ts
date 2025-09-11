import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import type { User, Permission, Role } from "../types";
import { initialRoles } from "../components/roles/RoleManagementPage";
import API_BASE from "../config";

interface AuthContextType {
  user: User | null;
  originalUser: User | null;
  allUsers: User[];
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  switchUser: (userId: number) => void;
  hasPermission: (permission: Permission) => boolean;
  addUser: (
    newUser: Omit<
      User,
      "id" | "role" | "permissions" | "financialLimit" | "avatarUrl"
    > & { avatarUrl?: string }
  ) => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>(() => {
    try {
      const storedRoles = localStorage.getItem("tabdeel-pulse-roles");
      if (storedRoles) {
        const parsed = JSON.parse(storedRoles);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.error("Failed to parse roles from localStorage", error);
    }
    return initialRoles;
  });

  // persist roles
  useEffect(() => {
    try {
      localStorage.setItem("tabdeel-pulse-roles", JSON.stringify(roles));
    } catch (error) {
      console.error("Failed to save roles to localStorage", error);
    }
  }, [roles]);

  const enhanceUser = useCallback(
    (user: User): User => {
      const role = roles.find((r) => r.id === user.roleId);
      return {
        ...user,
        permissions: role ? role.permissions : [],
        financialLimit:
          role?.id === "Administrator"
            ? 100000
            : role?.id === "Manager"
            ? 50000
            : 0,
      };
    },
    [roles]
  );

  // fetch initial users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/users`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const usersFromApi: User[] = await response.json();
        const enhanced = usersFromApi.map(enhanceUser);
        setAllUsers(enhanced);

        // restore logged-in user if saved
        const stored = localStorage.getItem("tabdeel-user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setActiveUser(parsed);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [enhanceUser]);

  const originalUser = useMemo(
    () => allUsers.find((u) => u.id === 1) || null,
    [allUsers]
  );

  const switchUser = useCallback(
    (userId: number) => {
      const found = allUsers.find((u) => u.id === userId);
      setActiveUser(found || null);
    },
    [allUsers]
  );

  const addUser = async (
    newUserData: Omit<User, "id" | "role" | "permissions" | "financialLimit">
  ) => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      });
      if (!res.ok) throw new Error("Failed to add user");
      const added = await res.json();
      setAllUsers((prev) => [enhanceUser(added), ...prev]);
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${updatedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      if (!res.ok) throw new Error("Failed to update user");
      const updated = await res.json();
      const enhanced = enhanceUser(updated);
      setAllUsers((prev) =>
        prev.map((u) => (u.id === enhanced.id ? enhanced : u))
      );
      if (activeUser?.id === enhanced.id) {
        setActiveUser(enhanced);
        localStorage.setItem("tabdeel-user", JSON.stringify(enhanced));
      }
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      setAllUsers((prev) => prev.filter((u) => u.id !== userId));
      if (activeUser?.id === userId) {
        setActiveUser(null);
        localStorage.removeItem("tabdeel-user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const loginUser = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    setActiveUser(data.user);
    localStorage.setItem("tabdeel-user", JSON.stringify(data.user));
  };

  const logoutUser = () => {
    setActiveUser(null);
    localStorage.removeItem("tabdeel-user");
  };

  const hasPermission = useMemo(
    () => (perm: Permission) => {
      if (!activeUser) return false;
      if (activeUser.permissions.includes("system:admin")) return true;
      return activeUser.permissions.includes(perm);
    },
    [activeUser]
  );

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        originalUser,
        allUsers,
        roles,
        setRoles,
        switchUser,
        hasPermission,
        addUser,
        updateUser,
        deleteUser,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

