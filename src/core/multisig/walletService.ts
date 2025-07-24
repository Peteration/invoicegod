import { ethers } from 'ethers';
import { AuditLogger } from '../audit/auditLogger';

const ESCROW_ABI = [
  "function createEscrow(address[] signers, uint256 requiredSignatures, uint256 amount, string memory invoiceId) public payable",
  "function approvePayment(uint256 escrowId, string memory invoiceId) public",
  "function rejectPayment(uint256 escrowId, string memory reason) public",
  "event EscrowCreated(uint256 indexed escrowId, address[] signers, uint256 amount, string invoiceId)",
  "event PaymentApproved(uint256 indexed escrowId, address approver)",
  "event PaymentRejected(uint256 indexed escrowId, address rejector, string reason)"
];

export class MultiSigEscrowService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private audit = AuditLogger.getInstance();

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.ESCROW_SIGNER_KEY!, this.provider);
    this.contract = new ethers.Contract(
      process.env.ESCROW_CONTRACT_ADDRESS!,
      ESCROW_ABI,
      this.wallet
    );
  }

  async createEscrow(
    invoiceId: string,
    signers: string[],
    requiredSignatures: number,
    amount: string
  ): Promise<string> {
    try {
      const tx = await this.contract.createEscrow(
        signers,
        requiredSignatures,
        ethers.utils.parseEther(amount),
        invoiceId,
        { value: ethers.utils.parseEther(amount) }
      );

      await this.audit.logEvent({
        eventType: 'ESCROW_CREATED',
        invoiceId,
        metadata: {
          signers,
          requiredSignatures,
          amount
        }
      });

      return tx.hash;
    } catch (error) {
      await this.audit.logSecurityEvent('ESCROW_CREATION_FAILED', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  async approvePayment(invoiceId: string, escrowId: number): Promise<string> {
    try {
      const tx = await this.contract.approvePayment(escrowId, invoiceId);
      
      await this.audit.logEvent({
        eventType: 'ESCROW_APPROVED',
        invoiceId,
        metadata: { escrowId }
      });

      return tx.hash;
    } catch (error) {
      await this.audit.logSecurityEvent('ESCROW_APPROVAL_FAILED', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  async rejectPayment(invoiceId: string, escrowId: number, reason: string): Promise<string> {
    try {
      const tx = await this.contract.rejectPayment(escrowId, reason);
      
      await this.audit.logEvent({
        eventType: 'ESCROW_REJECTED',
        invoiceId,
        metadata: { escrowId, reason }
      });

      return tx.hash;
    } catch (error) {
      await this.audit.logSecurityEvent('ESCROW_REJECTION_FAILED', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  async listenForEscrowEvents() {
    this.contract.on('EscrowCreated', (escrowId, signers, amount, invoiceId) => {
      this.audit.logEvent({
        eventType: 'ESCROW_EVENT_CREATED',
        invoiceId,
        metadata: { escrowId, signers, amount }
      });
    });

    this.contract.on('PaymentApproved', (escrowId, approver) => {
      this.audit.logEvent({
        eventType: 'ESCROW_EVENT_APPROVED',
        metadata: { escrowId, approver }
      });
    });

    this.contract.on('PaymentRejected', (escrowId, rejector, reason) => {
      this.audit.logEvent({
        eventType: 'ESCROW_EVENT_REJECTED',
        metadata: { escrowId, rejector, reason }
      });
    });
  }
}