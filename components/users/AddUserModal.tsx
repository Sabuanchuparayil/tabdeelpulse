import React, { useState, FormEvent, useEffect } from 'react';
import type { User, UserRole, UserStatus, Role } from '../../types';
import { XMarkIcon } from '../icons/Icons';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: Omit<User, 'id' | 'avatarUrl' | 'role' | 'permissions' | 'financialLimit'>) => void;
  roles: Role[];
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAddUser, roles }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState<UserRole>('');
  const [status, setStatus] = useState<UserStatus>('Active');
  const [roleDescription, setRoleDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string, roleId?: string; }>({});

  const validate = () => {
    const newErrors: { name?: string; email?: string, roleId?: string; } = {};
    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid.';
    }
    if (!roleId) newErrors.roleId = 'A role is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (isOpen) {
      const initialDefaultRole = roles.find(r => r.id === 'Technician')?.id || roles[0]?.id || '';
      setName('');
      setEmail('');
      setRoleId(initialDefaultRole);
      setStatus('Active');
      setErrors({});
      const initialRoleData = roles.find(r => r.id === initialDefaultRole);
      setRoleDescription(initialRoleData?.description || '');
    }
  }, [isOpen, roles]);
  
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoleId = e.target.value as UserRole;
    setRoleId(selectedRoleId);
    const selectedRoleObject = roles.find(r => r.id === selectedRoleId);
    setRoleDescription(selectedRoleObject?.description || '');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onAddUser({ 
        name, 
        email, 
        roleId, 
        status
      });
    }
  };
  
  const isFormValid = name.trim() && email && roleId && !errors.name && !errors.email;

  if (!isOpen) {
    return null;
  }
  
  const noRolesAvailable = roles.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

      {/* Modal panel */}
      <div className="relative inline-block align-bottom bg-white dark:bg-dark-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white dark:bg-dark-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                        Add New User
                    </h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                    <select
                      id="role"
                      value={roleId}
                      onChange={handleRoleChange}
                      disabled={noRolesAvailable}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    >
                      {noRolesAvailable ? (
                          <option>No roles available</option>
                      ) : (
                         roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                         ))
                      )}
                    </select>
                     {roleDescription && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {roleDescription}
                        </p>
                    )}
                    {errors.roleId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.roleId}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <fieldset className="mt-2">
                      <div className="space-y-2 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                        <div className="flex items-center">
                          <input id="status-active" name="status" type="radio" checked={status === 'Active'} onChange={() => setStatus('Active')} className="focus:ring-primary h-4 w-4 text-primary border-gray-300" />
                          <label htmlFor="status-active" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
                        </div>
                        <div className="flex items-center">
                          <input id="status-disabled" name="status" type="radio" checked={status === 'Disabled'} onChange={() => setStatus('Disabled')} className="focus:ring-primary h-4 w-4 text-primary border-gray-300" />
                          <label htmlFor="status-disabled" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">Disabled</label>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-card/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button
              type="submit"
              disabled={!isFormValid || noRolesAvailable}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add User
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;