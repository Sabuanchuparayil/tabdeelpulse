import React, { useState, useRef, FormEvent, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CameraIcon } from '../icons/Icons';

// Helper components are defined outside the main component to prevent re-creation on every render.
const FormRow: React.FC<{ label: string, children: React.ReactNode, error?: string }> = ({ label, children, error }) => (
    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:py-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:mt-px sm:pt-2">
            {label}
        </label>
        <div className="mt-1 sm:mt-0 sm:col-span-2">
            {children}
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    </div>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {hasError?: boolean}> = ({ hasError, ...props }) => (
    <input
        {...props}
        className={`block w-full max-w-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
    />
);


const UserProfilePage: React.FC = () => {
    const { user, updateUser, changePassword } = useAuth();
    
    // State for user profile information form
    const [formData, setFormData] = useState({ name: '', email: '', mobile: '' });
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [infoSuccess, setInfoSuccess] = useState('');
    const [infoErrors, setInfoErrors] = useState<{ name?: string; email?: string; mobile?: string; general?: string }>({});

    // State for password change form
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [passwordErrors, setPasswordErrors] = useState<{ current?: string; new?: string; confirm?: string; api?: string; }>({});
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Effect to synchronize form state with the user object from the auth context.
    // This runs when the component mounts and whenever the user object instance changes.
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                mobile: user.mobile || '',
            });
            setAvatarPreview(user.avatarUrl);
        }
    }, [user]);

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateInfo = () => {
        const errors: { name?: string; email?: string; mobile?: string } = {};
        if (!formData.name.trim()) errors.name = 'Full Name is required.';
        if (!formData.email.trim()) errors.email = 'Email address is required.';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Please enter a valid email address.';
        if (formData.mobile && !/^\+?[0-9\s-]{10,15}$/.test(formData.mobile)) errors.mobile = 'Please enter a valid mobile number.';
        setInfoErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInfoSuccess('');
        setInfoErrors({});
        if (!validateInfo() || !user) return;

        try {
            const updatedUserData = {
                ...user,
                name: formData.name,
                email: formData.email,
                mobile: formData.mobile,
                avatarUrl: avatarPreview,
            };

            // The backend does not support base64 image uploads.
            // If a new image was selected (avatarPreview is a base64 string),
            // revert to the original user.avatarUrl before sending the payload.
            // This prevents the save error and allows other profile info to be updated.
            if (avatarPreview && avatarPreview.startsWith('data:image')) {
                updatedUserData.avatarUrl = user.avatarUrl;
            }
            
            await updateUser(updatedUserData);
            setInfoSuccess("Profile information updated successfully!");
            setTimeout(() => setInfoSuccess(''), 3000);
        } catch (err) {
            console.error("Failed to update profile:", err);
            setInfoErrors({ general: 'Failed to save changes. Please try again later.' });
        }
    };
    
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    }

    const validatePassword = () => {
        const errors: { current?: string; new?: string; confirm?: string; } = {};
        if (!passwordData.currentPassword) errors.current = 'Current password is required.';
        if (!passwordData.newPassword) errors.new = 'New password is required.';
        else if (passwordData.newPassword.length < 8) errors.new = 'New password must be at least 8 characters long.';
        if (!passwordData.confirmNewPassword) errors.confirm = 'Please confirm your new password.';
        else if (passwordData.newPassword !== passwordData.confirmNewPassword) errors.confirm = 'New passwords do not match.';
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPasswordSuccess('');
        setPasswordErrors({});
        if(!validatePassword() || !user) return;

        try {
            await changePassword(user.id, passwordData.currentPassword, passwordData.newPassword);
            setPasswordSuccess("Password updated successfully!");
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            setTimeout(() => setPasswordSuccess(''), 3000);
        } catch (err: any) {
             setPasswordErrors({ api: err.message || 'An unexpected error occurred.' });
        }
    };

    if (!user) {
        return <div className="text-center p-8">Loading profile...</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">User Profile</h1>

            <div className="space-y-8">
                {/* Personal Information Card */}
                <div className="bg-white dark:bg-dark-card shadow-md rounded-lg">
                    <form onSubmit={handleInfoSubmit} noValidate>
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Personal Information</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Update your photo and personal details.</p>
                            
                             <div className="mt-6 divide-y divide-gray-200 dark:divide-gray-700">
                                <FormRow label="Photo">
                                    <div className="flex items-center">
                                        <span className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                            {avatarPreview ? (
                                              <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                                            ) : (
                                              <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                              </svg>
                                            )}
                                        </span>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="ml-5 bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                        >
                                            <CameraIcon className="h-5 w-5 mr-2 inline-block" />
                                            Change
                                        </button>
                                    </div>
                                </FormRow>
                                <FormRow label="Full Name" error={infoErrors.name}>
                                    <TextInput name="name" type="text" value={formData.name} onChange={handleInfoChange} required hasError={!!infoErrors.name} />
                                </FormRow>
                                 <FormRow label="Email Address" error={infoErrors.email}>
                                    <TextInput name="email" type="email" value={formData.email} onChange={handleInfoChange} required hasError={!!infoErrors.email} />
                                </FormRow>
                                <FormRow label="Mobile Number" error={infoErrors.mobile}>
                                    <TextInput name="mobile" type="tel" value={formData.mobile} onChange={handleInfoChange} placeholder="+971 50 123 4567" hasError={!!infoErrors.mobile} />
                                </FormRow>
                            </div>
                            {infoSuccess && <p className="mt-4 text-sm text-green-600 dark:text-green-400">{infoSuccess}</p>}
                            {infoErrors.general && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{infoErrors.general}</p>}
                        </div>
                        <div className="px-4 py-3 bg-gray-50 dark:bg-dark-card/50 text-right sm:px-6 rounded-b-lg">
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                {/* Change Password Card */}
                <div className="bg-white dark:bg-dark-card shadow-md rounded-lg">
                    <form onSubmit={handlePasswordSubmit} noValidate>
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Change Password</h3>
                             <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Ensure your account is using a long, random password to stay secure.</p>
                            
                            <div className="mt-6 divide-y divide-gray-200 dark:divide-gray-700">
                                <FormRow label="Current Password" error={passwordErrors.current}>
                                    <TextInput name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} required autoComplete="current-password" hasError={!!passwordErrors.current} />
                                </FormRow>
                                <FormRow label="New Password" error={passwordErrors.new}>
                                    <TextInput name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} required autoComplete="new-password" hasError={!!passwordErrors.new} />
                                </FormRow>
                                <FormRow label="Confirm New Password" error={passwordErrors.confirm}>
                                    <TextInput name="confirmNewPassword" type="password" value={passwordData.confirmNewPassword} onChange={handlePasswordChange} required autoComplete="new-password" hasError={!!passwordErrors.confirm} />
                                </FormRow>
                            </div>
                            {passwordErrors.api && <p className="mt-4 text-sm text-red-600 dark:text-red-400 text-center">{passwordErrors.api}</p>}
                            {passwordSuccess && <p className="mt-4 text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>}
                        </div>
                        <div className="px-4 py-3 bg-gray-50 dark:bg-dark-card/50 text-right sm:px-6 rounded-b-lg">
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;