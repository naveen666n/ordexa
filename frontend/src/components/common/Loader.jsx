import { cn } from '../../lib/utils';

const Loader = ({ className, size = 'md' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-muted border-b-primary',
          sizes[size]
        )}
      />
    </div>
  );
};

export const FullPageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader size="lg" />
  </div>
);

export default Loader;
