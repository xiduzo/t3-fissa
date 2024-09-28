import {
    Popover,
    PopoverBackdrop,
    PopoverButton,
    PopoverPanel,
} from '@headlessui/react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'

import { ChevronUp, MenuIcon } from 'lucide-react'
import { useTheme } from '~/providers/ThemeProvider'
import { Container } from './Container'
import { Logo } from './Logo'
import { NavLinks } from './NavLinks'

function MobileNavLink(
  props: Omit<
    React.ComponentPropsWithoutRef<typeof PopoverButton<typeof Link>>,
    'as' | 'className'
  >,
) {
  const { theme } = useTheme()

  return (
    <PopoverButton
      as={Link}
      className="block text-base leading-7 tracking-tight text-gray-700"
      {...props}
      style={{ color: theme[100] }}
    />
  )
}

export function Header() {
  const { theme } = useTheme()
  return (
    <header style={{ backgroundColor: theme[900] }}>
      <nav>
        <Container className="relative z-50 flex justify-between py-8">
          <div className="relative z-10 flex items-center gap-16">
            <Link href="/" aria-label="Home" className='flex items-center space-x-4'>
              <Logo className="h-10 w-auto rounded-md" />
              <div className='font-bold text-4xl'>Fissa</div>
            </Link>
            <div className="hidden lg:flex lg:gap-10">
              <NavLinks />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Popover className="lg:hidden">
              {({ open }) => (
                <>
                  <PopoverButton
                    className="relative z-10 -m-2 inline-flex items-center rounded-lg stroke-gray-900 p-2 hover:bg-gray-200/50 hover:stroke-gray-600 active:stroke-gray-900 ui-not-focus-visible:outline-none"
                    aria-label="Toggle site navigation"
                  >
                    {({ open }) =>
                      open ? (
                        <ChevronUp className="h-6 w-6" style={{ color: theme[100]}} />
                      ) : (
                        <MenuIcon className="h-6 w-6" style={{ color: theme[100]}} />
                      )
                    }
                  </PopoverButton>
                  <AnimatePresence initial={false}>
                    {open && (
                      <>
                        <PopoverBackdrop
                          static
                          as={motion.div}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-0 backdrop-blur"
                          style={{ backgroundColor: theme[100] + '60' }}
                        />
                        <PopoverPanel
                          static
                          as={motion.div}
                          initial={{ opacity: 0, y: -32 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            y: -32,
                            transition: { duration: 0.2 },
                          }}
                          style={{ backgroundColor: theme[900] }}
                          className="absolute inset-x-0 top-0 z-0 origin-top rounded-b-2xl px-6 pb-6 pt-32 shadow-2xl shadow-gray-900/20"
                        >
                          <div className="space-y-4">
                            <MobileNavLink href="/#features">
                              Features
                            </MobileNavLink>
                            <MobileNavLink href="/#join-a-fissa">
                              Join a Fissa
                            </MobileNavLink>
                            <MobileNavLink href="/#faqs">FAQs</MobileNavLink>
                          </div>
                        </PopoverPanel>
                      </>
                    )}
                  </AnimatePresence>
                </>
              )}
            </Popover>
          </div>
        </Container>
      </nav>
    </header>
  )
}
