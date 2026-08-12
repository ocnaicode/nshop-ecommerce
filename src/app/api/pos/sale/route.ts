import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { POSSession, POSSale, Inventory, InventoryTransaction } from '@/models/index';
import { Product } from '@/models/Product';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/auth';
import { posSaleSchema } from '@/validators';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session || session.role !== 'seller') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = posSaleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { items, paymentMethod, customerPhone, discount } = validation.data;

    const seller = await Seller.findOne({ userId: session.id });
    if (!seller) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    }

    // Get current POS session or create one
    let posSession = await POSSession.findOne({ sellerId: seller._id, status: 'open' });
    if (!posSession) {
      posSession = await POSSession.create({
        sellerId: seller._id,
        shopId: seller.shopId,
        staffId: session.id,
        status: 'open',
        openedAt: new Date(),
        openingCash: 0,
      });
    }

    // Validate products and build sale items
    const saleItems: any[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json({ success: false, error: `Product not found: ${item.name}` }, { status: 404 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      const total = (item.price * item.quantity) - item.discount;
      subtotal += total;

      saleItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        total,
      });

      // Reduce stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -item.quantity, totalSold: item.quantity },
      });

      // Create inventory transaction
      let inventory = await Inventory.findOne({ productId: product._id, sellerId: seller._id });
      if (!inventory) {
        inventory = await Inventory.create({
          productId: product._id,
          sellerId: seller._id,
          currentStock: product.stock,
          availableStock: product.stock,
        });
      }

      const prevStock = inventory.currentStock;
      inventory.currentStock -= item.quantity;
      inventory.availableStock = inventory.currentStock - inventory.reservedStock;
      await inventory.save();

      await InventoryTransaction.create({
        inventoryId: inventory._id,
        productId: product._id,
        sellerId: seller._id,
        type: 'pos_sale',
        quantity: -item.quantity,
        previousStock: prevStock,
        newStock: inventory.currentStock,
        referenceId: posSession._id.toString(),
        referenceType: 'pos_session',
        createdBy: session.id,
      });
    }

    const total = subtotal - discount;

    // Create POS sale record
    const sale = await POSSale.create({
      sessionId: posSession._id,
      sellerId: seller._id,
      shopId: seller.shopId,
      staffId: session.id,
      items: saleItems,
      subtotal,
      discount,
      total,
      paymentMethod,
      customerPhone,
    });

    // Update session totals
    await POSSession.findByIdAndUpdate(posSession._id, {
      $inc: { totalSales: total, totalTransactions: 1 },
    });

    return NextResponse.json({ success: true, data: sale, message: 'Sale completed' }, { status: 201 });
  } catch (error) {
    console.error('POS sale error:', error);
    return NextResponse.json({ success: false, error: 'Failed to complete sale' }, { status: 500 });
  }
}
