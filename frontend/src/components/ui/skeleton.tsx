import { cn } from "@/lib/utils";

/**
 * Shimmer skeleton placeholder.
 * Usage: <Skeleton className="h-4 w-32" />
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-md",
        className,
      )}
      {...props}
    />
  );
}
