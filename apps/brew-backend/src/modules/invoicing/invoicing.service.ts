import { Injectable, NotFoundException } from '@nestjs/common';
import type { GstInvoice, GstInvoiceLine } from '@brew/contracts';
import { CatalogService } from '../catalog/catalog.service';
import { OrderingService } from '../ordering/ordering.service';

/**
 * GST tax-invoice generation (compliance gate §2). Builds a compliant invoice
 * from an order: per-line HSN/SAC + CGST/SGST split (intra-state place of supply),
 * seller GSTIN, and totals. In a full build seller GSTIN / place of supply come
 * from the Store entity; here they are a per-store placeholder.
 */
@Injectable()
export class InvoicingService {
  private seq = 1;

  constructor(
    private readonly ordering: OrderingService,
    private readonly catalog: CatalogService,
  ) {}

  buildForOrder(orderId: string): GstInvoice {
    const order = this.ordering.get(orderId);
    if (!order) throw new NotFoundException('Unknown order');

    const lines: GstInvoiceLine[] = order.items.map((item) => {
      const gst = this.catalog.getProduct(item.productId)?.gst ?? { hsnSac: '0000', ratePercent: 0 };
      const taxableValuePaise = item.unitPricePaise * item.quantity;
      const totalGst = Math.round((taxableValuePaise * gst.ratePercent) / 100);
      const cgstPaise = Math.round(totalGst / 2);
      return {
        name: item.name,
        hsnSac: gst.hsnSac,
        quantity: item.quantity,
        taxableValuePaise,
        ratePercent: gst.ratePercent,
        cgstPaise,
        sgstPaise: totalGst - cgstPaise,
        igstPaise: 0,
      };
    });

    const sum = (pick: (l: GstInvoiceLine) => number) => lines.reduce((s, l) => s + pick(l), 0);

    return {
      invoiceNumber: `INV-${order.storeId}-${String(this.seq++).padStart(5, '0')}`,
      invoiceDate: new Date().toISOString(),
      orderId: order.id,
      // Placeholder seller identity (from the Store entity in a full build).
      sellerGstin: this.gstinFor(order.storeId),
      placeOfSupply: 'Maharashtra (27)',
      buyerName: order.customerName,
      lines,
      taxableValuePaise: sum((l) => l.taxableValuePaise),
      cgstPaise: sum((l) => l.cgstPaise),
      sgstPaise: sum((l) => l.sgstPaise),
      igstPaise: sum((l) => l.igstPaise),
      discountPaise: order.totals.discountPaise,
      grandTotalPaise: order.totals.grandTotalPaise,
      currency: 'INR',
    };
  }

  private gstinFor(_storeId: string): string {
    // Demo GSTIN (state 27 = Maharashtra). Real value is per-store registration.
    return '27AABCB1234C1Z5';
  }
}
