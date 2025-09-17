import React, { useState, useEffect, useCallback } from 'react';
import type { Thread, Message } from '../../types';
import ChatView from './ChatView';
import { PlusIcon } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';
import CreateThreadModal from './CreateThreadModal';
import { backendUrl } from '../../config';

const MessagesPage: React.FC = () => {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user: currentUser } = useAuth();

    const fetchThreads = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${backendUrl}/api/threads?userId=${currentUser.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch conversations.');
            }
            const data: Thread[] = await response.json();
            setThreads(data);
            // If no thread is selected, or the selected one is gone, select the first one.
            if (!selectedThreadId || !data.some(t => t.id === selectedThreadId)) {
                 setSelectedThreadId(data[0]?.id || null);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, selectedThreadId]);

    useEffect(() => {
        fetchThreads();
    }, [fetchThreads]);


    const handleSendMessage = async (threadId: string, messageText: string) => {
        if (!currentUser) return;

        const optimisticMessage: Message = {
            id: Date.now(),
            user: { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl || '' },
            text: messageText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        // Optimistically update the UI
        setThreads(prevThreads => prevThreads.map(thread => {
            if (thread.id === threadId) {
                return {
                    ...thread,
                    messages: [...thread.messages, optimisticMessage],
                    lastMessage: messageText,
                    timestamp: optimisticMessage.timestamp,
                };
            }
            return thread;
        }));
        
        // Send to backend
        try {
            const response = await fetch(`${backendUrl}/api/threads/${threadId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: messageText, userId: currentUser.id })
            });
            if (!response.ok) {
                throw new Error('Failed to send message.');
            }
            // Refetch to sync with server state (gets real ID, etc.)
            fetchThreads(); 
        } catch (err) {
            console.error(err);
            setError("Failed to send message. Please try again.");
            // Revert optimistic update on failure
            fetchThreads();
        }
    };
    
    const handleCreateThread = async (data: { title: string, initialMessage: string, participantIds: number[] }) => {
        if (!currentUser) return;
        try {
             const response = await fetch(`${backendUrl}/api/threads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, creatorId: currentUser.id })
             });
             if (!response.ok) throw new Error('Failed to create thread.');
             
             // On success, close modal and refetch all threads
             setCreateModalOpen(false);
             fetchThreads();

        } catch (err) {
            console.error(err);
            // You could set an error state within the modal here
        }
    };

    const handleUpdateParticipants = async (threadId: string, participantIds: number[]) => {
        if (!currentUser) return;
        try {
            const response = await fetch(`${backendUrl}/api/threads/${threadId}/participants`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantIds, currentUserId: currentUser.id }),
            });
            if (!response.ok) {
                throw new Error('Failed to update participants');
            }
            // Refetch threads to update the UI with new participant list
            await fetchThreads();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to update participants. Please try again.");
        }
    };

    const handleDeleteMessage = async (threadId: string, messageId: number) => {
        if (!currentUser) return;

        const originalThreads = [...threads];
        // Optimistic update
        setThreads(prevThreads => prevThreads.map(thread => {
            if (thread.id === threadId) {
                const updatedMessages = thread.messages.filter(msg => msg.id !== messageId);
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                return {
                    ...thread,
                    messages: updatedMessages,
                    lastMessage: lastMessage ? lastMessage.text : 'No messages yet.',
                    timestamp: lastMessage ? lastMessage.timestamp : thread.timestamp,
                };
            }
            return thread;
        }));

        try {
            const response = await fetch(`${backendUrl}/api/messages/${messageId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id }),
            });

            if (!response.ok) {
                 throw new Error('Failed to delete message on the server.');
            }

        } catch (err) {
            console.error(err);
            setError("Failed to delete message. Reverting changes.");
            setThreads(originalThreads); // Revert on failure
        }
    };
    
    const handleDeleteThread = async (threadId: string) => {
        // Optimistic update
        const originalThreads = [...threads];
        const newThreads = threads.filter(t => t.id !== threadId);
        setThreads(newThreads);

        if (selectedThreadId === threadId) {
            setSelectedThreadId(newThreads[0]?.id || null);
        }

        try {
            const response = await fetch(`${backendUrl}/api/threads/${threadId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete thread on server');
            }
        } catch (err) {
            console.error(err);
            setError("Failed to delete conversation. Reverting changes.");
            setThreads(originalThreads); // Revert on failure
        }
    };

    const activeThread = threads.find(t => String(t.id) === selectedThreadId);

    const ThreadListItem: React.FC<{ thread: Thread; isActive: boolean }> = ({ thread, isActive }) => (
        <li
            onClick={() => setSelectedThreadId(String(thread.id))}
            className={`p-4 cursor-pointer rounded-lg transition-colors ${isActive ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
        >
            <div className="flex justify-between items-center">
                <h3 className={`font-semibold ${isActive ? 'text-primary' : 'text-gray-800 dark:text-white'}`}>{thread.title}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">{thread.timestamp}</span>
            </div>
            <div className="flex justify-between items-start mt-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate pr-4">{thread.lastMessage}</p>
                {thread.unreadCount > 0 && (
                    <span className="flex-shrink-0 bg-secondary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{thread.unreadCount}</span>
                )}
            </div>
        </li>
    );

    return (
        <div className="flex h-[calc(100vh-9rem)] sm:h-[calc(100vh-10rem)] bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
            {/* Left Panel: Thread List */}
            <div className={`w-full md:w-1/3 md:flex flex-col border-r border-gray-200 dark:border-gray-700 ${selectedThreadId && 'hidden'}`}>
                 <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Messages</h2>
                    <button onClick={() => setCreateModalOpen(true)} className="p-2 rounded-full text-primary hover:bg-primary/10">
                        <PlusIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading && <div className="p-4 text-center text-gray-500">Loading...</div>}
                    {error && <div className="p-4 text-center text-red-500">{error}</div>}
                    {!isLoading && !error && threads.length === 0 && <div className="p-4 text-center text-gray-500">No conversations yet.</div>}
                    {!isLoading && !error && threads.length > 0 && (
                        <ul className="space-y-1">
                            {threads.map(thread => (
                                <ThreadListItem key={thread.id} thread={thread} isActive={String(thread.id) === selectedThreadId} />
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Right Panel: Chat View */}
            <div className={`w-full md:w-2/3 flex-col ${selectedThreadId ? 'flex' : 'hidden md:flex'}`}>
                {activeThread ? (
                    <ChatView 
                        key={activeThread.id} 
                        thread={activeThread} 
                        onBack={() => setSelectedThreadId(null)}
                        onSendMessage={handleSendMessage}
                        onUpdateParticipants={handleUpdateParticipants}
                        onDeleteMessage={handleDeleteMessage}
                        onDeleteThread={handleDeleteThread}
                    />
                 ) : (
                    <div className="flex-1 items-center justify-center text-gray-500 hidden md:flex">Select a conversation</div>
                )}
            </div>
            <CreateThreadModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onSave={handleCreateThread} />
        </div>
    );
};

export default MessagesPage;