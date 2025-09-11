import React, { useState } from "react";
import { PulseIcon, LockClosedIcon, EnvelopeIcon } from "../icons/Icons";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { useAuth } from "../../hooks/useAuth";

const LoginPage: React.FC = () => {
  const { loginUser } = useAuth();
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [email, setEmail] = useState("admin@tabdeel.com");
  const [password, setPassword] = useState("password");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [loginError, setLoginError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoginError(null);
      await loginUser(email, password); // ✅ context handles login
    } catch (err: any) {
      setLoginError(err.message);
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
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
              Tabdeel Pulse
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Sign in to your account
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`block w-full rounded-md pl-10 py-3 text-sm border ${
                      errors.email
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-700`}
                    placeholder="Email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`block w-full rounded-md pl-10 py-3 text-sm border ${
                      errors.password
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-700`}
                    placeholder="Password"
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {loginError && (
              <p className="mt-2 text-sm text-red-600 text-center">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary/90"
            >
              Sign in
            </button>
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
