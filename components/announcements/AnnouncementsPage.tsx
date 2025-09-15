import React, { useState } from 'react';
import type { Announcement } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { PlusIcon, MegaphoneIcon, PaperClipIcon } from '../icons/Icons';
import CreateAnnouncementModal from './CreateAnnouncementModal';

interface AnnouncementsPageProps {
  announcements: Announcement[];
  onAddAnnouncement: (announcement: { title: string; content: string; attachment: File | null }) => void;
}

const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ announcements, onAddAnnouncement }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('announcements:create');

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
            <div key={ann.id} className="bg-white dark:bg-dark-card shadow-md rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MegaphoneIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ann.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{ann.timestamp}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-1 mb-3">
                      <img src={ann.author.avatarUrl} alt={ann.author.name} className="h-6 w-6 rounded-full"/>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ann.author.name}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ann.content}</p>
                  
                  {ann.attachmentUrl && (
                    <div className="mt-4">
                      {ann.attachmentType === 'application/pdf' ? (
                        <object
                          data={ann.attachmentUrl}
                          type="application/pdf"
                          width="100%"
                          height="500px"
                          className="rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                            <p className="text-gray-700 dark:text-gray-300">
                              Your browser does not support embedded PDFs.
                            </p>
                            <a
                              href={ann.attachmentUrl}
                              download={ann.attachmentName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-primary hover:underline font-semibold"
                            >
                              Click here to download the attachment.
                            </a>
                          </div>
                        </object>
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
    </div>
  );
};

export default AnnouncementsPage;