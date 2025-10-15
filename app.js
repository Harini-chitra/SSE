require('dotenv').config();
const express = require('express');
const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

// Middleware to parse JSON bodies
app.use(express.json());

// Define routes
app.get('/', (req, res) => {
    res.send('Inventory Management API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));