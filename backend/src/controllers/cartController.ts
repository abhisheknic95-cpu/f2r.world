import { Request, Response } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';

// @desc    Get cart
// @route   GET /api/cart
export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id }).populate({
        path: 'items.product',
        select: 'name slug images mrp sellingPrice vendorDiscount websiteDiscount variants',
      });
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId }).populate({
        path: 'items.product',
        select: 'name slug images mrp sellingPrice vendorDiscount websiteDiscount variants',
      });
    }

    if (!cart) {
      res.status(200).json({
        success: true,
        cart: { items: [], total: 0 },
      });
      return;
    }

    // Calculate totals
    let subtotal = 0;
    const cartItems = cart.items.map((item: any) => {
      const product = item.product;
      const vendorDiscount = (product.sellingPrice * product.vendorDiscount) / 100;
      const websiteDiscount = (product.sellingPrice * product.websiteDiscount) / 100;
      const finalPrice = product.sellingPrice - vendorDiscount - websiteDiscount;
      const itemTotal = finalPrice * item.quantity;
      subtotal += itemTotal;

      // Check stock availability
      const variant = product.variants.find(
        (v: any) => v.size === item.size && v.color === item.color
      );
      const inStock = variant && variant.stock >= item.quantity;

      return {
        ...item.toObject(),
        finalPrice,
        itemTotal,
        inStock,
        availableStock: variant?.stock || 0,
      };
    });

    const shippingCharges = subtotal >= 499 ? 0 : 49;

    res.status(200).json({
      success: true,
      cart: {
        items: cartItems,
        subtotal,
        shippingCharges,
        total: subtotal + shippingCharges,
      },
    });
  } catch (error) {
    console.error('Get Cart Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, size, color, quantity = 1 } = req.body;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

    // Validate product
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Check stock
    const variant = product.variants.find((v) => v.size === size && v.color === color);
    if (!variant || variant.stock < quantity) {
      res.status(400).json({ success: false, message: 'Product out of stock' });
      return;
    }

    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
      }
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId });
      if (!cart) {
        cart = new Cart({ sessionId, items: [] });
      }
    } else {
      res.status(400).json({ success: false, message: 'Session ID required' });
      return;
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color === color
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > variant.stock) {
        res.status(400).json({ success: false, message: 'Exceeds available stock' });
        return;
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        product: product._id,
        vendor: product.vendor,
        size,
        color,
        quantity,
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      itemCount: cart.items.length,
    });
  } catch (error) {
    console.error('Add to Cart Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, size, color, quantity } = req.body;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found' });
      return;
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color === color
    );

    if (itemIndex === -1) {
      res.status(404).json({ success: false, message: 'Item not in cart' });
      return;
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      // Check stock
      const product = await Product.findById(productId);
      const variant = product?.variants.find(
        (v) => v.size === size && v.color === color
      );
      if (!variant || variant.stock < quantity) {
        res.status(400).json({ success: false, message: 'Exceeds available stock' });
        return;
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart updated',
    });
  } catch (error) {
    console.error('Update Cart Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove
export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, size, color } = req.body;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found' });
      return;
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          item.size === size &&
          item.color === color
        )
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Remove from Cart Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

    if (req.user) {
      await Cart.findOneAndDelete({ user: req.user._id });
    } else if (sessionId) {
      await Cart.findOneAndDelete({ sessionId });
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    console.error('Clear Cart Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Merge guest cart with user cart after login
// @route   POST /api/cart/merge
export const mergeCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!req.user || !sessionId) {
      res.status(400).json({ success: false, message: 'Invalid request' });
      return;
    }

    const guestCart = await Cart.findOne({ sessionId });
    if (!guestCart || guestCart.items.length === 0) {
      res.status(200).json({ success: true, message: 'No guest cart to merge' });
      return;
    }

    let userCart = await Cart.findOne({ user: req.user._id });
    if (!userCart) {
      userCart = new Cart({ user: req.user._id, items: [] });
    }

    // Merge items
    for (const guestItem of guestCart.items) {
      const existingIndex = userCart.items.findIndex(
        (item) =>
          item.product.toString() === guestItem.product.toString() &&
          item.size === guestItem.size &&
          item.color === guestItem.color
      );

      if (existingIndex > -1) {
        userCart.items[existingIndex].quantity += guestItem.quantity;
      } else {
        userCart.items.push(guestItem);
      }
    }

    await userCart.save();
    await Cart.findByIdAndDelete(guestCart._id);

    res.status(200).json({
      success: true,
      message: 'Cart merged successfully',
    });
  } catch (error) {
    console.error('Merge Cart Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
