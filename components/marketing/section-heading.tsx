import { cn } from '@/lib/utils';

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className
      )}
    >
      {eyebrow && (
        <span className="text-sm font-semibold uppercase tracking-wider text-accent">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-muted-foreground text-balance">
          {description}
        </p>
      )}
    </div>
  );
}
