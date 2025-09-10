import type { Permission } from '../../types';

export const allPermissions: { id: Permission; label: string; description: string }[] = [
    { id: 'users:create', label: 'Create Users', description: 'Can add new users to the system.' },
    { id: 'users:read', label: 'Read Users', description: 'Can view user lists and profiles.' },
    { id: 'users:update', label: 'Update Users', description: 'Can edit user details and roles.' },
    { id: 'users:delete', label: 'Delete Users', description: 'Can remove users from the system.' },
    { id: 'users:reset_password', label: 'Reset User Passwords', description: 'Can send password reset links to users.' },
    { id: 'finance:approve', label: 'Approve Finance', description: 'Can approve or reject financial transactions.' },
    { id: 'jobs:assign', label: 'Assign Jobs', description: 'Can assign service jobs to technicians.' },
    { id: 'roles:manage', label: 'Manage Roles', description: 'Can create roles and edit role permissions.' },
    { id: 'projects:create', label: 'Create Projects', description: 'Can create new projects.' },
    { id: 'projects:update', label: 'Update Projects', description: 'Can edit existing project details.' },
    { id: 'projects:delete', label: 'Delete Projects', description: 'Can delete projects.' },
    { id: 'accounts:create', label: 'Create Account Heads', description: 'Can add new account heads.' },
    { id: 'accounts:update', label: 'Update Account Heads', description: 'Can edit existing account heads.' },
    { id: 'accounts:delete', label: 'Delete Account Heads', description: 'Can delete account heads.' },
    { id: 'announcements:create', label: 'Create Announcements', description: 'Can create and publish company-wide announcements.' },
    { id: 'system:admin', label: 'System Admin', description: 'Full access to all system settings.' },
];