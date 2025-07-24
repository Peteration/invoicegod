import React from 'react';
import { usePDF } from '@react-pdf/renderer';
import { generateLegalClause } from '../../../core/legal/clauseGenerator';
import { Jurisdiction } from '../../../core/tax/taxTypes';

interface WatermarkProps {
  invoiceId: string;
  paid: boolean;
  jurisdiction: Jurisdiction;
  clientType: 'business' | 'individual';
}

export const PDFWatermark: React.FC<WatermarkProps> = ({ 
  invoiceId, 
  paid,
  jurisdiction,
  clientType
}) => {
  const [instance, updateInstance] = usePDF({ document: null });
  
  const watermarkText = paid 
    ? `PAID • ${invoiceId} • invoicegod.com`
    : `UNPAID • Due ${generateDueDate(jurisdiction.code)} • invoicegod.com`;

  const legalClause = generateLegalClause(
    'retentionOfTitle',
    jurisdiction,
    { clientType }
  );

  return (
    <div className="watermark-container">
      {/* Dynamic watermark positioning */}
      <div 
        className={`watermark-text ${paid ? 'paid' : 'unpaid'}`}
        style={{
          position: 'absolute',
          opacity: 0.15,
          fontSize: '48px',
          transform: 'rotate(-30deg)',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        {watermarkText}
      </div>

      {/* Legal footer */}
      <div className="legal-footer">
        <p className="legal-clause">{legalClause}</p>
        <p className="verification-link">
          Verify at: https://invoicegod.com/verify/{invoiceId}
        </p>
      </div>

      <style jsx>{`
        .watermark-container {
          position: relative;
          min-height: 100vh;
        }
        .paid {
          color: #10b981; /* Tailwind green-500 */
        }
        .unpaid {
          color: #ef4444; /* Tailwind red-500 */
        }
        .legal-footer {
          position: absolute;
          bottom: 20px;
          font-size: 8px;
          text-align: center;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

function generateDueDate(countryCode: string): string {
  const dueDays = {
    US: 15,
    EU: 30,
    UK: 30,
    AU: 14,
    JP: 30
  }[countryCode] || 15;
  
  const date = new Date();
  date.setDate(date.getDate() + dueDays);
  return date.toLocaleDateString();
}