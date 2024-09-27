import clsx from 'clsx'
import { Settings } from 'lucide-react'
import { forwardRef } from 'react'
import { useTheme } from '~/providers/ThemeProvider'

export function AppScreen({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={clsx('flex flex-col', className)} {...props}>
      <div className="text-white flex justify-between px-4 pt-2">
        <h1 className='text-xl font-bold'>Fissa 1994</h1>
        <Settings />
      </div>
      {children}
    </div>
  )
}

AppScreen.Header = forwardRef<
  React.ElementRef<'div'>,
  { children: React.ReactNode }
>(function AppScreenHeader({ children }, ref) {
  return (
    <div ref={ref} className="mt-6 px-4 text-white">
      {children}
    </div>
  )
})

AppScreen.Title = forwardRef<
  React.ElementRef<'div'>,
  { children: React.ReactNode }
>(function AppScreenTitle({ children }, ref) {
  return (
    <div ref={ref} className="text-2xl text-white">
      {children}
    </div>
  )
})

AppScreen.Subtitle = forwardRef<
  React.ElementRef<'div'>,
  { children: React.ReactNode }
>(function AppScreenSubtitle({ children }, ref) {
  return (
    <div ref={ref} className="text-sm text-gray-500">
      {children}
    </div>
  )
})

AppScreen.Body = forwardRef<
  React.ElementRef<'div'>,
  { className?: string; children: React.ReactNode }
>(function AppScreenBody({ children, className }, ref) {
  const { theme } = useTheme()

  return (
    <div
      ref={ref}
      className={clsx('mt-4 px-4 flex-auto', className)}
      style={{
        backgroundColor: theme['900']
      }}
    >
      {children}
    </div>
  )
})
