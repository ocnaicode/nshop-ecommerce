import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Purchase, Supplier, Inventory, InventoryTransaction } from '@/models/index';
import { Product } from '@/models/Product';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const purchases = await Purchase.find({ sellerId: seller._id }).populate('supplierId', 'name').sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({ success: true, data: purchases });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const { supplierId, items, paidAmount, notes } = await request.json();
    if (!items?.length) return NextResponse.json({ success: false, error: 'Items required' }, { status: 400 });
    let totalAmount = 0;
    const purchaseItems = [];
    for (const item of items) {
      const total = item.quantity * item.buyPrice;
      totalAmount += total;
      purchaseItems.push({ ...item, total });
      // Increase product stock
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      // Update inventory
      let inv = await Inventory.findOne({ productId: item.productId, sellerId: seller._id });
      if (!inv) inv = await Inventory.create({ productId: item.productId, sellerId: seller._id, currentStock: 0, availableStock: 0 });
      const prev = inv.currentStock;
      inv.currentStock += item.quantity;
      inv.availableStock = inv.currentStock - inv.reservedStock;
      await inv.save();
      await InventoryTransaction.create({ inventoryId: inv._id, productId: item.productId, sellerId: seller._id, type: 'purchase', quantity: item.quantity, previousStock: prev, newStock: inv.currentStock, createdBy: session.id });
    }
    const dueAmount = totalAmount - (paidAmount || 0);
    const purchase = await Purchase.create({ sellerId: seller._id, supplierId, items: purchaseItems, totalAmount, paidAmount: paidAmount || 0, dueAmount, status: dueAmount <= 0 ? 'completed' : 'partial', notes });
    if (supplierId && dueAmount > 0) await Supplier.findByIdAndUpdate(supplierId, { $inc: { totalDue: dueAmount, balance: dueAmount } });
    return NextResponse.json({ success: true, data: purchase }, { status: 201 });
  } catch (error) { console.error(error); return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}
