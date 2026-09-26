import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'ok'
  children: ReactNode
}

const styles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-[#0071E3] text-white hover:bg-[#0077ED] active:bg-[#0062C4] shadow-xs',
  secondary: 'bg-white text-[#1D1D1F] border border-black/[0.12] hover:bg-black/[0.02] hover:border-black/[0.18] shadow-xs',
  ghost: 'bg-transparent text-[#1D1D1F] hover:bg-black/[0.04] active:bg-black/[0.07]',
  danger: 'bg-[#FF3B30] text-white hover:bg-[#E0342A] active:bg-[#C92B22] shadow-xs',
  ok: 'bg-[#34C759] text-white hover:bg-[#2EB34F] active:bg-[#259B42] shadow-xs',
}

export function Button({ variant = 'secondary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-medium tracking-normal transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
