import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Panel({
  title,
  index,
  children,
  className,
}: {
  title?: string;
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'border border-line bg-panel/60 rounded-[2px] p-6 sm:p-7',
        className,
      )}
    >
      {title && (
        <div className="flex items-baseline gap-3 mb-5">
          {index && (
            <span className="font-mono text-xs text-dimmer tabular-nums">{index}</span>
          )}
          <h2 className="text-lg font-medium tracking-tight">{title}</h2>
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[11px] text-dim mb-1.5 tracking-wide">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-dimmer mt-1.5">{hint}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full bg-ink border border-line rounded-[2px] px-3 py-2.5 text-sm text-paper',
        'placeholder:text-dimmer font-mono',
        'focus:border-signal-dim transition-colors',
        props.className,
      )}
    />
  );
}

const buttonVariants = {
  primary: 'bg-signal text-ink hover:bg-[#b0a2ff] disabled:bg-signal-dim',
  outline: 'border border-line text-paper hover:border-signal-dim disabled:opacity-40',
  danger: 'border border-fail/40 text-fail hover:bg-fail/10 disabled:opacity-40',
};

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      {...props}
      className={cn(
        'px-4 py-2.5 rounded-[2px] text-sm font-medium transition-colors disabled:cursor-not-allowed',
        buttonVariants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Banner({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'pass' | 'fail' | 'warn';
  children: ReactNode;
}) {
  const styles = {
    info: 'border-line text-dim',
    pass: 'border-pass/30 text-pass bg-pass/5',
    fail: 'border-fail/30 text-fail bg-fail/5',
    warn: 'border-gold/30 text-gold bg-gold/5',
  };
  return (
    <div className={cn('border rounded-[2px] px-4 py-3 text-sm font-mono', styles[tone])}>
      {children}
    </div>
  );
}

export function GateNotice({ children }: { children: ReactNode }) {
  return (
    <div className="border border-line rounded-[2px] px-5 py-4 text-sm text-dim bg-panel/40">
      {children}
    </div>
  );
}
