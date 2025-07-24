import React from 'react';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  canceled: 'bg-yellow-100 text-yellow-800',
  disputed: 'bg-purple-100 text-purple-800'
};

const statusIcons = {
  draft: '✏️',
  sent: '✉️',
  paid: '✓',
  overdue: '⚠️',
  canceled: '✖',
  disputed: '⚖️'
};

interface StatusBadgeProps {
  status: keyof typeof statusColors;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status]
      } ${className}`}
    >
      {statusIcons[status]} &nbsp;
      <span className="capitalize">{status}</span>
    </span>
  );
};