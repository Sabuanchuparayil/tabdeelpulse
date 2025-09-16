import React, { useState, useEffect, useCallback } from 'react';
import type { ServiceJob, JobComment } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { XMarkIcon, PaperAirplaneIcon, PaperClipIcon, ExclamationTriangleIcon } from '../icons/Icons';
import { backendUrl } from '../../config';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: ServiceJob;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ isOpen, onClose, job }) => {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState<JobComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch(`${backendUrl}/api/jobs/${job.id}/comments`);
        if (!response.ok) throw new Error('Failed to load comments');
        const data = await response.json();
        setComments(data);
    } catch (error) {
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  }, [job.id]);

  useEffect(() => {
    if (isOpen) {
        fetchComments();
    }
  }, [isOpen, fetchComments]);
  
  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    
    // Optimistic update
    const optimisticComment: JobComment = {
        id: Date.now(),
        user: { name: currentUser.name, avatarUrl: currentUser.avatarUrl || '' },
        text: newComment.trim(),
        timestamp: 'Just now',
    };
    setComments(prev => [...prev, optimisticComment]);
    setNewComment('');

    try {
        const response = await fetch(`${backendUrl}/api/jobs/${job.id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: newComment.trim(), userId: currentUser.id })
        });
        if (!response.ok) throw new Error('Failed to post comment');
        // If successful, refetch to sync with the server state (gets real ID, etc.)
        fetchComments();
    } catch (error) {
        console.error("Error posting comment:", error);
        // On error, revert the optimistic update
        setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
    }
  };


  if (!isOpen) return null;
  
  const handleEscalate = () => {
    alert(`Job ID ${job.id} has been escalated to management. A new communication thread has been created.`);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
      <div className="relative inline-block bg-white dark:bg-dark-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-3xl sm:w-full">
        <div className="bg-white dark:bg-dark-card px-4 pt-5 pb-4 sm:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">{job.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Job ID: {job.id} | Project: {job.project}</p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Comments</h4>
                <div className="space-y-4">
                  {isLoading && <p className="text-sm text-gray-500">Loading comments...</p>}
                  {!isLoading && comments.map(comment => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        <img src={comment.user.avatarUrl} alt={comment.user.name} className="h-8 w-8 rounded-full object-cover" />
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">{comment.user.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-300 mt-1">{comment.text}</p>
                        </div>
                      </div>
                  ))}
                </div>
                 {currentUser && (
                    <div className="mt-4 flex items-center">
                        <img src={currentUser.avatarUrl || ''} alt={currentUser.name} className="h-8 w-8 rounded-full object-cover mr-3" />
                        <div className="relative flex-grow">
                            <input 
                                type="text" 
                                placeholder="Add a comment..." 
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handlePostComment() }}
                                className="w-full pl-4 pr-20 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                <button className="text-gray-400 hover:text-primary"><PaperClipIcon className="h-5 w-5"/></button>
                                <button onClick={handlePostComment} className="p-1.5 rounded-full bg-primary text-white hover:bg-primary/90 disabled:bg-primary/50" disabled={!newComment.trim()}>
                                    <PaperAirplaneIcon className="h-4 w-4"/>
                                </button>
                            </div>
                        </div>
                    </div>
                 )}
            </div>
            <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Details</h4>
                <div className="space-y-3 text-sm">
                    <p><strong className="text-gray-600 dark:text-gray-400">Technician:</strong> {job.technician ? job.technician.name : 'Unassigned'}</p>
                    <p><strong className="text-gray-600 dark:text-gray-400">Status:</strong> {job.status}</p>
                    <p><strong className="text-gray-600 dark:text-gray-400">Priority:</strong> {job.priority}</p>
                </div>
                {job.status === 'Completed' && (
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Resolve Job</h4>
                        <textarea placeholder="Add mandatory resolution remarks..." rows={3} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                        <button className="w-full mt-2 rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-secondary/90">Mark as Resolved</button>
                    </div>
                )}
                 {(job.status === 'Assigned' || job.status === 'In Progress' || job.status === 'Completed') && (
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Need Help?</h4>
                        <button
                            onClick={handleEscalate}
                            className="w-full mt-2 flex items-center justify-center rounded-md border border-transparent bg-yellow-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                        >
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                            Escalate to Management
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;
