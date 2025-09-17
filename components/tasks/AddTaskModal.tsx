import React, { useState, FormEvent, useEffect } from 'react';
import type { Task } from '../../types';
import { XMarkIcon } from '../icons/Icons';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'isCompleted'>) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<{ name?: string; description?: string; deadline?: string }>();

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setDeadline(new Date().toISOString().split('T')[0]); // Default to today
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Task name is required.';
    if (!description.trim()) newErrors.description = 'Task description is required.';
    if (!deadline) newErrors.deadline = 'A deadline is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({ name, description, deadline });
      onClose();
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
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">Add New Task</h3>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="task-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Name</label>
                <input
                  type="text"
                  id="task-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={`mt-1 block w-full shadow-sm sm:text-sm ${errors?.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`}
                />
                {errors?.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Description</label>
                <textarea
                  id="task-description"
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={`mt-1 block w-full shadow-sm sm:text-sm ${errors?.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`}
                />
                {errors?.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>}
              </div>
              <div>
                <label htmlFor="task-deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</label>
                <input
                  type="date"
                  id="task-deadline"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className={`mt-1 block w-full shadow-sm sm:text-sm ${errors?.deadline ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`}
                />
                {errors?.deadline && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.deadline}</p>}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-card/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
            >
              Save Task
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

export default AddTaskModal;