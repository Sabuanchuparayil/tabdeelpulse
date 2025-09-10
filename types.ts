export type UserStatus = 'Active' | 'Disabled';
export type UserRole = string;

export interface User {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  avatarUrl?: string;
  roleId: UserRole; // Storing ID for consistency
  role: UserRole; // Keep for display purposes, but logic should use roleId
  status: UserStatus;
  permissions: Permission[];
  financialLimit: number; // Max amount they can approve
}

export type Permission = 
  | 'users:create' 
  | 'users:read' 
  | 'users:update' 
  | 'users:delete' 
  | 'users:reset_password'
  | 'finance:approve' 
  | 'jobs:assign'
  | 'roles:manage'
  | 'projects:create'
  | 'projects:update'
  | 'projects:delete'
  | 'accounts:create'
  | 'accounts:update'
  | 'accounts:delete'
  | 'announcements:create'
  | 'system:admin';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Kpi {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  link?: string;
}

export interface FinancialDataPoint {
  name: string;
  income: number;
  expenses: number;
}

export interface ActivityItem {
  id: number;
  user: {
    name: string;
    avatarUrl: string;
  };
  action: string;
  target: string;
  timestamp: string;
}

export interface NavLink {
    id: string;
    href: string;
    label: string;
}

// Notifications Type
export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  icon: React.ElementType;
  link: string;
}


// Finance Module Types
export type TransactionStatus = 'Pending' | 'Approved' | 'Rejected';
export interface TransactionHistory {
    status: TransactionStatus;
    user: string;
    timestamp: string;
    remarks?: string;
}
export interface PaymentInstruction {
    id: string;
    payee: string;
    amount: number;
    currency: 'AED';
    dueDate: string;
    status: TransactionStatus;
    isRecurring: boolean;
    nextDueDate?: string;
    balance?: number;
    submittedBy: string;
    history: TransactionHistory[];
}

export type CollectionStatus = 'Collected' | 'Deposited';
export interface Collection {
    id: string;
    project: string;
    payer: string;
    amount: number;
    type: 'Cash' | 'Cheque';
    date: string;
    status: CollectionStatus;
    outstandingAmount?: number;
    document?: File;
}

export type DepositStatus = 'Pending' | 'Confirmed';
export interface Deposit {
    id: string;
    accountHead: string;
    amount: number;
    date: string;
    status: DepositStatus;
    document?: File;
}

// Service Jobs Module Types
export type JobStatus = 'Assigned' | 'In Progress' | 'Completed' | 'Resolved';
export interface ServiceJob {
    id: string;
    title: string;
    project: string;
    technician: { name: string; avatarUrl: string };
    status: JobStatus;
    priority: 'Low' | 'Medium' | 'High';
}
export interface JobComment {
    id: number;
    user: { name: string; avatarUrl: string };
    text: string;
    timestamp: string;
}


// Messaging Module Types
export interface Message {
    id: number;
    user: { name: string; avatarUrl: string };
    text: string;
    timestamp: string;
}
export interface Thread {
    id: string;
    title: string;
    participants: { name: string; avatarUrl: string }[];
    messages: Message[];
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
}


// Admin - Master Data Types
export type ProjectStatus = 'Active' | 'On Hold' | 'Completed';
export interface Project {
    id: string;
    name: string;
    client: string;
    status: ProjectStatus;
}

export type AccountHeadStatus = 'Pending Approval' | 'Active';
export interface AccountHead {
    id: string;
    name: string;
    bankName: string;
    accountNumber: string;
    status: AccountHeadStatus;
}

// Task Management Types
export interface Task {
  id: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  isCompleted: boolean;
}

// Announcement Type
export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  timestamp: string;
}

export const mockUsersList: { name: string; avatarUrl: string, id: number }[] = [
    { id: 1, name: 'Mohammed Semeem', avatarUrl: 'https://picsum.photos/seed/semeem/100/100' },
    { id: 2, name: 'Suhair Mahmoud', avatarUrl: 'https://picsum.photos/seed/suhair/100/100' },
    { id: 4, name: 'Shiraj', avatarUrl: 'https://picsum.photos/seed/shiraj/100/100' },
];

export const currentUser: { name: string; avatarUrl: string } = {
    name: 'Mohammed Semeem', // Corresponds to the user in MainLayout
    avatarUrl: 'https://picsum.photos/seed/semeem/100/100'
};