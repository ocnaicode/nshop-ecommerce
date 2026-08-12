import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Cart } from '@/models/index';
import { Product } from '@/models/Product';
import { getSession } from '@/lib/auth';
import { addToCartSchema } from '@/validators';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const cart = await Cart.findOne({ customerId: session.id })
      .populate('items.productId', 'name price stock status images')
      .lean();

    return NextResponse.json({ success: true, data: cart || { items: [], subtotal: 0, total: 0 } });
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = addToCartSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, variantId, quantity } = validation.data;

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    if (product.status !== 'active' && product.status !== 'published') {
      return NextResponse.json({ success: false, error: 'Product is not available' }, { status: 400 });
    }

    // Check stock
    let availableStock = product.stock - product.reservedStock;
    let price = product.discountPrice || product.price;

    if (variantId) {
      const variant = product.variants.find((v: any) => v._id.toString() === variantId);
      if (!variant) {
        return NextResponse.json({ success: false, error: 'Variant not found' }, { status: 404 });
      }
      availableStock = variant.stock;
      price = variant.discountPrice || variant.price;
    }

    if (quantity > availableStock) {
      return NextResponse.json(
        { success: false, error: `Only ${availableStock} items available` },
        { status: 400 }
      );
    }

    // Get or create cart
    let cart = await Cart.findOne({ customerId: session.id });
    if (!cart) {
      cart = new Cart({ customerId: session.id, items: [] });
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      (item: any) =>
        item.productId.toString() === productId &&
        (variantId ? item.variantId === variantId : !item.variantId)
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > availableStock) {
        return NextResponse.json(
          { success: false, error: `Only ${availableStock} items available` },
          { status: 400 }
        );
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        productId,
        variantId,
        shopId: product.shopId,
        sellerId: product.sellerId,
        name: product.name,
        image: product.images[0] || '',
        price,
        quantity,
        maxQuantity: availableStock,
      });
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    cart.total = cart.subtotal - (cart.couponDiscount || 0);

    await cart.save();

    return NextResponse.json({ success: true, data: cart, message: 'Added to cart' });
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add to cart' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, quantity } = body;

    const cart = await Cart.findOne({ customerId: session.id });
    if (!cart) {
      return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
    }

    const itemIndex = cart.items.findIndex((item: any) => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return NextResponse.json({ success: false, error: 'Item not found in cart' }, { status: 404 });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      if (quantity > cart.items[itemIndex].maxQuantity) {
        return NextResponse.json(
          { success: false, error: `Only ${cart.items[itemIndex].maxQuantity} items available` },
          { status: 400 }
        );
      }
      cart.items[itemIndex].quantity = quantity;
    }

    cart.subtotal = cart.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    cart.total = cart.subtotal - (cart.couponDiscount || 0);

    await cart.save();

    return NextResponse.json({ success: true, data: cart });
  } catch (error) {
    console.error('Cart PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    const cart = await Cart.findOne({ customerId: session.id });
    if (!cart) {
      return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
    }

    if (itemId) {
      cart.items = cart.items.filter((item: any) => item._id.toString() !== itemId);
    } else {
      cart.items = [];
      cart.couponCode = undefined;
      cart.couponDiscount = 0;
    }

    cart.subtotal = cart.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    cart.total = cart.subtotal - (cart.couponDiscount || 0);

    await cart.save();

    return NextResponse.json({ success: true, data: cart });
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update cart' }, { status: 500 });
  }
}
