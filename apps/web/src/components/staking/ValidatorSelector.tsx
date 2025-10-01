import React, { useState, useEffect } from 'react';
import { 
  ChevronDownIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { fetchValidatorData, ValidatorInfo } from '@/services/validatorService';

interface ValidatorSelectorProps {
  selectedValidator: string;
  onValidatorChange: (validator: string) => void;
}

// Validators will be loaded from the blockchain via the validator service

/**
 * Validator Selector Component
 * 
 * Modular component following Senior Developer Guidelines:
 * - Single responsibility: Handle validator selection
 * - Promotes Roll Validator while providing alternatives
 * - Clear visual hierarchy with recommendations
 * - Responsive design with collapsible sections
 */
export default function ValidatorSelector({ selectedValidator, onValidatorChange }: ValidatorSelectorProps) {
  const [showOtherValidators, setShowOtherValidators] = useState(false);
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch validator data on component mount
  useEffect(() => {
    const loadValidators = async () => {
      try {
        setLoading(true);
        setError('');
        const validatorData = await fetchValidatorData();
        setValidators(validatorData);
        
        // Auto-select Roll Validation on startup if no validator is selected
        const rollValidator = validatorData.find(v => v.isRecommended);
        if (!selectedValidator && rollValidator) {
          onValidatorChange(rollValidator.address);
        }
      } catch (err) {
        setError('Failed to load validator data');
        console.error('Error fetching validators:', err);
      } finally {
        setLoading(false);
      }
    };

    loadValidators();
  }, [selectedValidator, onValidatorChange]);

  const rollValidator = validators.find(v => v.isRecommended);
  const otherValidators = validators.filter(v => !v.isRecommended);

  const handleValidatorSelect = (validatorAddress: string) => {
    onValidatorChange(validatorAddress);
  };

  const RollValidatorCard = ({ validator }: { validator: ValidatorInfo }) => (
    <div 
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ring-2 ring-green-500/20 ${
        selectedValidator === validator.address
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={() => handleValidatorSelect(validator.address)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="mr-2">
            <StarIcon className="h-5 w-5 text-yellow-500 fill-current" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              {validator.moniker}
              {selectedValidator === validator.address && (
                <CheckCircleSolid className="h-5 w-5 text-blue-500 ml-2" />
              )}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {validator.address.slice(0, 20)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span className="text-green-600 dark:text-green-400 font-medium">{validator.status}</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOtherValidators(!showOtherValidators);
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <ChevronDownIcon 
              className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${
                showOtherValidators ? 'rotate-180' : ''
              }`} 
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Commission</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{validator.commission}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Est. APR</p>
          <p className="font-semibold text-green-600 dark:text-green-400">{validator.apr}</p>
        </div>
      </div>

      <div className="mt-3 p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
        <div className="flex items-center text-green-800 dark:text-green-200 text-sm">
          <ShieldCheckIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="font-medium">Recommended Choice</span>
        </div>
        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
          By staking with this validator, you are supporting the development of higher quality 
          standards of security for your own assets, as well as generations to come, and more 
          chances for airdrops and other benefits.
        </p>
      </div>

      {validator.website && (
        <div className="mt-3">
          <a
            href={validator.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            onClick={(e) => e.stopPropagation()}
          >
            Learn more
            <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
          </a>
        </div>
      )}

      {/* Compact Validator Dropdown */}
      {showOtherValidators && otherValidators.length > 0 && (
        <div className="mt-4 border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
          <div className="max-h-20 overflow-y-auto space-y-1">
            {otherValidators.map((otherValidator) => (
              <button
                key={otherValidator.address}
                onClick={(e) => {
                  e.stopPropagation();
                  handleValidatorSelect(otherValidator.address);
                  setShowOtherValidators(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedValidator === otherValidator.address
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {otherValidator.moniker}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="depth-card shadow-depth dark:shadow-depth-dark">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Select Validator
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="depth-card shadow-depth dark:shadow-depth-dark">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Select Validator
        </h3>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary inline-flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="depth-card shadow-depth dark:shadow-depth-dark">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
        Select Validator
      </h3>

      {/* Roll Validation Card with Integrated Dropdown */}
      {rollValidator && (
        <div className="mb-6">
          <RollValidatorCard validator={rollValidator} />
        </div>
      )}

      {/* Selection Status */}
      {selectedValidator && (
        <div className="mt-6 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">
                {selectedValidator === rollValidator?.address ? 'Roll Validation' : 
                 validators.find(v => v.address === selectedValidator)?.moniker || 'Validator'} Selected
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Go stake your Coreum tokens now
            </p>
            <ArrowRightIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      )}
    </div>
  );
}
