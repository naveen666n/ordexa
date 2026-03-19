require('dotenv').config();
const env = require('./config/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { httpLogger } = require('./utils/logger');
const { generalLimiter, authLimiter, adminLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { success } = require('./utils/response');

// Initialize passport (registers strategies)
require('./config/passport');

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://checkout.razorpay.com', "'unsafe-inline'"],
        frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
        connectSrc: ["'self'", 'https://lumberjack.razorpay.com', 'https://api.razorpay.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false, // needed for Razorpay iframes
  })
);

const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── General middleware ───────────────────────────────────────────────────────
app.use(compression());
app.use(httpLogger);
// Attach rawBody buffer for webhook signature verification
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => { req.rawBody = buf.toString(); },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use('/api/', generalLimiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/admin', adminLimiter);

// ─── Static files (uploads) ───────────────────────────────────────────────────
// Set Cross-Origin-Resource-Policy to cross-origin so the frontend (different
// port) can load uploaded images. Helmet defaults to same-origin which blocks them.
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  success(res, { status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
const categoryRoutes = require('./modules/catalog/categories/categories.routes');
const attributeRoutes = require('./modules/catalog/attributes/attributes.routes');
const productRoutes = require('./modules/catalog/products/products.routes');
const adminProductRoutes = require('./modules/catalog/products/admin.products.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const discountRoutes = require('./modules/discounts/discounts.routes');
const addressRoutes = require('./modules/addresses/addresses.routes');
const orderRoutes = require('./modules/orders/orders.routes');
const operationsOrderRoutes = require('./modules/orders/operations.orders.routes');
const adminOrderRoutes = require('./modules/orders/admin.orders.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const adminPaymentRoutes = require('./modules/payments/admin.payments.routes');
const configRoutes = require('./modules/config/config.routes');
const cmsRoutes = require('./modules/cms/cms.routes');
const mediaRoutes = require('./modules/media/media.routes');
const shippingAdminRoutes = require('./modules/shipping/shipping.routes');
const taxAdminRoutes = require('./modules/tax/tax.routes');
const userAdminRoutes = require('./modules/users/users.routes');
const reviewsRouter = require('./modules/reviews/reviews.routes');
const wishlistRouter = require('./modules/wishlist/wishlist.routes');
const dashboardRoutes = require('./modules/admin/dashboard.routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/operations/orders', operationsOrderRoutes);
app.use('/api/v1/admin/attributes', attributeRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);
app.use('/api/v1/admin', discountRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin/payments', adminPaymentRoutes);
app.use('/api/v1', configRoutes);
app.use('/api/v1', cmsRoutes);
app.use('/api/v1', mediaRoutes);
app.use('/api/v1/admin/shipping', shippingAdminRoutes);
app.use('/api/v1/admin/tax', taxAdminRoutes);
app.use('/api/v1/admin/users', userAdminRoutes);
app.use('/api/v1', reviewsRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/admin', dashboardRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
