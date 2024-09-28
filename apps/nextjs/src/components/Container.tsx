import clsx from 'clsx'
import { useTheme } from '~/providers/ThemeProvider'

export function Container({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const { theme } = useTheme()

  return (
    <div
      className={clsx('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}
      style={{color: theme[100]}}
      {...props}
    />
  )
}
