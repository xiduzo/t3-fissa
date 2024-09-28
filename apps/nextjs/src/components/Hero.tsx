import { useId } from 'react'

// import logoBbc from '@/images/logos/bbc.svg'
// import logoCbs from '@/images/logos/cbs.svg'
// import logoCnn from '@/images/logos/cnn.svg'
// import logoFastCompany from '@/images/logos/fast-company.svg'
// import logoForbes from '@/images/logos/forbes.svg'
// import logoHuffpost from '@/images/logos/huffpost.svg'
// import logoTechcrunch from '@/images/logos/techcrunch.svg'
// import logoWired from '@/images/logos/wired.svg'
import { useTheme } from '~/providers/ThemeProvider'
import { AppDemo } from './AppDemo'
import { AppStoreLink } from './AppStoreLink'
import { Container } from './Container'
import { PhoneFrame } from './PhoneFrame'
import { PlayStoreLink } from './PlayStoreLink'

function BackgroundIllustration(props: React.ComponentPropsWithoutRef<'div'>) {
  const id = useId()
  const {theme} = useTheme()

  return (
    <div {...props}>
      <svg
        viewBox="0 0 1026 1026"
        fill="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full animate-spin-slow"
      >
        <path
          d="M1025 513c0 282.77-229.23 512-512 512S1 795.77 1 513 230.23 1 513 1s512 229.23 512 512Z"
          stroke={theme[500]}
          strokeOpacity="0.7"
        />
        <path
          d="M513 1025C230.23 1025 1 795.77 1 513"
          stroke={theme[100]}
          strokeLinecap="round"
        />
      </svg>
      <svg
        viewBox="0 0 1026 1026"
        fill="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full animate-spin-reverse-slower"
      >
        <path
          d="M913 513c0 220.914-179.086 400-400 400S113 733.914 113 513s179.086-400 400-400 400 179.086 400 400Z"
          stroke={theme[500]}
          strokeOpacity="0.7"
        />
        <path
          d="M913 513c0 220.914-179.086 400-400 400"
          stroke={theme[100]}
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function Hero() {
  const { theme } = useTheme()

  return (
    <div className="overflow-hidden py-20 sm:py-32 lg:pb-32 xl:pb-36" style={{backgroundColor: theme[900]}}>
      <Container>
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
          <div className="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none lg:pt-6 xl:col-span-6">
            <h1 className="text-4xl font-medium tracking-tight">
              Not only one person should decide what is playing on a party
            </h1>
            <p className="mt-6 text-lg" style={{color: theme[100] + '95'}}>
              Having friends at a party with a bad taste in music stinks. Use Fissa to create a collaborative and democratic playlist for everyone to enjoy.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-4">
              <AppStoreLink />
              <PlayStoreLink />
            </div>
          </div>
          <div className="relative mt-10 sm:mt-20 lg:col-span-5 lg:row-span-2 lg:mt-0 xl:col-span-6">
            <BackgroundIllustration className="absolute left-1/2 top-4 h-[1026px] w-[1026px] -translate-x-1/3 stroke-gray-300/70 [mask-image:linear-gradient(to_bottom,black_20%,transparent_75%)] sm:top-16 sm:-translate-x-1/2 lg:-top-16 lg:ml-12 xl:-top-14 xl:ml-0" />
            <div className="-mx-4 h-[448px] px-9 [mask-image:linear-gradient(to_bottom,black_60%,transparent)] sm:mx-0 lg:absolute lg:-inset-x-10 lg:-bottom-20 lg:-top-10 lg:h-auto lg:px-0 lg:pt-10 xl:-bottom-32">
              <PhoneFrame className="mx-auto max-w-[366px]" priority>
                <AppDemo />
              </PhoneFrame>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
