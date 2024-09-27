import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { useTheme } from '~/providers/ThemeProvider'

export function NavLinks() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const { theme} = useTheme()

  return ([
    ['Features', '/#features'],
    ['Join a Fissa', '/#join-a-fissa'],
    ['FAQs', '/#faqs'],
  ] as const).map(([label, href], index) => (
    <Link
      key={label}
      href={href}
      style={{ color: theme[100] }}
      className="relative -mx-3 -my-2 rounded-lg px-3 py-2 text-smtransition-colors delay-150 hover:delay-0"
      onMouseEnter={() => {
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current)
        }
        setHoveredIndex(index)
      }}
      onMouseLeave={() => {
        timeoutRef.current = window.setTimeout(() => {
          setHoveredIndex(null)
        }, 200)
      }}
    >
      <AnimatePresence>
        {hoveredIndex === index && (
          <motion.span
            className="absolute inset-0 rounded-lg border"
            layoutId="hoverBackground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.15 } }}
            style={{ borderColor: theme[100] }}
            exit={{
              opacity: 0,
              transition: { duration: 0.15 },
            }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10">{label}</span>
    </Link>
  ))
}
