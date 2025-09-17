import React, { useState } from 'react';
import type { Thread, Message } from '../../types';
import { PaperClipIcon, SparklesIcon, ArrowLeftIcon, PaperAirplaneIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import { GoogleGenAI } from "@google/genai";
import ManageParticipantsModal from './ManageParticipantsModal';
import DeleteConfirmationModal from '../users/DeleteConfirmationModal';
import { useAuth } from '../../hooks/useAuth';

interface ChatViewProps {
  thread: Thread;
  onBack: () => void;
  onSendMessage: (threadId: string, messageText: string) => void;
  onUpdateParticipants: (threadId: string, participantIds: number[]) => void;
  onDeleteMessage: (threadId: string, messageId: number) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ thread, onBack, onSendMessage, onUpdateParticipants, onDeleteMessage }) => {
    const [summary, setSummary] = useState<string>('');
    const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [newMessage, setNewMessage] = useState('');
    const [isManageModalOpen, setManageModalOpen] = useState(false);
    const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);

    const { user: currentUser, allUsers } = useAuth();

    const handleSummarize = async () => {
        setIsLoadingSummary(true);
        setSummary('');
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const conversationText = thread.messages.map(m => `${m.user.name}: ${m.text}`).join('\n');
            
            if (conversationText.length < 50) { 
                throw new Error("Conversation is too short to summarize.");
            }

            const prompt = `Summarize the following conversation into key bullet points. Focus on decisions made and action items:\n\n${conversationText}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setSummary(response.text);

        } catch (e: any) {
            console.error("Error generating summary:", e);
            setError(`Failed to generate summary. ${e.message || 'Please try again.'}`);
        } finally {
            setIsLoadingSummary(false);
        }
    };
    
    const handleSend = () => {
        if (newMessage.trim()) {
            onSendMessage(thread.id, newMessage.trim());
            setNewMessage('');
        }
    };

    const handleSaveParticipants = (threadId: string, participantIds: number[]) => {
        onUpdateParticipants(threadId, participantIds);
        setManageModalOpen(false);
    };

    const handleConfirmDelete = () => {
        if (deletingMessage) {
            onDeleteMessage(thread.id, deletingMessage.id);
        }
        setDeletingMessage(null);
    };

    if (!currentUser) return null;


  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-dark-bg h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
            <button onClick={onBack} className="md:hidden text-gray-500 dark:text-gray-400 mr-4">
                <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{thread.title}</h3>
                <div className="flex items-center space-x-1 mt-1">
                    {thread.participants.map(p => (
                        <img key={p.id} src={p.avatarUrl} alt={p.name} title={p.name} className="h-6 w-6 rounded-full object-cover ring-2 ring-white dark:ring-dark-bg" />
                    ))}
                    <button 
                        onClick={() => setManageModalOpen(true)} 
                        className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                        title="Manage Participants"
                    >
                        <PencilIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
        <button 
            onClick={handleSummarize}
            disabled={isLoadingSummary}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary/10 px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-primary/20 disabled:opacity-50"
        >
            <SparklesIcon className={`h-5 w-5 mr-0 sm:mr-2 ${isLoadingSummary ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoadingSummary ? 'Generating...' : 'AI Summarize'}</span>
        </button>
      </div>

      {/* Summary Box */}
      {summary && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Summary</h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }}></div>
          </div>
      )}
       {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
              {error}
          </div>
      )}


      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {thread.messages.map(message => (
          <div key={message.id} className="flex items-start space-x-3 group">
            <img src={message.user.avatarUrl} alt={message.user.name} className="h-10 w-10 rounded-full object-cover" />
            <div className="flex-1">
              <div className="flex items-baseline space-x-2">
                <span className="font-bold text-gray-900 dark:text-white">{message.user.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{message.timestamp}</span>
              </div>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{message.text}</p>
            </div>
             {message.user.id === currentUser.id && (
                <button
                    onClick={() => setDeletingMessage(message)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete message"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="relative">
            <textarea 
                placeholder={`Message ${thread.title}`} 
                rows={1}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                className="w-full pl-4 pr-20 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            ></textarea>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                 <button className="text-gray-400 hover:text-primary mr-2"><PaperClipIcon className="h-6 w-6"/></button>
                 <button onClick={handleSend} className="p-2 rounded-full bg-primary text-white hover:bg-primary/90 disabled:bg-primary/50" disabled={!newMessage.trim()}>
                    <PaperAirplaneIcon className="h-5 w-5"/>
                 </button>
            </div>
        </div>
      </div>

      <ManageParticipantsModal
        isOpen={isManageModalOpen}
        onClose={() => setManageModalOpen(false)}
        onSave={handleSaveParticipants}
        thread={thread}
        allUsers={allUsers}
        currentUser={currentUser}
      />

      {deletingMessage && (
        <DeleteConfirmationModal
            isOpen={!!deletingMessage}
            onClose={() => setDeletingMessage(null)}
            onConfirm={handleConfirmDelete}
            itemName="this message"
            itemType="message"
        />
      )}
    </div>
  );
};

export default ChatView;