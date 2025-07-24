import React from 'react';
import { formatCurrency } from '../../../lib/localeFormatters';

interface TaxBreakdownProps {
  taxes: Array<{
    name: string;
    rate: number;
    amount: number;
  }>;
  currency: string;
  locale: string;
  subtotal: number;
  total: number;
}

export const TaxBreakdown: React.FC<TaxBreakdownProps> = ({
  taxes,
  currency,
  locale,
  subtotal,
  total
}) => {
  return (
    <div className="tax-breakdown space-y-3">
      <div className="border-t pt-3">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal, currency, locale)}</span>
        </div>

        {taxes.map((tax, index) => (
          <div key={index} className="flex justify-between">
            <span>
              {tax.name} ({tax.rate}%):
            </span>
            <span>{formatCurrency(tax.amount, currency, locale)}</span>
          </div>
        ))}

        <div className="flex justify-between font-bold border-t pt-2 mt-2">
          <span>Total:</span>
          <span>{formatCurrency(total, currency, locale)}</span>
        </div>
      </div>

      {taxes.some(t => t.name.includes('VAT')) && (
        <div className="text-xs text-gray-500">
          * VAT compliant with EU Directive 2006/112/EC
        </div>
      )}
    </div>
  );
};