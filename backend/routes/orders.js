const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { orderValidation, commonValidation } = require('../middleware/validation');

const router = express.Router();

// Get all orders for current user
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ orders: data });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: ordersData, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Load user profiles for all orders
    const userIds = [...new Set(ordersData.map(order => order.user_id))];
    const { data: profilesData } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, company_name, phone')
      .in('id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    // Attach user profiles to orders
    const ordersWithUsers = ordersData.map(order => ({
      ...order,
      user: profilesMap.get(order.user_id)
    }));

    res.json({ orders: ordersWithUsers });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order with details
router.get('/:id', authenticateToken, commonValidation.idParam, async (req, res) => {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is authorized to view this order
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    // Load order items
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    // Load materials and thicknesses for items
    const itemsWithDetails = await Promise.all(
      (items || []).map(async (item) => {
        const { data: material } = await supabaseAdmin
          .from('materials')
          .select('id, name')
          .eq('id', item.material_id)
          .maybeSingle();

        const { data: thickness } = await supabaseAdmin
          .from('material_thicknesses')
          .select('id, thickness_mm')
          .eq('id', item.thickness_id)
          .maybeSingle();

        return {
          ...item,
          material,
          thickness
        };
      })
    );

    // Load user profile if admin
    let userProfile = null;
    if (req.user.role === 'admin') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, company_name, phone')
        .eq('id', order.user_id)
        .maybeSingle();
      userProfile = profile;
    }

    res.json({
      order: {
        ...order,
        items: itemsWithDetails,
        user: userProfile
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new order
router.post('/', authenticateToken, orderValidation.create, async (req, res) => {
  try {
    const {
      items,
      total_amount,
      points_used,
      shipping_address,
      payment_method
    } = req.body;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: req.user.id,
        order_number: orderNumber,
        status: 'pending',
        total_amount,
        points_used: points_used || 0,
        shipping_address,
        payment_method,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      return res.status(400).json({ error: orderError.message });
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      width_mm: item.width_mm,
      depth_mm: item.depth_mm,
      height_mm: item.height_mm,
      material_id: item.material_id,
      thickness_id: item.thickness_id,
      selected_options: item.selected_options || [],
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback: delete order if items creation fails
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return res.status(400).json({ error: itemsError.message });
    }

    res.status(201).json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, orderValidation.updateStatus, async (req, res) => {
  try {
    const { status, shipping_eta } = req.body;

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (shipping_eta) {
      updateData.shipping_eta = shipping_eta;
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ order: data });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

