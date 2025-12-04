const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { commonValidation } = require('../middleware/validation');

const router = express.Router();

// Get all options (public)
router.get('/', async (req, res) => {
  try {
    const { active_only } = req.query;
    
    let query = supabaseAdmin
      .from('options')
      .select('*')
      .order('sort_order');

    if (active_only === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ options: data });
  } catch (error) {
    console.error('Get options error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get option by ID (public)
router.get('/:id', commonValidation.idParam, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('options')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Option not found' });
    }

    res.json({ option: data });
  } catch (error) {
    console.error('Get option error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create option (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, option_type, unit, is_active, sort_order } = req.body;

    const { data, error } = await supabaseAdmin
      .from('options')
      .insert({
        name,
        description,
        price,
        option_type,
        unit,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ option: data });
  } catch (error) {
    console.error('Create option error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update option (admin only)
router.put('/:id', authenticateToken, requireAdmin, commonValidation.idParam, async (req, res) => {
  try {
    const { name, description, price, option_type, unit, is_active, sort_order } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (option_type !== undefined) updateData.option_type = option_type;
    if (unit !== undefined) updateData.unit = unit;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data, error } = await supabaseAdmin
      .from('options')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ option: data });
  } catch (error) {
    console.error('Update option error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete option (admin only)
router.delete('/:id', authenticateToken, requireAdmin, commonValidation.idParam, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('options')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Option deleted successfully' });
  } catch (error) {
    console.error('Delete option error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

