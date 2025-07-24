export interface EscrowConfig {
  signers: string[];
  requiredSignatures: number;
  invoiceId: string;
  amount: string;
  currency?: string;
}

export interface EscrowApproval {
  escrowId: number;
  approver: string;
  timestamp: Date;
}

export interface EscrowRejection {
  escrowId: number;
  rejector: string;
  reason: string;
  timestamp: Date;
}