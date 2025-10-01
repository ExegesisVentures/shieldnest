import React from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface RegulatoryStatementProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export default function RegulatoryStatement({ isOpen, onAccept, onClose }: RegulatoryStatementProps) {
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center mb-6">
                  <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 mr-3" />
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold leading-6 text-gray-900 dark:text-white"
                  >
                    Important Notice: Transition to Private Membership
                  </Dialog.Title>
                </div>

                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <ShieldCheckIcon className="h-6 w-6 text-orange-600 dark:text-orange-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">
                          Why We're Making This Change
                        </h4>
                        <p className="text-sm text-orange-700 dark:text-orange-400">
                          We are transitioning from a public platform to a <strong>Private Membership Organization (PMO)</strong> 
                          to better serve our community and protect our members.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Benefits of Private Membership:
                    </h4>
                    
                    <div className="grid gap-3">
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm">
                          <strong>Regulatory Protection:</strong> As a private membership organization, 
                          we operate with significantly reduced regulatory scrutiny and compliance burdens.
                        </p>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm">
                          <strong>Cost Savings:</strong> Lower compliance costs mean we can pass more 
                          value directly to our members and keep fees minimal.
                        </p>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm">
                          <strong>Community Protection:</strong> We want to ensure no one in our community 
                          faces unnecessary legal complications from ever-changing public sector regulations.
                        </p>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm">
                          <strong>Enhanced Privacy:</strong> Private membership provides additional 
                          privacy protections for our members' activities and data.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                      What This Means for You
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      By continuing, you'll become a private member of our organization. This provides you with 
                      enhanced protections and benefits while allowing us to operate more efficiently and safely 
                      for everyone involved.
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Next Step:</strong> You'll be asked to review and sign our Private Membership Agreement (PMA) 
                      which outlines the terms of your membership and the mutual benefits we provide to each other.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    I Need More Time
                  </button>
                  <button
                    type="button"
                    onClick={onAccept}
                    className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    I Understand - Continue to PMA
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
