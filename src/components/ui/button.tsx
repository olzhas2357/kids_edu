import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost';
};

export function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50';
  const styles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50',
    ghost: 'hover:bg-slate-100',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
