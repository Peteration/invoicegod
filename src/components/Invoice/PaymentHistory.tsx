import React from 'react';
import { format } from 'date-fns';
import { ClockIcon, CheckIcon, ExclamationIcon, CashIcon, LockClosedIcon } from '@heroicons/react/outline';

type PaymentEvent = {
  type: 'created' | 'paid' | 'failed' | 'refund' | 'dispute';
  timestamp: Date;
  amount?: number;
  currency?: string;
  transactionHash?: string;
  reason?: string;
};

interface PaymentHistoryProps {
  events: PaymentEvent[];
  currentStatus: string;
}

const iconMap = {
  created: ClockIcon,
  paid: CheckIcon,
  failed: ExclamationIcon,
  refund: CashIcon,
  dispute: LockClosedIcon
};

const colorMap = {
  created: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refund: 'bg-yellow-100 text-yellow-800',
  dispute: 'bg-purple-100 text-purple-800'
};

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ events, currentStatus }) => {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="payment-history">
      <h3 className="text-lg font-medium mb-4">Payment Timeline</h3>
      <div className="space-y-4">
        {sortedEvents.map((event, index) => {
          const Icon = iconMap[event.type];
          return (
            <div key={index} className="flex items-start gap-3">
              <div className={`mt-1 p-2 rounded-full ${colorMap[event.type]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-medium capitalize">{event.type}</h4>
                  <time className="text-sm text-gray-500">
                    {format(new Date(event.timestamp), 'MMM d, yyyy - h:mm a')}
                  </time>
                </div>
                
                {event.amount && (
                  <p className="text-sm">
                    Amount: {event.amount} {event.currency}
                  </p>
                )}

                {event.transactionHash && (
                  <p className="text-sm">
                    TX: 
                    <a 
                      href={`https://etherscan.io/tx/${event.transactionHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-1 text-blue-600 hover:underline"
                    >
                      {event.transactionHash.slice(0, 8)}...{event.transactionHash.slice(-6)}
                    </a>
                  </p>
                )}

                {event.reason && (
                  <p className="text-sm text-gray-600">
                    Reason: {event.reason}
                  </p>
                )}

                {index === 0 && currentStatus === event.type && (
                  <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                    Current Status
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};