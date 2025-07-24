import React, { useState, useEffect } from 'react';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import { validateVATNumber, getBusinessIdRequirements } from '../../lib/complianceUtils';
import { calculateTaxes } from '../../core/tax/globalTaxService';

interface TaxSelectorProps {
  onTaxChange: (taxInfo: any) => void;
  sellerCountry: string;
}

export default function TaxSelector({ onTaxChange, sellerCountry }: TaxSelectorProps) {
  const [buyerCountry, setBuyerCountry] = useState('');
  const [region, setRegion] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [taxInfo, setTaxInfo] = useState<any>(null);
  const [requirements, setRequirements] = useState<string[]>([]);

  useEffect(() => {
    if (buyerCountry) {
      setRequirements(getBusinessIdRequirements(buyerCountry));
    }
  }, [buyerCountry]);

  const handleCalculate = async () => {
    try {
      const result = await calculateTaxes(
        [{ description: 'Sample', amount: 100, quantity: 1 }],
        sellerCountry,
        buyerCountry,
        undefined,
        vatNumber.startsWith('EU') ? vatNumber : undefined
      );
      
      setTaxInfo(result);
      onTaxChange(result);
    } catch (error) {
      console.error("Tax calculation failed:", error);
    }
  };

  return (
    <div className="tax-selector-container space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Buyer Country</label>
          <CountryDropdown 
            value={buyerCountry}
            onChange={(val) => setBuyerCountry(val)}
            classes="w-full p-2 border rounded"
          />
        </div>
        
        {['US', 'CA'].includes(buyerCountry) && (
          <div>
            <label className="block text-sm font-medium mb-1">State/Province</label>
            <RegionDropdown
              country={buyerCountry}
              value={region}
              onChange={(val) => setRegion(val)}
              classes="w-full p-2 border rounded"
            />
          </div>
        )}
      </div>

      {buyerCountry.startsWith('EU') && (
        <div>
          <label className="block text-sm font-medium mb-1">EU VAT Number (optional)</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value.toUpperCase())}
              placeholder="EU123456789"
              className="flex-1 p-2 border rounded"
            />
            <button 
              onClick={() => validateVATNumber(`EU${vatNumber}`)}
              className="px-3 bg-gray-100 rounded"
            >
              Verify
            </button>
          </div>
        </div>
      )}

      {requirements.length > 0 && (
        <div className="p-3 bg-yellow-50 rounded">
          <h4 className="font-medium mb-1">Local Requirements</h4>
          <ul className="list-disc pl-5 text-sm">
            {requirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleCalculate}
        disabled={!buyerCountry}
        className="w-full py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
      >
        Calculate Taxes
      </button>

      {taxInfo && (
        <div className="p-3 bg-green-50 rounded">
          <h4 className="font-medium">Tax Details</h4>
          <pre className="text-xs mt-2">{JSON.stringify(taxInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}