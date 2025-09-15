import React, { useState, FormEvent, useEffect } from 'react';
import type { Announcement } from '../../types';
import { XMarkIcon } from '../icons/Icons';
import DocumentUpload from '../finance/DocumentUpload';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (announcement: { title: string; content: string; attachment: File | null }) => void;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>();

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setAttachment(null);
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!content.trim()) newErrors.content = 'Content is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({ title, content, attachment });
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
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">Create Announcement</h3>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label htmlFor="announcement-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  id="announcement-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={`mt-1 block w-full shadow-sm sm:text-sm ${errors?.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`}
                />
                {errors?.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>}
              </div>
              <div>
                <label htmlFor="announcement-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                <textarea
                  id="announcement-content"
                  rows={5}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className={`mt-1 block w-full shadow-sm sm:text-sm ${errors?.content ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary`}
                />
                {errors?.content && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachment (Optional)</label>
                <DocumentUpload onFileSelect={setAttachment} />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-card/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
            >
              Publish
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

export default CreateAnnouncementModal;