import React, { useState, FormEvent, useEffect } from 'react';
import type { User, Thread } from '../../types';
import { XMarkIcon, CheckIcon } from '../icons/Icons';

interface ManageParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (threadId: string, participantIds: number[]) => void;
  thread: Thread;
  // Fix: Add allUsers and currentUser to props
  allUsers: User[];
  currentUser: User;
}

const ManageParticipantsModal: React.FC<ManageParticipantsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  thread,
  allUsers,
  currentUser,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && currentUser) {
      // Initialize with current participants, excluding the current user as they can't be removed.
      const initialIds = thread.participants
        .filter(p => p.id !== currentUser.id)
        .map(p => p.id);
      setSelectedIds(new Set(initialIds));
    }
  }, [isOpen, thread, currentUser]);

  const handleToggle = (userId: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(thread.id, Array.from(selectedIds));
  };

  const availableUsers = allUsers.filter(u => u.id !== currentUser.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
      <div className="relative inline-block align-bottom bg-white dark:bg-dark-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-dark-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">Manage Participants</h3>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add or remove people from "{thread.title}".</p>
            <div className="mt-4 max-h-64 overflow-y-auto pr-2 space-y-2">
              {availableUsers.map(user => (
                <label key={user.id} htmlFor={`participant-${user.id}`} className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    id={`participant-${user.id}`}
                    type="checkbox"
                    checked={selectedIds.has(user.id)}
                    onChange={() => handleToggle(user.id)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover ml-3" />
                  <span className="ml-3 text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-card/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageParticipantsModal;
