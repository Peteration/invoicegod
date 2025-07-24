export interface Jurisdiction {
  code: string;
  name: string;
  taxType: 'VAT' | 'GST' | 'SalesTax' | 'JCT';
  currency: string;
}

export interface TaxConfig {
  vat?: boolean;
  gst?: boolean;
  salesTax?: boolean;
  rates?: {
    standard: number;
    reduced?: number;
    superReduced?: number;
  };
  reverseCharge?: boolean;
  thresholds?: {
    intraCommunity?: number;
    distanceSelling?: number;
  };
  stateRules?: Record<string, StateTaxConfig>;
}

export interface StateTaxConfig {
  rate: number;
  countyTax?: boolean;
  cityTax?: Record<string, number>;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
  taxCode?: string;
}