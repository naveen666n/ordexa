'use strict';

const reviewsService = require('./reviews.service');
const { success, created, notFound, forbidden, conflict, error } = require('../../utils/response');

const getProductReviews = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page, limit } = req.query;
    const result = await reviewsService.getProductReviews(slug, { page, limit });

    // If user is authenticated, check if they can review
    if (req.user) {
      result.can_review = await reviewsService.canUserReview(req.user.id, slug);
    }

    return success(res, result);
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

const createReview = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { rating, title, body } = req.body;

    if (!rating) {
      return error(res, 'Rating is required', 400, 'VALIDATION_ERROR');
    }

    const files = req.files || [];
    const review = await reviewsService.createReview(slug, req.user.id, { rating, title, body }, files);

    return created(res, { review }, 'Review submitted and pending approval');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    if (err.code === 'FORBIDDEN') return forbidden(res, err.message);
    if (err.code === 'CONFLICT') return conflict(res, err.message);
    next(err);
  }
};

const listPendingReviews = async (req, res, next) => {
  try {
    const reviews = await reviewsService.listPendingReviews();
    return success(res, { reviews });
  } catch (err) {
    next(err);
  }
};

const approveReview = async (req, res, next) => {
  try {
    const review = await reviewsService.approveReview(req.params.id);
    return success(res, { review }, 'Review approved');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    await reviewsService.deleteReview(req.params.id);
    return success(res, null, 'Review deleted');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

module.exports = { getProductReviews, createReview, listPendingReviews, approveReview, deleteReview };
