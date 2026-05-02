import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const base =
  'inline-flex items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-donot-naranjo focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:
    'bg-donot-naranjo text-white font-display hover:bg-donot-naranjo/90',
  secondary:
    'border-2 border-donot-verde text-donot-verde font-sans font-semibold hover:bg-donot-verde hover:text-donot-crema',
  ghost:
    'text-donot-verde font-sans font-semibold hover:bg-donot-verde/5',
}

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
