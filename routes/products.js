const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get all products (accessible to all logged-in users)
router.get('/', protect, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM Products ORDER BY product_id');
        res.json(rows);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Add a new product (accessible only to Admin and Manager)
// This route is protected and authorized.
router.post('/', protect, authorize('Admin', 'Manager'), async (req, res) => {
    const { product_name, price, quantity_in_stock } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO Products (product_name, price, quantity_in_stock) VALUES ($1, $2, $3) RETURNING *',
            [product_name, price, quantity_in_stock]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete a product (accessible only to Admin)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM Products WHERE product_id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully', product: result.rows[0] });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


module.exports = router;