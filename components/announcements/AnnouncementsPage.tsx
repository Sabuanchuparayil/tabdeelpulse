import React, { useState } from 'react';
import type { Announcement } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { PlusIcon, MegaphoneIcon, PaperClipIcon, TrashIcon } from '../icons/Icons';
import CreateAnnouncementModal from './CreateAnnouncementModal';
import DeleteConfirmationModal from '../users/DeleteConfirmationModal';

interface AnnouncementsPageProps {
  announcements: Announcement[];
  onAddAnnouncement: (announcement: { title: string; content: string; attachment: File | null }) => void;
  onDeleteAnnouncement: (announcementId: string) => void;
}

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ announcements, onAddAnnouncement, onDeleteAnnouncement }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('announcements:create');
  const canDelete = hasPermission('announcements:delete');

  const handleDeleteClick = (ann: Announcement) => {
    setDeletingAnnouncement(ann);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingAnnouncement) {
      onDeleteAnnouncement(deletingAnnouncement.id);
    }
    setDeleteModalOpen(false);
    setDeletingAnnouncement(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Company Announcements</h1>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Announcement
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-dark-card shadow-md rounded-lg">
          <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Announcements</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">There are no company announcements at the moment.</p>
          {canCreate && (
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create First Announcement
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white dark:bg-dark-card shadow-md rounded-lg p-6 relative">
              {canDelete && (
                <button
                  onClick={() => handleDeleteClick(ann)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Delete announcement"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MegaphoneIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white pr-8">{ann.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{ann.timestamp}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-1 mb-3">
                      {ann.author ? (
                          <>
                              <img src={ann.author.avatarUrl} alt={ann.author.name} className="h-6 w-6 rounded-full object-cover"/>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ann.author.name}</span>
                          </>
                      ) : (
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">System Announcement</span>
                      )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ann.content}</p>
                  
                  {ann.attachmentUrl && (
                    <div className="mt-4">
                      {ann.attachmentType === 'application/pdf' ? (
                        <iframe
                          src={ann.attachmentUrl}
                          width="100%"
                          height="500px"
                          className="rounded-lg border border-gray-200 dark:border-gray-700"
                          title={ann.attachmentName || 'Embedded PDF'}
                        >
                          <p>Your browser does not support iframes.</p>
                        </iframe>
                      ) : ann.attachmentType?.startsWith('image/') ? (
                        <img
                          src={ann.attachmentUrl}
                          alt={ann.attachmentName || 'Attached image'}
                          className="mt-4 rounded-lg max-w-full h-auto border border-gray-200 dark:border-gray-700"
                        />
                      ) : ann.attachmentName ? (
                        <a
                          href={ann.attachmentUrl}
                          download={ann.attachmentName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <PaperClipIcon className="h-5 w-5 mr-2" />
                          View Attachment ({ann.attachmentName})
                        </a>
                      ) : null}
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {canCreate && (
        <CreateAnnouncementModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={onAddAnnouncement}
        />
      )}

      {deletingAnnouncement && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={deletingAnnouncement.title}
          itemType="announcement"
        />
      )}
    </div>
  );
};

export default AnnouncementsPage;