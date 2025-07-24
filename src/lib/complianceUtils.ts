import VAT from 'eu-vat';

// Validate VAT numbers (EU only)
export function validateVATNumber(vat: string): boolean {
  if (!vat.startsWith('EU')) return false;
  
  try {
    const result = VAT.validate(vat.replace('EU', ''));
    return result.valid;
  } catch {
    return false;
  }
}

// Check if country requires GST registration
export function requiresGSTRegistration(
  country: string,
  annualRevenue: number
): boolean {
  const gstThresholds: Record<string, number> = {
    AU: 75000,   // Australia
    NZ: 60000,   // New Zealand
    CA: 30000,   // Canada
    SG: 1000000, // Singapore
    ZA: 50000,   // South Africa
    IN: 2000000, // India
  };

  return (gstThresholds[country] || Infinity) < annualRevenue;
}

// Get local business ID requirements
export function getBusinessIdRequirements(country: string): string[] {
  const requirements: Record<string, string[]> = {
    US: ['EIN'],
    CA: ['BN'],
    AU: ['ABN'],
    UK: ['UTR'],
    DE: ['Steuernummer'],
    FR: ['SIRET'],
    BR: ['CNPJ'],
    IN: ['GSTIN'],
    // ... other countries
  };

  return requirements[country] || ['Business Registration Number'];
}