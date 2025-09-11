import React, { useState, useRef, useEffect } from 'react';
import type { User, Role, UserStatus } from '../../types';
import { UserPlusIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, UserCircleIcon, KeyIcon } from '../icons/Icons';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../../hooks/useAuth';


const UserManagementPage: React.FC = () => {
  const { allUsers, roles, addUser, updateUser, deleteUser, user: currentUser, hasPermission } = useAuth();
  
  // Modal states
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isConfirmStatusModalOpen, setConfirmStatusModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  
  // State for selected user
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [statusChangeUser, setStatusChangeUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);


  // Handlers for CRUD operations
  const handleAddUser = (newUserData: Omit<User, 'id' | 'avatarUrl' | 'role' | 'permissions' | 'financialLimit'>) => {
    addUser(newUserData);
    setAddModalOpen(false);
  };

  const handleUpdateUser = (updatedUser: User) => {
    updateUser(updatedUser);
    setEditModalOpen(false);
    setEditingUser(null);
  }

  const handleConfirmToggleStatus = () => {
    if (statusChangeUser) {
        updateUser({ ...statusChangeUser, status: statusChangeUser.status === 'Active' ? 'Disabled' : 'Active' });
    }
    setConfirmStatusModalOpen(false);
    setStatusChangeUser(null);
  };
  
  const handleConfirmDelete = () => {
    if (deletingUser) {
      deleteUser(deletingUser.id);
      setDeleteModalOpen(false);
      setDeletingUser(null);
    }
  };
  
  const handleConfirmResetPassword = () => {
    if (resetPasswordUser) {
      // In a real app, this would trigger an API call.
      alert(`A password reset link has been sent to ${resetPasswordUser.email}.`);
    }
    setResetPasswordModalOpen(false);
    setResetPasswordUser(null);
  };

  // Click handlers to open modals/perform actions
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };
  
  const handleDeleteClick = (user: User) => {
    setDeletingUser(user);
    setDeleteModalOpen(true);
  }
  
  const handleToggleStatusClick = (user: User) => {
    setStatusChangeUser(user);
    setConfirmStatusModalOpen(true);
  };
  
  const handleResetPasswordClick = (user: User) => {
    setResetPasswordUser(user);
    setResetPasswordModalOpen(true);
  };

  const StatusBadge: React.FC<{ status: User['status'] }> = ({ status }) => {
    const isActive = status === 'Active';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        }`}
      >
        {isActive ? <CheckCircleIcon className="h-4 w-4 mr-1.5" /> : <XCircleIcon className="h-4 w-4 mr-1.5" />}
        {status}
      </span>
    );
  };

  const ActionMenu: React.FC<{ user: User }> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const canUpdate = hasPermission('users:update');
    const canDelete = hasPermission('users:delete');
    const canResetPassword = hasPermission('users:reset_password');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleStatusLabel = user.status === 'Active' ? 'Disable' : 'Enable';

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <EllipsisVerticalIcon className="h-6 w-6" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-dark-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                        {canUpdate && (
                            <>
                                <button onClick={() => { handleEditClick(user); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <PencilIcon className="h-4 w-4 mr-3" />
                                    Edit
                                </button>
                                <button onClick={() => { handleToggleStatusClick(user); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                {user.status === 'Active' ? <XCircleIcon className="h-4 w-4 mr-3" /> : <CheckCircleIcon className="h-4 w-4 mr-3" />}
                                    {toggleStatusLabel}
                                </button>
                            </>
                        )}
                        {canResetPassword && (
                            <button onClick={() => { handleResetPasswordClick(user); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <KeyIcon className="h-4 w-4 mr-3" />
                                Reset Password
                            </button>
                        )}
                        {canDelete && (
                            <button onClick={() => { handleDeleteClick(user); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <TrashIcon className="h-4 w-4 mr-3" />
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">User Management</h1>
        {hasPermission('users:create') && (
            <button 
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Add User
            </button>
        )}
      </div>

      <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                    {allUsers.map((user) => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        {user.avatarUrl ? (
                                            <img className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl} alt={user.name} />
                                        ) : (
                                            <UserCircleIcon className="h-10 w-10 text-gray-300 dark:text-gray-600"/>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-gray-300">{user.role}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={user.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <ActionMenu user={user} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {allUsers.map(user => (
                <div key={user.id} className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                             <div className="flex-shrink-0 h-10 w-10">
                                {user.avatarUrl ? (
                                    <img className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl} alt={user.name} />
                                ) : (
                                    <UserCircleIcon className="h-10 w-10 text-gray-300 dark:text-gray-600"/>
                                )}
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                        </div>
                        <ActionMenu user={user} />
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Role</div>
                            <div className="text-sm text-gray-900 dark:text-gray-300">{user.role}</div>
                        </div>
                        <StatusBadge status={user.status} />
                    </div>
                </div>
            ))}
        </div>
      </div>

      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        onAddUser={handleAddUser}
        roles={roles}
      />
      
      {editingUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          user={editingUser}
          onUpdateUser={handleUpdateUser}
          roles={roles}
        />
      )}

      {deletingUser && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={deletingUser.name}
          itemType="user"
        />
      )}
      
      {statusChangeUser && (
          <ConfirmationModal
            isOpen={isConfirmStatusModalOpen}
            onClose={() => { setConfirmStatusModalOpen(false); setStatusChangeUser(null); }}
            onConfirm={handleConfirmToggleStatus}
            title={`Confirm Status Change`}
            message={`Are you sure you want to ${statusChangeUser.status === 'Active' ? 'disable' : 'enable'} the user "${statusChangeUser.name}"?`}
          />
      )}

      {resetPasswordUser && (
          <ConfirmationModal
            isOpen={isResetPasswordModalOpen}
            onClose={() => { setResetPasswordModalOpen(false); setResetPasswordUser(null); }}
            onConfirm={handleConfirmResetPassword}
            title={`Reset Password`}
            message={`Are you sure you want to send a password reset link to "${resetPasswordUser.name}"?`}
            confirmButtonText="Send Link"
          />
      )}
    </div>
  );
};

export default UserManagementPage;