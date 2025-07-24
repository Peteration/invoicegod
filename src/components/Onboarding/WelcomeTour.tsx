import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { XIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/outline';

const TOUR_STEPS: Step[] = [
  {
    target: '#create-invoice-button',
    content: 'Click here to create your first invoice',
    placement: 'right',
    disableBeacon: true
  },
  {
    target: '#invoice-list',
    content: 'View and manage all your invoices here',
    placement: 'bottom'
  },
  {
    target: '#reports-nav-item',
    content: 'Generate financial reports and analytics',
    placement: 'right'
  },
  {
    target: '#wallet-connect',
    content: 'Connect your wallet to enable crypto payments',
    placement: 'left'
  },
  {
    target: '#template-gallery',
    content: 'Use professional templates to save time',
    placement: 'top'
  }
];

export const WelcomeTour: React.FC = () => {
  const [runTour, setRunTour] = useLocalStorage('onboarding-tour', true);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourCompleted, setTourCompleted] = useLocalStorage('tour-completed', false);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status } = data;

    if (status === 'finished' || status === 'skipped') {
      setTourCompleted(true);
      setRunTour(false);
    } else if (action === 'next' || action === 'prev') {
      setStepIndex(index);
    }
  };

  useEffect(() => {
    if (runTour && !tourCompleted) {
      setTimeout(() => setRunTour(true), 1000);
    }
  }, [runTour, tourCompleted]);

  if (!runTour) return null;

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6366f1',
          textColor: '#1f2937',
          arrowColor: '#fff'
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          color: '#fff'
        },
        buttonBack: {
          color: '#6366f1'
        }
      }}
      locale={{
        back: 'Back',
        close: <XIcon className="h-5 w-5" />,
        last: 'Finish',
        next: (
          <>
            Next <ArrowRightIcon className="h-4 w-4 ml-1" />
          </>
        ),
        skip: 'Skip Tour'
      }}
      tooltipComponent={({ step, tooltipProps }) => (
        <div
          {...tooltipProps}
          className="bg-white rounded-lg shadow-xl p-4 max-w-xs"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-900">{step.title || 'Welcome!'}</h3>
            <button
              onClick={tooltipProps.closeProps.onClick}
              className="text-gray-400 hover:text-gray-500"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600">{step.content}</p>
          <div className="mt-4 flex justify-between items-center">
            {stepIndex > 0 && (
              <button
                onClick={() => setStepIndex(stepIndex - 1)}
                className="text-indigo-600 text-sm font-medium"
              >
                Back
              </button>
            )}
            <div className="ml-auto flex space-x-2">
              {stepIndex < TOUR_STEPS.length - 1 ? (
                <button
                  onClick={() => setStepIndex(stepIndex + 1)}
                  className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center"
                >
                  Next <ArrowRightIcon className="h-4 w-4 ml-1" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTourCompleted(true);
                    setRunTour(false);
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center"
                >
                  Finish <CheckIcon className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    />
  );
};