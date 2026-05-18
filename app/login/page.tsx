'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isFormValid = email && password && emailRegex.test(email);

  const handleEmailBlur = () => {
    if (email && !emailRegex.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError(false);
    setEmailErrorMessage('');
    setPasswordError(false);
    setPasswordErrorMessage('');

    if (!email || !password) {
      if (!email) {
        setEmailError(true);
        setEmailErrorMessage('Please enter email');
      }
      if (!password) {
        setPasswordError(true);
        setPasswordErrorMessage('Please enter password');
      }
      return;
    }

    if (!emailRegex.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      return;
    }

    if (email !== 'admin@test.com') {
      setEmailError(true);
      setEmailErrorMessage('This email address is not recognized.');
      return;
    }

    if (password !== 'Admin123') {
      setPasswordError(true);
      setPasswordErrorMessage('Incorrect password. Please try again.');
      return;
    }

    try {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/');
    } catch {
      setError('Service is temporarily unavailable, please try again later');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">Kia Ora Aioi</h1>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-600">*</span>
            </label>
            <div className="flex flex-col">
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(false);
                    setEmailErrorMessage('');
                  }}
                  onBlur={handleEmailBlur}
                  maxLength={254}
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-blue-500 outline-none transition-colors text-slate-900 placeholder-slate-400 leading-normal ${
                    emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {emailErrorMessage && (
                <div className="flex items-center gap-1.5 mt-1 ml-10">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{emailErrorMessage}</p>
                </div>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-600">*</span>
            </label>
            <div className="flex flex-col">
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                    setPasswordErrorMessage('');
                  }}
                  maxLength={128}
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-blue-500 outline-none transition-colors text-slate-900 placeholder-slate-400 leading-normal ${
                    passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your password"
                />
              </div>
              {passwordErrorMessage && (
                <div className="flex items-center gap-1.5 mt-1 ml-10">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{passwordErrorMessage}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-900">Remember Me</span>
            </label>
            <button
              type="button"
              onClick={() => alert('Reset link sent to your email')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot Password?
            </button>
          </div>
          <button
            type="submit"
            disabled={false}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium transition-all duration-150 ease-in-out hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800 active:shadow-sm active:translate-y-[1px]"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
