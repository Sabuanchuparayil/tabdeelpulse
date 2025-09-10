import { User, PaymentInstruction, Collection, Deposit, ServiceJob, Thread, Announcement } from '../types';

// This is now the single source of truth for the list of mock users.
// Note: The 'permissions' and 'financialLimit' properties will be added dynamically
// in the useAuth hook based on the user's role for this prototype.
export const MOCK_USERS: User[] = [
  { id: 1, name: 'Mohammed Semeem', email: 'semeem@tabdeel.io', roleId: 'Administrator', role: 'Administrator', status: 'Active', avatarUrl: 'https://picsum.photos/seed/semeem/40/40', permissions:[], financialLimit: 0 },
  { id: 11, name: 'Sabu', email: 'mail@jsabu.com', roleId: 'Administrator', role: 'Administrator', status: 'Active', avatarUrl: 'https://picsum.photos/seed/sabu/40/40', permissions:[], financialLimit: 0 },
  { id: 2, name: 'Suhair Mahmoud', email: 'suhair@tabdeel.io', roleId: 'Manager', role: 'Manager', status: 'Active', avatarUrl: 'https://picsum.photos/seed/suhair/40/40', permissions:[], financialLimit: 0 },
  { id: 3, name: 'Sreejith', email: 'sreejith@tabdeel.io', roleId: 'Manager', role: 'Manager', status: 'Active', avatarUrl: 'https://picsum.photos/seed/sreejith/40/40', permissions:[], financialLimit: 0 },
  { id: 4, name: 'Shiraj', email: 'shiraj@tabdeel.io', roleId: 'Finance', role: 'Finance', status: 'Active', avatarUrl: 'https://picsum.photos/seed/shiraj/40/40', permissions:[], financialLimit: 0 },
  { id: 5, name: 'Suju', email: 'suju@tabdeel.io', roleId: 'Manager', role: 'Manager', status: 'Active', avatarUrl: 'https://picsum.photos/seed/suju/40/40', permissions:[], financialLimit: 0 },
  { id: 6, name: 'NOUMAN', email: 'nouman@tabdeel.io', roleId: 'Technician', role: 'Technician', status: 'Active', avatarUrl: 'https://picsum.photos/seed/nouman/40/40', permissions:[], financialLimit: 0 },
  { id: 7, name: 'Benhur', email: 'benhur@tabdeel.io', roleId: 'Technician', role: 'Technician', status: 'Active', avatarUrl: 'https://picsum.photos/seed/benhur/40/40', permissions:[], financialLimit: 0 },
  { id: 8, name: 'Nakul', email: 'nakul@tabdeel.io', roleId: 'Technician', role: 'Technician', status: 'Disabled', avatarUrl: 'https://picsum.photos/seed/nakul/40/40', permissions:[], financialLimit: 0 },
  { id: 9, name: 'Elwin', email: 'elwin@tabdeel.io', roleId: 'Finance', role: 'Finance', status: 'Active', avatarUrl: 'https://picsum.photos/seed/elwin/40/40', permissions:[], financialLimit: 0 },
  { id: 10, name: 'Peesto', email: 'peesto@tabdeel.io', roleId: 'Finance', role: 'Finance', status: 'Active', avatarUrl: 'https://picsum.photos/seed/peesto/40/40', permissions:[], financialLimit: 0 },
];

export const mockAnnouncements: Announcement[] = [
  { id: 'ann-1', title: 'System Maintenance Scheduled', content: 'There will be a scheduled system maintenance on Sunday at 2 AM. The system will be unavailable for approximately 30 minutes.\n\nWe apologize for any inconvenience.', author: { name: 'Mohammed Semeem', avatarUrl: 'https://picsum.photos/seed/semeem/40/40' }, timestamp: '2024-07-25' },
  { id: 'ann-2', title: 'Welcome New Team Members!', content: 'Please join us in welcoming Nakul and Elwin to the team! They are joining as a Technician and Finance executive respectively.\n\nLet\'s make them feel welcome!', author: { name: 'Suhair Mahmoud', avatarUrl: 'https://picsum.photos/seed/suhair/40/40' }, timestamp: '2024-07-24' },
  { id: 'ann-3', title: 'Q3 Performance Review', content: 'A reminder that Q3 performance reviews are due by the end of the month. Please schedule a meeting with your manager to discuss your progress.', author: { name: 'Suhair Mahmoud', avatarUrl: 'https://picsum.photos/seed/suhair/40/40' }, timestamp: '2024-07-22' },
];

export const mockInstructions: PaymentInstruction[] = [
  { id: 'PI-00124', payee: 'Etisalat', amount: 15500.00, currency: 'AED', dueDate: '2024-07-25', status: 'Pending', isRecurring: true, nextDueDate: '2024-08-25', balance: 186000, submittedBy: 'Shiraj', history: [{ status: 'Pending', user: 'Shiraj', timestamp: '2024-07-22 10:00' }] },
  { id: 'PI-00123', payee: 'Bosch Security Systems', amount: 42500.75, currency: 'AED', dueDate: '2024-07-20', status: 'Approved', isRecurring: false, submittedBy: 'Elwin', history: [{ status: 'Pending', user: 'Elwin', timestamp: '2024-07-18 14:30' }, { status: 'Approved', user: 'Suhair Mahmoud', timestamp: '2024-07-19 09:15' }] },
  { id: 'PI-00122', payee: 'Hikvision Middle East', amount: 13200.00, currency: 'AED', dueDate: '2024-07-19', status: 'Rejected', isRecurring: false, submittedBy: 'Peesto', history: [{ status: 'Pending', user: 'Peesto', timestamp: '2024-07-18 11:00' }, { status: 'Rejected', user: 'Suhair Mahmoud', timestamp: '2024-07-18 16:45', remarks: 'PO number mismatch' }] },
  { id: 'PI-00121', payee: 'DEWA', amount: 2850.50, currency: 'AED', dueDate: '2024-07-15', status: 'Approved', isRecurring: true, nextDueDate: '2024-08-15', balance: 34206.00, submittedBy: 'Shiraj', history: [{ status: 'Pending', user: 'Shiraj', timestamp: '2024-07-13 09:00' }, { status: 'Approved', user: 'Suhair Mahmoud', timestamp: '2024-07-14 11:20' }] },
];

export const mockCollections: Collection[] = [
  { id: 'C-201', project: 'Al Quoz Labour Camp Internet', payer: 'Al Naboodah Construction', amount: 50000, type: 'Cheque', date: '2024-07-22', status: 'Deposited', outstandingAmount: 150000 },
  { id: 'C-202', project: 'ICD Brookfield Place Security System Upgrade', payer: 'ICD Brookfield', amount: 125000, type: 'Cheque', date: '2024-07-21', status: 'Deposited', outstandingAmount: 0 },
  { id: 'C-203', project: 'Jebel Ali Labour Village Connectivity', payer: 'DP World', amount: 75000, type: 'Cash', date: '2024-07-22', status: 'Collected', outstandingAmount: 75000 },
];

export const mockDeposits: Deposit[] = [
  { id: 'D-101', accountHead: 'Main Operations', amount: 17500.00, date: '2024-07-22', status: 'Confirmed' },
  { id: 'D-102', accountHead: 'Project Alpha Payouts', amount: 7500.00, date: '2024-07-22', status: 'Pending' },
];

export const mockServiceJobs: ServiceJob[] = [
    { id: 'SJ-9812', title: 'Perform quarterly maintenance on CCTV server', project: 'ICD Brookfield Place Security System Upgrade', technician: { name: 'NOUMAN', avatarUrl: 'https://picsum.photos/seed/nouman/40/40' }, status: 'Completed', priority: 'Medium' },
    { id: 'SJ-9813', title: 'Diagnose network outage in finance department', project: 'Jebel Ali Labour Village Connectivity', technician: { name: 'Benhur', avatarUrl: 'https://picsum.photos/seed/benhur/40/40' }, status: 'In Progress', priority: 'High' },
    { id: 'SJ-9814', title: 'Install new biometric scanner at main entrance', project: 'City Walk Building 7 BMS', technician: { name: 'NOUMAN', avatarUrl: 'https://picsum.photos/seed/nouman/40/40' }, status: 'In Progress', priority: 'High' },
    { id: 'SJ-9815', title: 'Replace faulty smoke detector in server room', project: 'City Walk Building 7 BMS', technician: { name: 'Benhur', avatarUrl: 'https://picsum.photos/seed/benhur/40/40' }, status: 'Assigned', priority: 'Medium' },
    { id: 'SJ-9816', title: 'Deploy guest Wi-Fi solution for lobby area', project: 'Al Quoz Labour Camp Internet', technician: { name: 'Nakul', avatarUrl: 'https://picsum.photos/seed/nakul/40/40' }, status: 'Assigned', priority: 'Low' },
    { id: 'SJ-9817', title: 'Integrate fire alarm with new BMS panel', project: 'City Walk Building 7 BMS', technician: { name: 'Benhur', avatarUrl: 'https://picsum.photos/seed/benhur/40/40' }, status: 'Resolved', priority: 'High' },
    { id: 'SJ-9818', title: 'Cable patching for new office workstations', project: 'Dubai Hills Villa ELV Integration', technician: { name: 'NOUMAN', avatarUrl: 'https://picsum.photos/seed/nouman/40/40' }, status: 'Assigned', priority: 'Low' },
    { id: 'SJ-9819', title: 'Firmware upgrade for all access points', project: 'Al Quoz Labour Camp Internet', technician: { name: 'Nakul', avatarUrl: 'https://picsum.photos/seed/nakul/40/40' }, status: 'In Progress', priority: 'Medium' },
];

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