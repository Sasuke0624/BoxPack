const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { materialValidation, commonValidation } = require('../middleware/validation');

const router = express.Router();

// Get all materials (public)
router.get('/', async (req, res) => {
  try {
    const { active_only } = req.query;
    
    let query = supabaseAdmin
      .from('materials')
      .select('*')
      .order('sort_order');

    if (active_only === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ materials: data });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get material by ID (public)
router.get('/:id', commonValidation.idParam, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ material: data });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create material (admin only)
router.post('/', authenticateToken, requireAdmin, materialValidation.create, async (req, res) => {
  try {
    const { name, description, image_url, base_price, is_active, sort_order } = req.body;

    const { data, error } = await supabaseAdmin
      .from('materials')
      .insert({
        name,
        description,
        image_url,
        base_price,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ material: data });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update material (admin only)
router.put('/:id', authenticateToken, requireAdmin, materialValidation.update, async (req, res) => {
  try {
    const { name, description, image_url, base_price, is_active, sort_order } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (base_price !== undefined) updateData.base_price = base_price;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    console.log(updateData);
    console.log(req.params.id);

    const { data, error } = await supabaseAdmin
      .from('materials')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    console.log(data);
    console.log(error);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ material: data });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete material (admin only)
router.delete('/:id', authenticateToken, requireAdmin, commonValidation.idParam, async (req, res) => {
  try {
    console.log("here");
    const { error } = await supabaseAdmin
      .from('materials')
      .delete()
      .eq('id', req.params.id);
    
      console.log(req.params.id);
      console.log(error);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get thicknesses for a material (public)
router.get('/:id/thicknesses', commonValidation.idParam, async (req, res) => {
  try {
    const { available_only } = req.query;
    // console.log(req);
    
    let query = supabaseAdmin
      .from('material_thicknesses')
      .select('*')
      .eq('material_id', req.params.id)
      .order('thickness_mm');

    if (available_only === 'true') {
      query = query.eq('is_available', true);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ thicknesses: data });
  } catch (error) {
    console.error('Get thicknesses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create thickness (admin only)
router.post('/:id/thicknesses', authenticateToken, requireAdmin, commonValidation.idParam, async (req, res) => {
  try {
    const { thickness_mm, price, size, is_available } = req.body;

    const { data, error } = await supabaseAdmin
      .from('material_thicknesses')
      .insert({
        material_id: req.params.id,
        thickness_mm,
        price,
        size: size ?? 0,
        is_available: is_available ?? true
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ thickness: data });
  } catch (error) {
    console.error('Create thickness error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update thickness (admin only)
router.put('/thicknesses/:thicknessId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { thickness_mm, price, size, is_available } = req.body;

    const updateData = {};
    if (thickness_mm !== undefined) updateData.thickness_mm = thickness_mm;
    if (price !== undefined) updateData.price = price;
    if (size !== undefined) updateData.size = size;
    if (is_available !== undefined) updateData.is_available = is_available;

    const { data, error } = await supabaseAdmin
      .from('material_thicknesses')
      .update(updateData)
      .eq('id', req.params.thicknessId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ thickness: data });
  } catch (error) {
    console.error('Update thickness error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete thickness (admin only)
router.delete('/thicknesses/:thicknessId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log("here");
    const { error } = await supabaseAdmin
      .from('material_thicknesses')
      .delete()
      .eq('id', req.params.thicknessId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Thickness deleted successfully' });
  } catch (error) {
    console.error('Delete thickness error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

