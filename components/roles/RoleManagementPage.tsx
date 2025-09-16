import React, { useState } from 'react';
import type { Role, Permission } from '../../types';
import EditRoleModal from './EditRoleModal';
import CreateRoleModal from './CreateRoleModal';
import { ShieldCheckIcon, PencilIcon, PlusIcon } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';

const RoleManagementPage: React.FC = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { roles, setRoles, hasPermission } = useAuth();

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handleCreateRole = (newRole: Role) => {
    setRoles(prevRoles => [...prevRoles, newRole]);
    setIsCreateModalOpen(false);
  };

  const handleUpdateRolePermissions = (roleId: string, updatedPermissions: Permission[]) => {
    setRoles(prevRoles =>
      prevRoles.map(role =>
        role.id === roleId ? { ...role, permissions: updatedPermissions } : role
      )
    );
    setIsEditModalOpen(false);
    setSelectedRole(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Roles & Permissions</h1>
        {hasPermission('roles:manage') && (
            <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Role
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white dark:bg-dark-card shadow-md rounded-lg p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center mb-3">
                <ShieldCheckIcon className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{role.name}</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{role.description}</p>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Permissions:</h3>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.slice(0, 5).map(permission => (
                    <span key={permission} className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {permission}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                     <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
             <div className="mt-6 text-right">
                {hasPermission('roles:manage') && (
                    <button
                        onClick={() => handleEditRole(role)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit Permissions
                    </button>
                )}
            </div>
          </div>
        ))}
      </div>
      
      {selectedRole && (
        <EditRoleModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          role={selectedRole}
          onSave={handleUpdateRolePermissions}
        />
      )}

      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateRole}
      />
    </div>
  );
};

export default RoleManagementPage;
