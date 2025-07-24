export type Dispute = {
  invoiceId: string;
  reason: string;
  amount: number;
  currency: string;
  raisedBy: string;
  counterparty: string;
  evidence?: Evidence[];
  status?: 'open' | 'pending' | 'resolved';
};

export type Evidence = {
  type: 'invoice' | 'payment' | 'communication' | 'user_upload' | 'stripe_dispute';
  content: any;
  weight?: number;
};

export type ResolutionOutcome = 
  | 'seller_favor' 
  | 'buyer_favor' 
  | 'partial_refund' 
  | 'pending';