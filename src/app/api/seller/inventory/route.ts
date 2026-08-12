import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Inventory, InventoryTransaction } from '@/models/index';
import { Product } from '@/models/Product';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const showTransactions = searchParams.get('transactions');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (showTransactions) {
      const transactions = await InventoryTransaction.find({ sellerId: seller._id })
        .sort({ createdAt: -1 }).limit(limit).lean();
      return NextResponse.json({ success: true, data: transactions });
    }

    const inventory = await Inventory.find({ sellerId: seller._id })
      .populate('productId', 'name sku price images stock').lean();
    return NextResponse.json({ success: true, data: inventory });
  } catch (error) {
    console.error('Inventory GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, adjustment, reason } = body;

    if (!productId || adjustment === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });

    const product = await Product.findOne({ _id: productId, sellerId: seller._id });
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

    // Update product stock
    const newStock = product.stock + adjustment;
    if (newStock < 0) {
      return NextResponse.json({ success: false, error: 'Stock cannot go below 0' }, { status: 400 });
    }

    await Product.findByIdAndUpdate(productId, { stock: newStock });

    // Update inventory record
    let inventory = await Inventory.findOne({ productId, sellerId: seller._id });
    if (!inventory) {
      inventory = await Inventory.create({
        productId, sellerId: seller._id,
        currentStock: product.stock, availableStock: product.stock,
      });
    }

    const prevStock = inventory.currentStock;
    inventory.currentStock = newStock;
    inventory.availableStock = newStock - inventory.reservedStock;
    await inventory.save();

    // Create transaction record
    await InventoryTransaction.create({
      inventoryId: inventory._id,
      productId,
      sellerId: seller._id,
      type: 'adjustment',
      quantity: adjustment,
      previousStock: prevStock,
      newStock,
      notes: reason || 'Manual adjustment',
      createdBy: session.id,
    });

    return NextResponse.json({ success: true, message: 'Stock adjusted' });
  } catch (error) {
    console.error('Inventory POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to adjust stock' }, { status: 500 });
  }
}
