import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import confetti from 'canvas-confetti';
import RegulatoryStatement from '../pma/RegulatoryStatement';
import PMAForm from '../pma/PMAForm';

interface PasswordChangeModalProps {
  isOpen: boolean;
  email: string;
  onPasswordChanged: () => void;
  onClose: () => void;
}

export default function PasswordChangeModal({ 
  isOpen, 
  email, 
  onPasswordChanged, 
  onClose 
}: PasswordChangeModalProps) {
  const [formData, setFormData] = useState({
    oldPassword: 'CoherenceDaddy!', // Pre-fill with temp password
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [showRegulatoryStatement, setShowRegulatoryStatement] = useState(false);
  const [showPMAForm, setShowPMAForm] = useState(false);

  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  useEffect(() => {
    if (formData.newPassword) {
      setPasswordStrength({
        hasMinLength: formData.newPassword.length >= 8,
        hasUpperCase: /[A-Z]/.test(formData.newPassword),
        hasLowerCase: /[a-z]/.test(formData.newPassword),
        hasNumber: /\d/.test(formData.newPassword),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword)
      });
    }
  }, [formData.newPassword]);

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);
  const passwordsMatch = formData.newPassword === formData.confirmPassword;

  const triggerConfetti = () => {
    // Multiple confetti bursts
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
    }, 200);
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        triggerConfetti();
        
        // Show success message for 2 seconds, then show regulatory statement
        setTimeout(() => {
          setShowRegulatoryStatement(true);
        }, 2000);
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setError('Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailVerificationClick = () => {
    // This would typically send a magic link
    // For now, we'll just close the modal and let the user know
    onPasswordChanged();
    onClose();
  };

  const handleRegulatoryAccept = () => {
    setShowRegulatoryStatement(false);
    setShowPMAForm(true);
  };

  const handlePMAComplete = () => {
    setShowPMAForm(false);
    setShowEmailPrompt(true);
  };

  if (showEmailPrompt) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="text-center">
                    <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2"
                    >
                      Check Your Email
                    </Dialog.Title>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      We've sent a magic link to <strong>{email}</strong>. 
                      Click the link in your email to complete your authentication.
                    </div>
                    
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                      onClick={handleEmailVerificationClick}
                    >
                      I'll check my email
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  if (isSuccess) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="text-center">
                    <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2"
                    >
                      Password Updated Successfully! 🎉
                    </Dialog.Title>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Your password has been changed. You're all set!
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                >
                  Change Your Password
                </Dialog.Title>
                
                <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    You're using a temporary password. Please create a new secure password to continue.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                      <div className="text-sm text-red-700 dark:text-red-400">
                        {error}
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        id="oldPassword"
                        name="oldPassword"
                        type={showOldPassword ? 'text' : 'password'}
                        value={formData.oldPassword}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                      >
                        {showOldPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    {/* Password strength indicators */}
                    {formData.newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Password requirements:</div>
                        <div className="space-y-1">
                          {Object.entries({
                            'At least 8 characters': passwordStrength.hasMinLength,
                            'Uppercase letter': passwordStrength.hasUpperCase,
                            'Lowercase letter': passwordStrength.hasLowerCase,
                            'Number': passwordStrength.hasNumber,
                            'Special character': passwordStrength.hasSpecialChar
                          }).map(([requirement, met]) => (
                            <div key={requirement} className={`text-xs flex items-center ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                              <span className={`mr-1 ${met ? '✓' : '○'}`}></span>
                              {requirement}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
                          formData.confirmPassword && !passwordsMatch 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword && !passwordsMatch && (
                      <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Passwords do not match
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading || !isPasswordValid || !passwordsMatch}
                      className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  // Render PMA components if needed
  if (showRegulatoryStatement) {
    return (
      <RegulatoryStatement
        isOpen={showRegulatoryStatement}
        onAccept={handleRegulatoryAccept}
        onClose={() => setShowRegulatoryStatement(false)}
      />
    );
  }

  if (showPMAForm) {
    return (
      <PMAForm
        isOpen={showPMAForm}
        onComplete={handlePMAComplete}
        onClose={() => setShowPMAForm(false)}
      />
    );
  }
}
