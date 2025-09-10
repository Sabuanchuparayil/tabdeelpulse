import React, { useState, FormEvent, useEffect } from 'react';
import type { Thread, Message, User } from '../../types';
import { XMarkIcon } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';
// FIX: Removed incorrect import of mockUsersList as it does not exist.

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (thread: Omit<Thread, 'id' | 'lastMessage' | 'timestamp' | 'unreadCount'>) => void;
}

const CreateThreadModal: React.FC<CreateThreadModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<{ title?: string; initialMessage?: string, participants?: string } >({});
  // FIX: Get `allUsers` from useAuth to populate the participants list.
  const { user: currentUser, allUsers } = useAuth();
  
  const availableUsers = allUsers.filter(u => u.id !== currentUser?.id);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setInitialMessage('');
      setSelectedParticipants(new Set());
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = 'A title is required for the conversation.';
    if (!initialMessage.trim()) newErrors.initialMessage = 'An initial message is required.';
    if (selectedParticipants.size === 0) newErrors.participants = 'Please select at least one participant.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleParticipantToggle = (userId: number) => {
    setSelectedParticipants(prev => {
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
    if (validate() && currentUser) {
        const firstMessage: Message = {
            id: Date.now(),
            user: { name: currentUser.name, avatarUrl: currentUser.avatarUrl || '' },
            text: initialMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}),
        };
        // FIX: The User object has an optional avatarUrl, which is not compatible with the Thread's participant type. Map the filtered users to provide a default empty string for avatarUrl, ensuring type compatibility.
        const participants = [
            { name: currentUser.name, avatarUrl: currentUser.avatarUrl || '' },
            ...allUsers
                .filter(u => selectedParticipants.has(u.id))
                .map(u => ({
                    name: u.name,
                    avatarUrl: u.avatarUrl || '',
                }))
        ];

        onSave({
            title,
            participants,
            messages: [firstMessage],
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
      <div className="relative inline-block align-bottom bg-white dark:bg-dark-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white dark:bg-dark-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">New Conversation</h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                    <label htmlFor="thread-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input type="text" id="thread-title" value={title} onChange={e => setTitle(e.target.value)} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`} />
                    {errors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>}
                </div>
                <div>
                    <label htmlFor="participants" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Participants</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {availableUsers.map(user => (
                            <div key={user.id} className="relative flex items-start">
                                <div className="flex items-center h-5">
                                    <input id={`user-${user.id}`} type="checkbox" checked={selectedParticipants.has(user.id)} onChange={() => handleParticipantToggle(user.id)} className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"/>
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor={`user-${user.id}`} className="font-medium text-gray-700 dark:text-gray-300">{user.name}</label>
                                </div>
                            </div>
                        ))}
                    </div>
                     {errors.participants && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.participants}</p>}
                </div>
                <div>
                    <label htmlFor="initial-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                    <textarea id="initial-message" rows={4} value={initialMessage} onChange={e => setInitialMessage(e.target.value)} className={`mt-1 block w-full shadow-sm sm:text-sm ${errors.initialMessage ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`}></textarea>
                    {errors.initialMessage && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.initialMessage}</p>}
                </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-card/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm">
              Start Conversation
            </button>
            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateThreadModal;