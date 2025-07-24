import React, { useState } from 'react';
import { MultiSigEscrowService } from '../../../core/multisig/walletService';
import { useWeb3 } from '../../../hooks/useWeb3';
import { Dialog } from '@headlessui/react';
import { CheckIcon, XIcon } from '@heroicons/react/solid';

interface ApprovalPanelProps {
  escrowId: number;
  invoiceId: string;
  requiredSignatures: number;
  currentApprovals: number;
  amount: string;
  currency: string;
  signers: string[];
  userAddress: string | null;
  onApproval: () => void;
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({
  escrowId,
  invoiceId,
  requiredSignatures,
  currentApprovals,
  amount,
  currency,
  signers,
  userAddress,
  onApproval
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const { account } = useWeb3();
  const escrowService = new MultiSigEscrowService();

  const isSigner = userAddress && signers.includes(userAddress);
  const hasApproved = account && signers.includes(account);

  const handleAction = async () => {
    if (!account || !action) return;

    setIsLoading(true);
    try {
      let hash: string;
      
      if (action === 'approve') {
        hash = await escrowService.approvePayment(invoiceId, escrowId);
      } else {
        hash = await escrowService.rejectPayment(invoiceId, escrowId, reason);
      }

      setTxHash(hash);
      onApproval();
    } catch (error) {
      console.error(`${action} failed:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="escrow-panel border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Escrow Approval</h3>
        <div className="text-sm">
          {currentApprovals}/{requiredSignatures} approvals
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium">
            {amount} {currency}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Your Status:</span>
          <span className={hasApproved ? 'text-green-600' : 'text-yellow-600'}>
            {hasApproved ? 'Approved' : isSigner ? 'Pending' : 'Not a signer'}
          </span>
        </div>

        {isSigner && !hasApproved && (
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => {
                setAction('approve');
                setIsOpen(true);
              }}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center justify-center"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Approve
            </button>

            <button
              onClick={() => {
                setAction('reject');
                setIsOpen(true);
              }}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 flex items-center justify-center"
            >
              <XIcon className="h-5 w-5 mr-2" />
              Reject
            </button>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md mx-auto p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              {action === 'approve' ? 'Approve Payment' : 'Reject Payment'}
            </Dialog.Title>

            {action === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for rejection
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border rounded-md p-2"
                  rows={3}
                />
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {action === 'approve'
                  ? 'This will release funds to the recipient.'
                  : 'This will return funds to the payer.'}
              </p>
            </div>

            {txHash ? (
              <div className="p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  Transaction successful!{' '}
                  <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 underline"
                  >
                    View on Etherscan
                  </a>
                </p>
              </div>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleAction}
                  disabled={isLoading || (action === 'reject' && !reason)}
                  className={`flex-1 py-2 px-4 rounded ${
                    action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50`}
                >
                  {isLoading ? 'Processing...' : 'Confirm'}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 px-4 border rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};