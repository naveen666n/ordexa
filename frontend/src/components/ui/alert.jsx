import { cn } from '../../lib/utils';

const Alert = ({ className, variant = 'default', children, ...props }) => (
  <div
    role="alert"
    className={cn(
      'relative w-full rounded-lg border p-4 text-sm',
      variant === 'destructive'
        ? 'border-destructive/50 text-destructive bg-destructive/10'
        : 'border-border bg-muted/40 text-foreground',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const AlertDescription = ({ className, ...props }) => (
  <div className={cn('text-sm', className)} {...props} />
);

export { Alert, AlertDescription };
