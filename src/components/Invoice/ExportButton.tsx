import React, { useState } from 'react';
import { CSVLink } from 'react-csv';
import { FileDownloadIcon, SpinnerIcon } from '../Icons';

interface ExportButtonProps {
  data: Array<Record<string, any>>;
  filename: string;
  className?: string;
  onExport?: () => Promise<void>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  className = '',
  onExport
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    if (onExport) {
      setIsLoading(true);
      await onExport();
      setIsLoading(false);
    }
  };

  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`}>
      <CSVLink
        data={data}
        filename={filename}
        asyncOnClick={true}
        onClick={handleExport}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {isLoading ? (
          <SpinnerIcon className="h-4 w-4 mr-2" />
        ) : (
          <FileDownloadIcon className="h-4 w-4 mr-2" />
        )}
        Export
      </CSVLink>
    </div>
  );
};

export const ExportIconButton: React.FC<Omit<ExportButtonProps, 'className'>> = ({
  data,
  filename,
  onExport
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    if (onExport) {
      setIsLoading(true);
      await onExport();
      setIsLoading(false);
    }
  };

  return (
    <CSVLink
      data={data}
      filename={filename}
      asyncOnClick={true}
      onClick={handleExport}
      className="text-gray-400 hover:text-gray-500"
      title="Export"
    >
      {isLoading ? (
        <SpinnerIcon className="h-5 w-5" />
      ) : (
        <FileDownloadIcon className="h-5 w-5" />
      )}
    </CSVLink>
  );
};