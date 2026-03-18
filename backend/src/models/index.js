'use strict';

const sequelize = require('../config/database');
const Role = require('./Role');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const PasswordResetToken = require('./PasswordResetToken');
const Category = require('./Category');
const Attribute = require('./Attribute');
const AttributeValue = require('./AttributeValue');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const ProductImage = require('./ProductImage');
const ProductCategory = require('./ProductCategory');
const VariantAttributeValue = require('./VariantAttributeValue');
const CartItem = require('./CartItem');
const ProductOffer = require('./ProductOffer');
const GlobalOffer = require('./GlobalOffer');
const DiscountCode = require('./DiscountCode');
const DiscountCodeUsage = require('./DiscountCodeUsage');
const ShippingRule = require('./ShippingRule');
const TaxRule = require('./TaxRule');
const Address = require('./Address');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const OrderStatusHistory = require('./OrderStatusHistory');
const AuditLog = require('./AuditLog');
const Payment = require('./Payment');
const SiteConfig = require('./SiteConfig');
const CmsContent = require('./CmsContent');
const FeatureFlag = require('./FeatureFlag');
const NotificationLog = require('./NotificationLog');
const Review = require('./Review');
const ReviewMedia = require('./ReviewMedia');
const WishlistItem = require('./WishlistItem');

// ─── Auth Associations ────────────────────────────────────────────────────────

Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(PasswordResetToken, { foreignKey: 'user_id', as: 'passwordResetTokens', onDelete: 'CASCADE' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Category Associations (self-referencing hierarchy) ───────────────────────

Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// ─── Attribute Associations ───────────────────────────────────────────────────

Attribute.hasMany(AttributeValue, { foreignKey: 'attribute_id', as: 'values', onDelete: 'CASCADE' });
AttributeValue.belongsTo(Attribute, { foreignKey: 'attribute_id', as: 'attribute' });

// ─── Product Associations ─────────────────────────────────────────────────────

Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

ProductVariant.hasMany(ProductImage, { foreignKey: 'variant_id', as: 'images' });
ProductImage.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// Many-to-many: Product ↔ Category (through ProductCategory — no timestamps)
Product.belongsToMany(Category, { through: ProductCategory, foreignKey: 'product_id', as: 'categories' });
Category.belongsToMany(Product, { through: ProductCategory, foreignKey: 'category_id', as: 'products' });

// Many-to-many: ProductVariant ↔ AttributeValue (through VariantAttributeValue — no timestamps)
ProductVariant.belongsToMany(AttributeValue, { through: VariantAttributeValue, foreignKey: 'variant_id', as: 'attributeValues' });
AttributeValue.belongsToMany(ProductVariant, { through: VariantAttributeValue, foreignKey: 'attribute_value_id', as: 'variants' });

// ─── Cart Associations ────────────────────────────────────────────────────────

User.hasMany(CartItem, { foreignKey: 'user_id', as: 'cartItems', onDelete: 'CASCADE' });
CartItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

ProductVariant.hasMany(CartItem, { foreignKey: 'variant_id', as: 'cartItems' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// ─── Offer Associations ───────────────────────────────────────────────────────

Product.hasMany(ProductOffer, { foreignKey: 'product_id', as: 'offers', onDelete: 'CASCADE' });
ProductOffer.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ─── Discount Code Usage Associations ────────────────────────────────────────

DiscountCode.hasMany(DiscountCodeUsage, { foreignKey: 'discount_code_id', as: 'usages', onDelete: 'CASCADE' });
DiscountCodeUsage.belongsTo(DiscountCode, { foreignKey: 'discount_code_id', as: 'discountCode' });

User.hasMany(DiscountCodeUsage, { foreignKey: 'user_id', as: 'discountUsages', onDelete: 'CASCADE' });
DiscountCodeUsage.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Address Associations ─────────────────────────────────────────────────────

User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── Order Associations ───────────────────────────────────────────────────────

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Order.belongsTo(Address, { foreignKey: 'address_id', as: 'address' });
Address.hasMany(Order, { foreignKey: 'address_id', as: 'orders' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

OrderItem.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

Order.hasMany(OrderStatusHistory, { foreignKey: 'order_id', as: 'statusHistory', onDelete: 'CASCADE' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// ─── Payment Associations ─────────────────────────────────────────────────────

Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// ─── Review Associations ──────────────────────────────────────────────────────

Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.hasMany(ReviewMedia, { foreignKey: 'review_id', as: 'media', onDelete: 'CASCADE' });
ReviewMedia.belongsTo(Review, { foreignKey: 'review_id', as: 'review' });

// ─── Wishlist Associations ────────────────────────────────────────────────────

WishlistItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
WishlistItem.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });
ProductVariant.hasMany(WishlistItem, { foreignKey: 'variant_id', as: 'wishlistItems' });

module.exports = {
  sequelize,
  Role,
  User,
  RefreshToken,
  PasswordResetToken,
  Category,
  Attribute,
  AttributeValue,
  Product,
  ProductVariant,
  ProductImage,
  ProductCategory,
  VariantAttributeValue,
  CartItem,
  ProductOffer,
  GlobalOffer,
  DiscountCode,
  DiscountCodeUsage,
  ShippingRule,
  TaxRule,
  Address,
  Order,
  OrderItem,
  OrderStatusHistory,
  AuditLog,
  Payment,
  SiteConfig,
  CmsContent,
  FeatureFlag,
  NotificationLog,
  Review,
  ReviewMedia,
  WishlistItem,
};
