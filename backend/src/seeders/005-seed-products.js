'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const q = (sql, replacements) =>
      queryInterface.sequelize.query(sql, {
        replacements,
        type: queryInterface.sequelize.QueryTypes.SELECT,
      });

    // Fetch category IDs
    const [phones] = await q("SELECT id FROM categories WHERE slug = 'phones'");
    const [laptops] = await q("SELECT id FROM categories WHERE slug = 'laptops'");
    const [mens] = await q("SELECT id FROM categories WHERE slug = 'mens'");
    const [womens] = await q("SELECT id FROM categories WHERE slug = 'womens'");

    // Fetch attribute value IDs
    const [red] = await q("SELECT id FROM attribute_values WHERE slug = 'red'");
    const [blue] = await q("SELECT id FROM attribute_values WHERE slug = 'blue'");
    const [black] = await q("SELECT id FROM attribute_values WHERE slug = 'black'");
    const [white] = await q("SELECT id FROM attribute_values WHERE slug = 'white'");
    const [sizeS] = await q("SELECT id FROM attribute_values WHERE slug = 's'");
    const [sizeM] = await q("SELECT id FROM attribute_values WHERE slug = 'm'");
    const [sizeL] = await q("SELECT id FROM attribute_values WHERE slug = 'l'");
    const [sizeXL] = await q("SELECT id FROM attribute_values WHERE slug = 'xl'");
    const [cotton] = await q("SELECT id FROM attribute_values WHERE slug = 'cotton'");

    // ─── Insert products ────────────────────────────────────────────────────
    await queryInterface.bulkInsert('products', [
      { name: 'iPhone 15 Pro', slug: 'iphone-15-pro', description: 'Apple iPhone 15 Pro with titanium frame and A17 Pro chip.', brand: 'Apple', is_active: true, is_featured: true, sort_order: 1, created_at: now, updated_at: now },
      { name: 'Samsung Galaxy S24', slug: 'samsung-galaxy-s24', description: 'Samsung flagship with 200MP camera and Snapdragon 8 Gen 3.', brand: 'Samsung', is_active: true, is_featured: false, sort_order: 2, created_at: now, updated_at: now },
      { name: 'MacBook Pro 14"', slug: 'macbook-pro-14', description: 'Apple MacBook Pro with M3 chip, 14-inch Liquid Retina XDR display.', brand: 'Apple', is_active: true, is_featured: true, sort_order: 1, created_at: now, updated_at: now },
      { name: 'Dell XPS 15', slug: 'dell-xps-15', description: 'Premium Dell laptop with OLED display and Intel Core i9.', brand: 'Dell', is_active: true, is_featured: false, sort_order: 2, created_at: now, updated_at: now },
      { name: 'Classic Oxford Shirt', slug: 'classic-oxford-shirt', description: 'Timeless cotton Oxford shirt, perfect for casual or smart-casual wear.', brand: 'House Brand', is_active: true, is_featured: false, sort_order: 1, created_at: now, updated_at: now },
      { name: 'Slim Fit Chinos', slug: 'slim-fit-chinos', description: 'Comfortable slim fit chinos in a variety of colors.', brand: 'House Brand', is_active: true, is_featured: false, sort_order: 2, created_at: now, updated_at: now },
      { name: 'Floral Summer Dress', slug: 'floral-summer-dress', description: 'Light and breezy floral print dress for summer.', brand: 'House Brand', is_active: true, is_featured: true, sort_order: 1, created_at: now, updated_at: now },
    ]);

    const [iphone] = await q("SELECT id FROM products WHERE slug = 'iphone-15-pro'");
    const [samsung] = await q("SELECT id FROM products WHERE slug = 'samsung-galaxy-s24'");
    const [macbook] = await q("SELECT id FROM products WHERE slug = 'macbook-pro-14'");
    const [dell] = await q("SELECT id FROM products WHERE slug = 'dell-xps-15'");
    const [oxford] = await q("SELECT id FROM products WHERE slug = 'classic-oxford-shirt'");
    const [chinos] = await q("SELECT id FROM products WHERE slug = 'slim-fit-chinos'");
    const [dress] = await q("SELECT id FROM products WHERE slug = 'floral-summer-dress'");

    // ─── Product categories ─────────────────────────────────────────────────
    await queryInterface.bulkInsert('product_categories', [
      { product_id: iphone.id, category_id: phones.id },
      { product_id: samsung.id, category_id: phones.id },
      { product_id: macbook.id, category_id: laptops.id },
      { product_id: dell.id, category_id: laptops.id },
      { product_id: oxford.id, category_id: mens.id },
      { product_id: chinos.id, category_id: mens.id },
      { product_id: dress.id, category_id: womens.id },
    ]);

    // ─── Variants ───────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('product_variants', [
      // iPhone 15 Pro
      { product_id: iphone.id, sku: 'IPH15P-128-BLK', name: '128GB - Black', price: 134900, compare_price: 139900, stock_quantity: 15, low_stock_threshold: 3, is_active: true, created_at: now, updated_at: now },
      { product_id: iphone.id, sku: 'IPH15P-256-BLK', name: '256GB - Black', price: 144900, compare_price: null, stock_quantity: 8, low_stock_threshold: 3, is_active: true, created_at: now, updated_at: now },
      { product_id: iphone.id, sku: 'IPH15P-256-WHT', name: '256GB - White', price: 144900, compare_price: null, stock_quantity: 0, low_stock_threshold: 3, is_active: true, created_at: now, updated_at: now },
      // Samsung Galaxy S24
      { product_id: samsung.id, sku: 'SGS24-128-BLK', name: '128GB - Black', price: 79999, compare_price: 89999, stock_quantity: 20, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
      { product_id: samsung.id, sku: 'SGS24-128-WHT', name: '128GB - White', price: 79999, compare_price: 89999, stock_quantity: 12, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
      // MacBook Pro 14
      { product_id: macbook.id, sku: 'MBP14-M3-8-512', name: 'M3 8GB 512GB', price: 164900, compare_price: null, stock_quantity: 5, low_stock_threshold: 2, is_active: true, created_at: now, updated_at: now },
      { product_id: macbook.id, sku: 'MBP14-M3-16-1T', name: 'M3 16GB 1TB', price: 194900, compare_price: null, stock_quantity: 3, low_stock_threshold: 2, is_active: true, created_at: now, updated_at: now },
      // Dell XPS 15
      { product_id: dell.id, sku: 'XPS15-I7-16-512', name: 'i7 16GB 512GB', price: 149990, compare_price: 169990, stock_quantity: 7, low_stock_threshold: 2, is_active: true, created_at: now, updated_at: now },
      // Oxford Shirt
      { product_id: oxford.id, sku: 'OXF-WHT-S', name: 'White / S', price: 1499, compare_price: 1999, stock_quantity: 30, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
      { product_id: oxford.id, sku: 'OXF-WHT-M', name: 'White / M', price: 1499, compare_price: 1999, stock_quantity: 25, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
      { product_id: oxford.id, sku: 'OXF-WHT-L', name: 'White / L', price: 1499, compare_price: 1999, stock_quantity: 18, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
      { product_id: oxford.id, sku: 'OXF-BLU-M', name: 'Blue / M', price: 1499, compare_price: 1999, stock_quantity: 22, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
      { product_id: oxford.id, sku: 'OXF-BLU-L', name: 'Blue / L', price: 1499, compare_price: 1999, stock_quantity: 15, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
      // Slim Fit Chinos
      { product_id: chinos.id, sku: 'CHN-BLK-M', name: 'Black / M', price: 1999, compare_price: null, stock_quantity: 20, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
      { product_id: chinos.id, sku: 'CHN-BLK-L', name: 'Black / L', price: 1999, compare_price: null, stock_quantity: 15, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
      { product_id: chinos.id, sku: 'CHN-BLK-XL', name: 'Black / XL', price: 1999, compare_price: null, stock_quantity: 10, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
      // Floral Dress
      { product_id: dress.id, sku: 'FLD-RED-S', name: 'Red / S', price: 2499, compare_price: 2999, stock_quantity: 10, low_stock_threshold: 3, is_active: true, created_at: now, updated_at: now },
      { product_id: dress.id, sku: 'FLD-RED-M', name: 'Red / M', price: 2499, compare_price: 2999, stock_quantity: 8, low_stock_threshold: 3, is_active: true, created_at: now, updated_at: now },
      { product_id: dress.id, sku: 'FLD-BLU-M', name: 'Blue / M', price: 2499, compare_price: 2999, stock_quantity: 6, low_stock_threshold: 3, is_active: true, created_at: now, updated_at: now },
    ]);

    // ─── Variant attribute values ────────────────────────────────────────────
    const getVariant = async (sku) => {
      const [v] = await q('SELECT id FROM product_variants WHERE sku = ?', [sku]);
      return v;
    };

    const iph128blk = await getVariant('IPH15P-128-BLK');
    const iph256blk = await getVariant('IPH15P-256-BLK');
    const iph256wht = await getVariant('IPH15P-256-WHT');
    const sgs128blk = await getVariant('SGS24-128-BLK');
    const sgs128wht = await getVariant('SGS24-128-WHT');
    const oxfWhtS = await getVariant('OXF-WHT-S');
    const oxfWhtM = await getVariant('OXF-WHT-M');
    const oxfWhtL = await getVariant('OXF-WHT-L');
    const oxfBluM = await getVariant('OXF-BLU-M');
    const oxfBluL = await getVariant('OXF-BLU-L');
    const chnBlkM = await getVariant('CHN-BLK-M');
    const chnBlkL = await getVariant('CHN-BLK-L');
    const chnBlkXL = await getVariant('CHN-BLK-XL');
    const fldRedS = await getVariant('FLD-RED-S');
    const fldRedM = await getVariant('FLD-RED-M');
    const fldBluM = await getVariant('FLD-BLU-M');

    await queryInterface.bulkInsert('variant_attribute_values', [
      // Phones — color variants
      { variant_id: iph128blk.id, attribute_value_id: black.id },
      { variant_id: iph256blk.id, attribute_value_id: black.id },
      { variant_id: iph256wht.id, attribute_value_id: white.id },
      { variant_id: sgs128blk.id, attribute_value_id: black.id },
      { variant_id: sgs128wht.id, attribute_value_id: white.id },
      // Oxford shirt — color + size
      { variant_id: oxfWhtS.id, attribute_value_id: white.id },
      { variant_id: oxfWhtS.id, attribute_value_id: sizeS.id },
      { variant_id: oxfWhtM.id, attribute_value_id: white.id },
      { variant_id: oxfWhtM.id, attribute_value_id: sizeM.id },
      { variant_id: oxfWhtL.id, attribute_value_id: white.id },
      { variant_id: oxfWhtL.id, attribute_value_id: sizeL.id },
      { variant_id: oxfBluM.id, attribute_value_id: blue.id },
      { variant_id: oxfBluM.id, attribute_value_id: sizeM.id },
      { variant_id: oxfBluL.id, attribute_value_id: blue.id },
      { variant_id: oxfBluL.id, attribute_value_id: sizeL.id },
      // Chinos — color + size
      { variant_id: chnBlkM.id, attribute_value_id: black.id },
      { variant_id: chnBlkM.id, attribute_value_id: sizeM.id },
      { variant_id: chnBlkL.id, attribute_value_id: black.id },
      { variant_id: chnBlkL.id, attribute_value_id: sizeL.id },
      { variant_id: chnBlkXL.id, attribute_value_id: black.id },
      { variant_id: chnBlkXL.id, attribute_value_id: sizeXL.id },
      // Floral dress — color + size
      { variant_id: fldRedS.id, attribute_value_id: red.id },
      { variant_id: fldRedS.id, attribute_value_id: sizeS.id },
      { variant_id: fldRedM.id, attribute_value_id: red.id },
      { variant_id: fldRedM.id, attribute_value_id: sizeM.id },
      { variant_id: fldBluM.id, attribute_value_id: blue.id },
      { variant_id: fldBluM.id, attribute_value_id: sizeM.id },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('variant_attribute_values', null, {});
    await queryInterface.bulkDelete('product_images', null, {});
    await queryInterface.bulkDelete('product_variants', null, {});
    await queryInterface.bulkDelete('product_categories', null, {});
    await queryInterface.bulkDelete('products', null, {});
  },
};
