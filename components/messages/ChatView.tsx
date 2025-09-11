import React, { useState } from 'react';
import type { Thread } from '../../types';
import { PaperClipIcon, SparklesIcon, ArrowLeftIcon, PaperAirplaneIcon } from '../icons/Icons';
import { GoogleGenAI } from "@google/genai";

interface ChatViewProps {
  thread: Thread;
  onBack: () => void;
  onSendMessage: (threadId: string, messageText: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ thread, onBack, onSendMessage }) => {
    const [summary, setSummary] = useState<string>('');
    const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [newMessage, setNewMessage] = useState('');

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
                        <img key={p.name} src={p.avatarUrl} alt={p.name} title={p.name} className="h-6 w-6 rounded-full object-cover ring-2 ring-white dark:ring-dark-bg" />
                    ))}
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
          <div key={message.id} className="flex items-start space-x-3">
            <img src={message.user.avatarUrl} alt={message.user.name} className="h-10 w-10 rounded-full object-cover" />
            <div className="flex-1">
              <div className="flex items-baseline space-x-2">
                <span className="font-bold text-gray-900 dark:text-white">{message.user.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{message.timestamp}</span>
              </div>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{message.text}</p>
            </div>
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
    </div>
  );
};

export default ChatView;