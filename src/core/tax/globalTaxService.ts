import { Jurisdiction, TaxConfig, InvoiceItem } from './taxTypes';
import { fetchExchangeRates } from '../currency/currencyService';

// Pre-configured tax rules per jurisdiction
const TAX_MATRIX: Record<string, TaxConfig> = {
  EU: { 
    vat: true,
    rates: { standard: 0.21, reduced: 0.09, superReduced: 0.05 },
    reverseCharge: true,
    thresholds: { 
      intraCommunity: 10000, 
      distanceSelling: 35000 
    }
  },
  US: {
    salesTax: true,
    stateRules: {
      CA: { rate: 0.0825, countyTax: true },
      NY: { rate: 0.04, cityTax: { NYC: 0.045 } },
      // ... other states
    }
  },
  UK: { vat: true, rates: { standard: 0.2 } },
  AU: { gst: true, rate: 0.1 },
  // ... 100+ jurisdictions
};

export async function calculateTaxes(
  items: InvoiceItem[],
  sellerJurisdiction: string,
  buyerJurisdiction: string,
  sellerVAT?: string,
  buyerVAT?: string
): Promise<{ taxes: any, total: number }> {
  const jurisdictionKey = detectJurisdiction(buyerJurisdiction);
  const taxConfig = TAX_MATRIX[jurisdictionKey];
  
  if (!taxConfig) {
    throw new Error(`Unsupported jurisdiction: ${buyerJurisdiction}`);
  }

  let taxDetails = {};
  let taxableAmount = 0;

  // Calculate base taxable amount
  for (const item of items) {
    taxableAmount += item.amount * (item.quantity || 1);
  }

  // EU-specific VAT logic
  if (taxConfig.vat) {
    if (buyerVAT && buyerVAT.startsWith('EU')) {
      // Intra-community supply
      taxDetails = {
        vatRate: 0,
        reverseCharge: true,
        notes: `Reverse charge applies. Buyer VAT: ${buyerVAT}`
      };
    } else if (taxableAmount < taxConfig.thresholds?.distanceSelling) {
      // Distance selling threshold
      taxDetails = {
        vatRate: taxConfig.rates.standard,
        taxableAmount,
        vatAmount: taxableAmount * taxConfig.rates.standard
      };
    } else {
      // Local supply rules
      taxDetails = {
        vatRate: taxConfig.rates.standard,
        taxableAmount,
        vatAmount: taxableAmount * taxConfig.rates.standard
      };
    }
  }
  // US sales tax logic
  else if (taxConfig.salesTax) {
    const state = buyerJurisdiction.split('-')[0];
    const stateConfig = taxConfig.stateRules[state];
    
    if (!stateConfig) {
      throw new Error(`No tax config for state: ${state}`);
    }

    const taxAmount = taxableAmount * stateConfig.rate;
    taxDetails = {
      taxRate: stateConfig.rate,
      taxableAmount,
      taxAmount
    };
  }
  // GST for AU/NZ
  else if (taxConfig.gst) {
    taxDetails = {
      gstRate: taxConfig.rate,
      taxableAmount,
      gstAmount: taxableAmount * taxConfig.rate
    };
  }

  const exchangeRate = await fetchExchangeRates('USD', buyerJurisdiction);
  return {
    taxes: {
      ...taxDetails,
      currency: 'USD',
      exchangeRate
    },
    total: taxableAmount + (taxDetails.taxAmount || taxDetails.vatAmount || taxDetails.gstAmount || 0)
  };
}

function detectJurisdiction(countryCode: string): string {
  // EU country detection
  const euCountries = ['AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'];
  if (euCountries.includes(countryCode)) return 'EU';
  
  // Special cases
  if (countryCode === 'GB') return 'UK';
  if (countryCode === 'AU' || countryCode === 'NZ') return 'AU';
  
  return countryCode;
}