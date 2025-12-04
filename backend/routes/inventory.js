const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { commonValidation } = require('../middleware/validation');

const router = express.Router();

// Get all inventory (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: inventoryData, error } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Load materials and thicknesses for each inventory item
    const inventoryWithDetails = await Promise.all(
      inventoryData.map(async (inv) => {
        const { data: material } = await supabaseAdmin
          .from('materials')
          .select('*')
          .eq('id', inv.material_id)
          .maybeSingle();

        const { data: thickness } = await supabaseAdmin
          .from('material_thicknesses')
          .select('*')
          .eq('id', inv.thickness_id)
          .maybeSingle();

        return {
          ...inv,
          material,
          thickness
        };
      })
    );

    res.json({ inventory: inventoryWithDetails });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create inventory item (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { material_id, thickness_id, current_stock, min_stock_level, unit } = req.body;

    const { data, error } = await supabaseAdmin
      .from('inventory')
      .insert({
        material_id,
        thickness_id,
        current_stock: current_stock || 0,
        min_stock_level: min_stock_level || 0,
        unit: unit || '枚'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ inventory: data });
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update inventory stock (admin only)
router.put('/:id/stock', authenticateToken, requireAdmin, commonValidation.idParam, async (req, res) => {
  try {
    const { movement_type, quantity, reason, notes } = req.body;

    // Get current inventory
    const { data: inventory, error: fetchError } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    const previousStock = inventory.current_stock;
    let newStock = previousStock;

    if (movement_type === 'in') {
      newStock = previousStock + quantity;
    } else if (movement_type === 'out') {
      newStock = Math.max(0, previousStock - quantity);
    } else if (movement_type === 'adjustment') {
      newStock = quantity;
    }

    // Update inventory
    const { data: updatedInventory, error: updateError } = await supabaseAdmin
      .from('inventory')
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // Create history record
    const { error: historyError } = await supabaseAdmin
      .from('inventory_history')
      .insert({
        inventory_id: req.params.id,
        movement_type,
        quantity: movement_type === 'adjustment' ? newStock - previousStock : quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: reason || null,
        notes: notes || null,
        created_by: req.user.id
      });

    if (historyError) {
      console.error('Error creating history:', historyError);
      // Continue even if history creation fails
    }

    res.json({ inventory: updatedInventory });
  } catch (error) {
    console.error('Update inventory stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update min stock level (admin only)
router.put('/:id/min-stock', authenticateToken, requireAdmin, commonValidation.idParam, async (req, res) => {
  try {
    const { min_stock_level } = req.body;

    const { data, error } = await supabaseAdmin
      .from('inventory')
      .update({
        min_stock_level,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ inventory: data });
  } catch (error) {
    console.error('Update min stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory history (admin only)
router.get('/:id/history', authenticateToken, requireAdmin, commonValidation.idParam, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inventory_history')
      .select('*')
      .eq('inventory_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ history: data });
  } catch (error) {
    console.error('Get inventory history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

