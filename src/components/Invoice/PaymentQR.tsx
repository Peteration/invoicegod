import React from 'react';
import QRCode from 'react-qr-code';
import { generateCryptoURI } from '../../../core/payment/cryptoUtils';
import { Currency } from '../../../core/types';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

interface PaymentQRProps {
  address: string;
  amount: number;
  currency: Currency;
  memo?: string;
  network: 'mainnet' | 'testnet';
}

export const PaymentQR: React.FC<PaymentQRProps> = ({
  address,
  amount,
  currency,
  memo,
  network
}) => {
  const [copied, copy] = useCopyToClipboard();
  const paymentUri = generateCryptoURI(currency, address, amount, memo, network);
  const explorerLink = getExplorerLink(currency, address, network);

  return (
    <div className="payment-qr-container">
      <div className="qr-wrapper">
        <QRCode 
          value={paymentUri}
          size={180}
          level="H" // High error correction
          bgColor="transparent"
          fgColor="currentColor"
        />
      </div>
      
      <div className="payment-details">
        <div className="crypto-amount">
          {amount.toFixed(8)} {currency.toUpperCase()}
        </div>
        
        <div className="address-container">
          <span className="address-label">Recipient:</span>
          <div className="address-value">
            {truncateMiddle(address, 8, 6)}
            <button 
              onClick={() => copy(address)}
              className="copy-button"
              aria-label="Copy address"
            >
              {copied ? '✓' : '⎘'}
            </button>
          </div>
        </div>

        {memo && (
          <div className="memo-container">
            <span className="memo-label">Memo:</span>
            <div className="memo-value">
              {memo}
              <button 
                onClick={() => copy(memo)}
                className="copy-button"
                aria-label="Copy memo"
              >
                {copied ? '✓' : '⎘'}
              </button>
            </div>
          </div>
        )}

        <a 
          href={explorerLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="explorer-link"
        >
          View on explorer ↗
        </a>
      </div>

      <style jsx>{`
        .payment-qr-container {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          padding: 1.5rem;
          background: var(--bg-secondary);
          border-radius: 12px;
          max-width: 100%;
        }
        .qr-wrapper {
          padding: 12px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .payment-details {
          flex: 1;
          min-width: 0;
        }
        .crypto-amount {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
        .address-container, .memo-container {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        .address-label, .memo-label {
          font-weight: 500;
          color: var(--text-secondary);
        }
        .address-value, .memo-value {
          flex: 1;
          font-family: monospace;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .copy-button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 0.25rem;
        }
        .explorer-link {
          display: inline-block;
          margin-top: 0.75rem;
          color: var(--primary);
          text-decoration: none;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};

function truncateMiddle(str: string, start: number, end: number) {
  if (str.length <= start + end) return str;
  return `${str.slice(0, start)}...${str.slice(-end)}`;
}

function getExplorerLink(currency: Currency, address: string, network: string) {
  const explorers = {
    BTC: network === 'mainnet' 
      ? `https://blockstream.info/address/${address}` 
      : `https://blockstream.info/testnet/address/${address}`,
    ETH: network === 'mainnet'
      ? `https://etherscan.io/address/${address}`
      : `https://goerli.etherscan.io/address/${address}`,
    SOL: `https://explorer.solana.com/address/${address}?cluster=${network}`,
    // Add other currencies as needed
  };
  return explorers[currency] || '#';
}