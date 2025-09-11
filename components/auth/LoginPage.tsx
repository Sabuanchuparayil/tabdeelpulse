import React, { useState } from 'react';
import { PulseIcon, LockClosedIcon, EnvelopeIcon } from '../icons/Icons';
import ForgotPasswordForm from './ForgotPasswordForm';
import { useAuth } from '../../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState('admin@tabdeel.com');
  const [password, setPassword] = useState('password');
  const [formErrors, setFormErrors] = useState<{ email?: string, password?: string }>({});
  const [apiError, setApiError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const validate = () => {
    const newErrors: { email?: string, password?: string } = {};
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (validate()) {
      setIsLoading(true);
      try {
        await login(email, password);
        // On success, the useAuth context will trigger a re-render to the main layout
      } catch (err: any) {
        setApiError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="mx-auto h-16 w-16 flex items-center justify-center">
              <PulseIcon className="h-16 w-16 text-primary" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Tabdeel Pulse
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Sign in to your account
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                     <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`relative block w-full appearance-none rounded-md border ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 px-3 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm`}
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {formErrors.email && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                   <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                     <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={`relative block w-full appearance-none rounded-md border ${formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 px-3 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm`}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                 {formErrors.password && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>}
              </div>
            </div>

            {apiError && <p className="text-sm text-red-600 dark:text-red-400 text-center">{apiError}</p>}


            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="font-medium text-primary hover:text-primary/80 focus:outline-none"
                  disabled={isLoading}
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary py-3 px-4 text-sm font-semibold text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {isForgotPasswordOpen && (
        <ForgotPasswordForm
          onClose={() => setForgotPasswordOpen(false)}
          onBackToLogin={() => setForgotPasswordOpen(false)}
        />
      )}
    </>
  );
};

export default LoginPage;