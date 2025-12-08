const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const { securityHeaders, apiLimiter } = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
const materialsRoutes = require('./routes/materials');
const optionsRoutes = require('./routes/options');
const ordersRoutes = require('./routes/orders');
const profilesRoutes = require('./routes/profiles');
const usersRoutes = require('./routes/users');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(securityHeaders);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://162.43.33.101',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));


// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}


// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'BoxPack API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/img', express.static(path.join(__dirname,'img')));
app.use('/materials', apiLimiter, materialsRoutes);
app.use('/options', apiLimiter, optionsRoutes);
app.use('/orders', apiLimiter, ordersRoutes);
app.use('/profiles', apiLimiter, profilesRoutes);
app.use('/users', apiLimiter, usersRoutes);
app.use('/inventory', apiLimiter, inventoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`BoxPack API server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost'}`);
});

module.exports = app;
