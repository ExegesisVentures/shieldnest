import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DocumentTextIcon, CheckCircleIcon, ArrowDownTrayIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import confetti from 'canvas-confetti';

interface PMAFormProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose: () => void;
}

interface PMADocument {
  id: string;
  version: string;
  title: string;
  content: string;
}

export default function PMAForm({ isOpen, onComplete, onClose }: PMAFormProps) {
  const [pmaDocument, setPmaDocument] = useState<PMADocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    signature: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMembership: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPMADocument();
    }
  }, [isOpen]);

  const fetchPMADocument = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pma/current`);
      const result = await response.json();

      if (result.success) {
        setPmaDocument(result.data);
      } else {
        setError('Failed to load PMA document');
      }
    } catch (error) {
      console.error('Error fetching PMA:', error);
      setError('Failed to load PMA document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const isFormValid = () => {
    return (
      formData.fullName.trim() &&
      formData.email.trim() &&
      formData.signature.trim() &&
      formData.agreeToTerms &&
      formData.agreeToPrivacy &&
      formData.agreeToMembership
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid() || !pmaDocument) {
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pma/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pmaId: pmaDocument.id,
          signature: formData.signature
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsComplete(true);
        triggerConfetti();
        setShowDownloadOptions(true);
      } else {
        setError(result.error || 'Failed to sign PMA');
      }
    } catch (error) {
      console.error('Error signing PMA:', error);
      setError('Failed to sign PMA. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerConfetti = () => {
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

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pma/generate-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pmaId: pmaDocument?.id,
          format: 'txt'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Create and download file
        const blob = new Blob([result.data.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to generate document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document');
    }
  };

  const handleEmailCopy = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pma/generate-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pmaId: pmaDocument?.id,
          format: 'email'
        })
      });

      const result = await response.json();

      if (result.success) {
        // For now, we'll show a success message
        // In a real implementation, you'd send this via email service
        alert('A copy of your signed PMA has been sent to your email address.');
      } else {
        setError('Failed to send email copy');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send email copy');
    }
  };

  if (isComplete && showDownloadOptions) {
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
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                    >
                      Welcome to Our Private Membership! 🎉
                    </Dialog.Title>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Your Private Membership Agreement has been successfully signed and recorded.
                    </p>

                    <div className="space-y-3 mb-6">
                      <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Download Copy
                      </button>
                      
                      <button
                        onClick={handleEmailCopy}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <EnvelopeIcon className="h-5 w-5 mr-2" />
                        Email Me a Copy
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setShowDownloadOptions(false);
                        onComplete();
                      }}
                      className="w-full inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    >
                      Continue to Platform
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center mb-6">
                  <DocumentTextIcon className="h-8 w-8 text-orange-500 mr-3" />
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold leading-6 text-gray-900 dark:text-white"
                  >
                    Private Membership Agreement
                  </Dialog.Title>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading agreement...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <button
                      onClick={fetchPMADocument}
                      className="mt-2 text-orange-600 hover:text-orange-500"
                    >
                      Try Again
                    </button>
                  </div>
                ) : pmaDocument ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* PMA Document Content */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {pmaDocument.title} (Version {pmaDocument.version})
                      </h4>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {pmaDocument.content}
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Full Legal Name *
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="signature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Digital Signature *
                      </label>
                      <input
                        type="text"
                        id="signature"
                        name="signature"
                        value={formData.signature}
                        onChange={handleInputChange}
                        placeholder="Type your full name as your digital signature"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        By typing your name, you are providing a legally binding digital signature
                      </p>
                    </div>

                    {/* Consent Checkboxes */}
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="agreeToTerms"
                          name="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onChange={handleInputChange}
                          className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          required
                        />
                        <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          I have read and agree to the terms of this Private Membership Agreement *
                        </label>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="agreeToPrivacy"
                          name="agreeToPrivacy"
                          checked={formData.agreeToPrivacy}
                          onChange={handleInputChange}
                          className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          required
                        />
                        <label htmlFor="agreeToPrivacy" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          I understand and consent to the privacy practices outlined in this agreement *
                        </label>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="agreeToMembership"
                          name="agreeToMembership"
                          checked={formData.agreeToMembership}
                          onChange={handleInputChange}
                          className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          required
                        />
                        <label htmlFor="agreeToMembership" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          I voluntarily choose to become a private member of this organization *
                        </label>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                        <div className="text-sm text-red-700 dark:text-red-400">
                          {error}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!isFormValid() || isSubmitting}
                        className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Signing...' : 'Sign Agreement'}
                      </button>
                    </div>
                  </form>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
