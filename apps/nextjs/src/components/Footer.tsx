
import { useTheme } from '~/providers/ThemeProvider'
import { AppStoreLink } from './AppStoreLink'
import { Container } from './Container'
import { Logomark } from './Logo'
import { NavLinks } from './NavLinks'
import { PlayStoreLink } from './PlayStoreLink'

export function Footer() {
  const { theme } = useTheme()

  return (
    <footer className="border-t border-gray-200" style={{background: theme[900], color: theme[100]}}>
      <Container>
        <div className="flex flex-col items-start justify-between gap-y-12 pb-6 pt-16 lg:flex-row lg:items-center lg:py-16">
          <div className='flex-grow'>
            <div className="flex items-center">
              <Logomark className="h-10 w-10 flex-none rounded-md" aria-hidden="true" />
              <div className="ml-4" aria-label='Fissa, everyone can be a DJ.'>
                <p className="text-base font-semibold">Fissa</p>
                <p className="mt-1 text-sm">Everyone can be a DJ.</p>
              </div>
            </div>
            <nav className="mt-11 flex gap-8">
              <NavLinks />
            </nav>
          </div>
          <div className="flex flex-col justify-center lg:items-end items-center w-full lg:w-auto">
            <AppStoreLink />
            <PlayStoreLink />
          </div>
        </div>
        <div className="flex flex-col items-center border-t border-gray-200 pb-12 pt-8 md:flex-row-reverse md:justify-between md:pt-6">
          <a href="https://www.sanderboer.nl" className="hover:underline" target='_blank'>Made with ♥️ by Xiduzo</a>
          <p className="mt-6 text-sm text-gray-500 md:mt-0">
            <span className='rotate-180 inline-block'>&copy;</span> Copyleft {new Date().getFullYear()}. No rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  )
}
