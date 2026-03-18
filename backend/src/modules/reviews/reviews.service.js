'use strict';

const { Review, ReviewMedia, User, Product, Order, OrderItem, ProductVariant, sequelize } = require('../../models');
const storageService = require('../storage/storage.service');
const { Op } = require('sequelize');
const xss = require('xss');

// Check if user has a delivered order containing this product
// OrderItem has variant_id, so we join via ProductVariant
const hasDeliveredOrder = async (userId, productId) => {
  const item = await OrderItem.findOne({
    include: [
      {
        model: Order,
        as: 'order',
        where: { user_id: userId, status: 'delivered' },
        required: true,
      },
      {
        model: ProductVariant,
        as: 'variant',
        where: { product_id: productId },
        required: true,
      },
    ],
  });
  return !!item;
};

// Check if user already reviewed this product
const hasReviewed = async (userId, productId) => {
  return !!(await Review.findOne({ where: { user_id: userId, product_id: productId } }));
};

// GET /products/:slug/reviews — approved only, paginated
const getProductReviews = async (slug, { page = 1, limit = 10 } = {}) => {
  const product = await Product.findOne({ where: { slug } });
  if (!product) {
    const err = new Error('Product not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await Review.findAndCountAll({
    where: { product_id: product.id, is_approved: true },
    include: [
      { model: User, as: 'user', attributes: ['first_name', 'last_name'] },
      { model: ReviewMedia, as: 'media' },
    ],
    order: [['created_at', 'DESC']],
    limit: Number(limit),
    offset,
  });

  // Rating aggregate
  const aggregate = await Review.findOne({
    where: { product_id: product.id, is_approved: true },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_count'],
    ],
    raw: true,
  });

  // Distribution: count per rating (1-5)
  const dist = await Review.findAll({
    where: { product_id: product.id, is_approved: true },
    attributes: ['rating', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['rating'],
    raw: true,
  });
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  dist.forEach((d) => { distribution[d.rating] = Number(d.count); });

  return {
    reviews: rows,
    pagination: {
      total: count,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(count / Number(limit)),
    },
    aggregate: {
      avg_rating: aggregate?.avg_rating ? Number(Number(aggregate.avg_rating).toFixed(1)) : null,
      total_count: Number(aggregate?.total_count || 0),
      distribution,
    },
    can_review: false, // will be overridden in controller for authenticated users
  };
};

// POST /products/:slug/reviews
const createReview = async (slug, userId, { rating, title, body }, files = []) => {
  const product = await Product.findOne({ where: { slug } });
  if (!product) {
    const err = new Error('Product not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (!await hasDeliveredOrder(userId, product.id)) {
    const err = new Error('You can only review products from delivered orders');
    err.code = 'FORBIDDEN';
    throw err;
  }
  if (await hasReviewed(userId, product.id)) {
    const err = new Error('You have already reviewed this product');
    err.code = 'CONFLICT';
    throw err;
  }

  const review = await Review.create({
    product_id: product.id,
    user_id: userId,
    rating: Number(rating),
    title: title ? xss(title) : null,
    body: body ? xss(body) : null,
    is_approved: false,
  });

  // Save media files (up to 5)
  if (files && files.length > 0) {
    const mediaToCreate = files.slice(0, 5).map((file) => ({
      review_id: review.id,
      url: storageService.uploadFile(file),
      media_type: file.mimetype.startsWith('video') ? 'video' : 'image',
    }));
    await ReviewMedia.bulkCreate(mediaToCreate);
  }

  return review;
};

// Admin: list pending reviews
const listPendingReviews = async () => {
  return Review.findAll({
    where: { is_approved: false },
    include: [
      { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] },
      { model: Product, as: 'product', attributes: ['id', 'name', 'slug'] },
      { model: ReviewMedia, as: 'media' },
    ],
    order: [['created_at', 'DESC']],
  });
};

const approveReview = async (id) => {
  const review = await Review.findByPk(id);
  if (!review) {
    const err = new Error('Review not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  await review.update({ is_approved: true });
  return review;
};

const deleteReview = async (id) => {
  const review = await Review.findByPk(id, { include: [{ model: ReviewMedia, as: 'media' }] });
  if (!review) {
    const err = new Error('Review not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  for (const m of review.media || []) {
    try { storageService.deleteFile(m.url); } catch {}
  }
  await review.destroy();
};

// Check if user can review (for controller to set can_review flag)
const canUserReview = async (userId, productSlug) => {
  if (!userId) return false;
  const product = await Product.findOne({ where: { slug: productSlug } });
  if (!product) return false;
  if (await hasReviewed(userId, product.id)) return false;
  return hasDeliveredOrder(userId, product.id);
};

module.exports = {
  getProductReviews,
  createReview,
  listPendingReviews,
  approveReview,
  deleteReview,
  canUserReview,
  hasReviewed,
};
