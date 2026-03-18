import ProductCard from '../ProductCard';
import { Skeleton } from '../../ui/skeleton';

const ProductCardSkeleton = () => (
  <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
    <Skeleton className="aspect-square w-full" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-20 mt-2" />
    </div>
  </div>
);

const ProductGrid = ({ products, isLoading, total }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!isLoading && products?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-semibold text-gray-700">No products found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {products?.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
};

export default ProductGrid;
