import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import productsApi from '../../api/products.api';
import categoriesApi from '../../api/categories.api';
import ProductCard from '../../components/customer/ProductCard';
import { Skeleton } from '../../components/ui/skeleton';
import { useConfig } from '../../hooks/useConfig';
import { CACHE_TIME } from '../../lib/constants';

// ─── Hero Banner ──────────────────────────────────────────────────────────────

const HeroBanner = ({ config }) => {
  const title = config?.cms?.homepage?.hero?.title || config?.site?.name || 'Shop the Latest';
  const subtitle = config?.cms?.homepage?.hero?.subtitle || config?.site?.tagline || 'Discover thousands of products at unbeatable prices';
  const ctaText = config?.cms?.homepage?.hero?.cta_text || 'Shop Now';
  const ctaLink = config?.cms?.homepage?.hero?.cta_link || '/catalog';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #06b6d4 0%, transparent 40%)'
      }} />
      <div className="container mx-auto px-4 py-20 md:py-28 relative">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3 opacity-80">New Collection</p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">{title}</h1>
          <p className="text-lg text-white/70 mb-8">{subtitle}</p>
          <Link
            to={ctaLink}
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {ctaText} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

// ─── Featured Categories ──────────────────────────────────────────────────────

const CategoryCard = ({ category }) => (
  <Link
    to={`/catalog?category=${category.slug}`}
    className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square flex items-end hover:shadow-lg transition-shadow"
  >
    {category.image_url ? (
      <img src={category.image_url} alt={category.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-300" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    <div className="relative p-4">
      <p className="text-white font-semibold text-sm">{category.name}</p>
    </div>
  </Link>
);

const FeaturedCategories = ({ categories, isLoading }) => (
  <section className="container mx-auto px-4 py-12">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
      <Link to="/catalog" className="text-sm text-primary hover:underline flex items-center gap-1">
        View all <ArrowRight size={13} />
      </Link>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)
        : categories.slice(0, 6).map((cat) => <CategoryCard key={cat.id} category={cat} />)
      }
    </div>
  </section>
);

// ─── Featured Products ────────────────────────────────────────────────────────

const FeaturedProducts = ({ products, isLoading }) => (
  <section className="bg-gray-50 py-12">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
        <Link to="/catalog?featured=true" className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight size={13} />
        </Link>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  </section>
);

// ─── Promo strip ─────────────────────────────────────────────────────────────

const PromoStrip = ({ config }) => {
  const msg = config?.cms?.homepage?.promo_text || '🚚 Free shipping on orders above ₹999 · Use code WELCOME10 for 10% off your first order';
  return (
    <div className="bg-primary text-primary-foreground text-center text-xs font-medium py-2 px-4">
      {msg}
    </div>
  );
};

// ─── HomePage ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const config = useConfig();

  const { data: categoryData, isLoading: catsLoading } = useQuery({
    queryKey: ['category-tree'],
    queryFn: () => categoriesApi.getTree().then((r) => r.data.data.categories),
    staleTime: CACHE_TIME.CATALOG,
  });

  const { data: featuredData, isLoading: prodsLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productsApi.list({ featured: true, limit: 8 }).then((r) => r.data.data),
    staleTime: CACHE_TIME.CATALOG,
  });

  const topCategories = (categoryData || []).filter((c) => !c.parent_id);
  const featuredProducts = featuredData?.products || [];

  return (
    <div>
      <PromoStrip config={config} />
      <HeroBanner config={config} />
      <FeaturedCategories categories={topCategories} isLoading={catsLoading} />
      <FeaturedProducts products={featuredProducts} isLoading={prodsLoading} />
    </div>
  );
};

export default HomePage;
