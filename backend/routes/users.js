const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { commonValidation } = require('../middleware/validation');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Load order statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const { data: orders } = await supabaseAdmin
          .from('orders')
          .select('total_amount')
          .eq('user_id', user.id);

        const orderCount = orders?.length || 0;
        const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        return {
          ...user,
          orderCount,
          totalSpent
        };
      })
    );

    res.json({ users: usersWithStats });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, commonValidation.idParam, async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Load user's orders
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const orderCount = orders?.length || 0;
    const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    res.json({
      user: {
        ...user,
        orderCount,
        totalSpent,
        recentOrders: orders
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, commonValidation.idParam, async (req, res) => {
  try {
    const { full_name, company_name, phone, points, role } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };
    if (full_name !== undefined) updateData.full_name = full_name;
    if (company_name !== undefined) updateData.company_name = company_name;
    if (phone !== undefined) updateData.phone = phone;
    if (points !== undefined) updateData.points = points;
    if (role !== undefined) updateData.role = role;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ user: data });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, commonValidation.idParam, async (req, res) => {
  try {
    // Delete from profiles (auth user should be deleted by RLS policy or manually)
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Try to delete auth user
    try {
      await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    } catch (authError) {
      console.error('Error deleting auth user:', authError);
      // Continue even if auth deletion fails
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

