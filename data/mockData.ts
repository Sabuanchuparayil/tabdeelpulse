import { Thread } from '../types';

// Most mock data has been removed as it is now being fetched from the backend API.
// The data below is only for modules not yet connected to the database.

export const mockThreads: Thread[] = [
    {
        id: 'thread-1',
        title: 'Project Alpha Planning',
        participants: [{ name: 'Mohammed Semeem', avatarUrl: 'https://picsum.photos/seed/semeem/40/40' }, { name: 'Suhair Mahmoud', avatarUrl: 'https://picsum.photos/seed/suhair/40/40' }],
        messages: [
            { id: 1, user: { name: 'Mohammed Semeem', avatarUrl: 'https://picsum.photos/seed/semeem/40/40' }, text: 'We need to finalize the budget by EOD.', timestamp: '10:30 AM' },
            { id: 2, user: { name: 'Suhair Mahmoud', avatarUrl: 'https://picsum.photos/seed/suhair/40/40' }, text: 'I have the latest figures, will send them over in 10 minutes.', timestamp: '10:32 AM' },
            { id: 3, user: { name: 'Suhair Mahmoud', avatarUrl: 'https://picsum.photos/seed/suhair/40/40' }, text: 'Here are the updated budget figures for Project Alpha. I\'ve accounted for the increased material costs we discussed last week. The new total comes to AED 1.2M, which is slightly above our initial projection but manageable. I also included a contingency of 5%. Please review and let me know if you have any questions. I need your approval to proceed with the vendor negotiations. This is a very long message to test the summarization feature, hopefully it works as expected and provides a concise overview of this text.', timestamp: '10:45 AM' },
        ],
        lastMessage: 'Here are the updated budget figures...',
        timestamp: '10:45 AM',
        unreadCount: 1,
    },
    {
        id: 'thread-2',
        title: 'Q3 Marketing Campaign',
        participants: [{ name: 'Shiraj', avatarUrl: 'https://picsum.photos/seed/shiraj/40/40' }, { name: 'Mohammed Semeem', avatarUrl: 'https://picsum.photos/seed/semeem/40/40' }],
        messages: [{ id: 1, user: { name: 'Shiraj', avatarUrl: 'https://picsum.photos/seed/shiraj/40/40' }, text: 'The creatives for the new campaign are ready for review.', timestamp: 'Yesterday' }],
        lastMessage: 'The creatives for the new campaign...',
        timestamp: 'Yesterday',
        unreadCount: 0,
    }
];
