interface DefaultButtonProps {
  children: React.ReactNode
  onClick?: () => void
  classname?: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export default function DefaultButton({
  children,
  onClick,
  classname = '',
  variant = 'primary',
  disabled = false,
  type = 'button',
}: DefaultButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-3 transition-all duration-300 tablet:px-6 desktop:px-6 desktop:py-3 ${classname} ${
        variant === 'primary'
          ? 'bg-primary-green text-white hover:enabled:bg-green-10'
          : 'border border-primary-green/10 bg-white text-primary-green hover:enabled:bg-primary-green/10'
      } hover:enabled:scale-105 disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  )
}
