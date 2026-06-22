import type { Id } from './hierarchy';

/** A GST-compliant tax invoice line. */
export interface GstInvoiceLine {
  name: string;
  hsnSac: string;
  quantity: number;
  taxableValuePaise: number;
  ratePercent: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
}

/** A GST tax invoice for an order (HSN/SAC, GSTIN, CGST/SGST/IGST split). */
export interface GstInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  orderId: Id;
  sellerGstin: string;
  placeOfSupply: string;
  buyerName?: string;
  lines: GstInvoiceLine[];
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  discountPaise: number;
  grandTotalPaise: number;
  currency: 'INR';
}
