import React from 'react';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
  { code: 'USDC', name: 'USD Coin', symbol: 'USDC' }
];

interface CurrencySelectProps {
  value: string;
  onChange: (currency: string) => void;
  includeCrypto?: boolean;
  className?: string;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onChange,
  includeCrypto = true,
  className = ''
}) => {
  const filteredCurrencies = includeCrypto
    ? CURRENCIES
    : CURRENCIES.filter(c => !['BTC', 'ETH', 'USDC'].includes(c.code));

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border rounded p-2 ${className}`}
    >
      {filteredCurrencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.code} - {currency.name}
        </option>
      ))}
    </select>
  );
};