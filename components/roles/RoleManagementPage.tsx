import React, { useState } from 'react';
import type { Role, Permission } from '../../types';
import EditRoleModal from './EditRoleModal';
import CreateRoleModal from './CreateRoleModal';
import DeleteConfirmationModal from '../users/DeleteConfirmationModal';
import { ShieldCheckIcon, PencilIcon, PlusIcon, TrashIcon } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';

const RoleManagementPage: React.FC = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const { roles, createRole, updateRole, deleteRole, hasPermission } = useAuth();

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handleCreateRole = async (newRole: Role) => {
    try {
      await createRole(newRole);
      setIsCreateModalOpen(false);
    } catch (error: any) {
      console.error("Failed to create role:", error);
      alert(`Error creating role: ${error.message}`);
    }
  };

  const handleUpdateRolePermissions = async (roleId: string, updatedPermissions: Permission[]) => {
    try {
      await updateRole(roleId, updatedPermissions);
      setIsEditModalOpen(false);
      setSelectedRole(null);
    } catch (error: any) {
      console.error("Failed to update role:", error);
      alert(`Error updating role: ${error.message}`);
    }
  };

  const handleDeleteClick = (role: Role) => {
    setDeletingRole(role);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRole) return;
    try {
      await deleteRole(deletingRole.id);
      setDeleteModalOpen(false);
      setDeletingRole(null);
    } catch (error: any) {
       console.error("Failed to delete role:", error);
       alert(`Error deleting role: ${error.message}`);
       setDeleteModalOpen(false);
       setDeletingRole(null);
    }
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
        {roles.map(role => {
          const isDefaultRole = ['Administrator', 'Manager', 'Technician'].includes(role.id);
          return (
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
             <div className="mt-6 text-right flex items-center justify-end space-x-3">
                {hasPermission('roles:manage') && (
                    <>
                      <button
                          onClick={() => handleEditRole(role)}
                          className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit
                      </button>
                       <button
                          onClick={() => handleDeleteClick(role)}
                          disabled={isDefaultRole}
                          className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 dark:bg-red-900/40 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 shadow-sm hover:bg-red-200 dark:hover:bg-red-900/60 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isDefaultRole ? "Default system roles cannot be deleted." : "Delete role"}
                      >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete
                      </button>
                    </>
                )}
            </div>
          </div>
        )})}
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

      {deletingRole && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={deletingRole.name}
          itemType="role"
        />
      )}
    </div>
  );
};

export default RoleManagementPage;