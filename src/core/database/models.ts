import { Document, Model, Schema } from 'mongoose';

interface IInvoice extends Document {
  id: string;
  userId: Schema.Types.ObjectId;
  clientId: Schema.Types.ObjectId;
  number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled';
  issueDate: Date;
  dueDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    taxRate?: number;
  }>;
  taxAmount: number;
  subtotal: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IClient extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  vatNumber?: string;
  paymentTerms?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IUser extends Document {
  email: string;
  password: string;
  businessName?: string;
  taxId?: string;
  vatNumber?: string;
  address?: string;
  phone?: string;
  currency: string;
  locale: string;
  timezone: string;
  invoicePrefix?: string;
  invoiceCounter: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceModel extends Model<IInvoice> {}
interface ClientModel extends Model<IClient> {}
interface UserModel extends Model<IUser> {}

export {
  IInvoice,
  IClient,
  IUser,
  InvoiceModel,
  ClientModel,
  UserModel
};