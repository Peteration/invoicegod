import { Jurisdiction } from '../tax/taxTypes';

const LEGAL_CLAUSES: Record<string, Record<string, string>> = {
  paymentTerms: {
    US: "Payment due within {days} days of invoice date. Late payments subject to {rate}% monthly interest.",
    EU: "Payment due within {days} days. Late payments subject to European Directive 2011/7/EU.",
    UK: "Payment due within {days} days. Interest may apply under the Late Payment of Commercial Debts Act 2013.",
    AU: "Payment due {days} days from issue. GST included where applicable.",
    JP: "請求日から{days}日以内にお支払いください。延滞利息は年{rate}%です。"
  },
  retentionOfTitle: {
    US: "Goods remain seller's property until paid in full.",
    EU: "Retention of title under EU law until full payment received.",
    DE: "Eigentumsvorbehalt bis zur vollständigen Zahlung.",
    FR: "Réserve de propriété jusqu'au paiement intégral."
  }
};

export function generateLegalClause(
  clauseType: keyof typeof LEGAL_CLAUSES,
  jurisdiction: Jurisdiction,
  variables: Record<string, string> = {}
): string {
  const countryClauses = LEGAL_CLAUSES[clauseType];
  let clause = countryClauses[jurisdiction.code] 
    || countryClauses[jurisdiction.taxType === 'VAT' ? 'EU' : 'US'];

  // Replace variables
  for (const [key, value] of Object.entries(variables)) {
    clause = clause.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return clause;
}