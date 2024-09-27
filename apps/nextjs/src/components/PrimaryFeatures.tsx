import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import clsx from 'clsx'
import {
  AnimatePresence,
  motion,
  type MotionProps,
  type Variant,
  type Variants,
} from 'framer-motion'
import Image from 'next/image'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { ArrowDown, ArrowUp, ChevronRight, Disc3, Music, SearchIcon, Vote } from 'lucide-react'
import { useTheme } from '~/providers/ThemeProvider'
import { AppScreen } from './AppScreen'
import { CircleBackground } from './CircleBackground'
import { Container } from './Container'
import { PhoneFrame } from './PhoneFrame'
import { TrackList } from './TrackList'

const MotionAppScreenBody = motion(AppScreen.Body)

interface CustomAnimationProps {
  isForwards: boolean
  changeCount: number
}

const features = [
  {
    name: 'Up- and down-vote songs',
    description:
      'Vote on songs to make sure the best songs are played at the right time.',
    icon: Vote,
    screen: UpAndDownVote,
  },
  {
    name: 'Add songs directly from your Spotify playlists',
    description:
      'Show off your favorite tunes with easy access to all your playlists.',
    icon: Music,
    screen: AddSongsFromSpotify,
  },
  {
    name: 'The Fissa never stops',
    description:
      'Ensures there will always be music playing, based on the vibes of the Fissa.',
    icon: Disc3,
    screen: TheFissaNeverStops,
  },
]

const headerAnimation: Variants = {
  initial: { opacity: 0, transition: { duration: 0.3 } },
  animate: { opacity: 1, transition: { duration: 0.3, delay: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

const maxZIndex = 2147483647

const bodyVariantBackwards: Variant = {
  opacity: 0.4,
  scale: 0.8,
  zIndex: 0,
  filter: 'blur(4px)',
  transition: { duration: 0.4 },
}

const bodyVariantForwards: Variant = (custom: CustomAnimationProps) => ({
  y: '100%',
  zIndex: maxZIndex - custom.changeCount,
  transition: { duration: 0.4 },
})

const bodyAnimation: MotionProps = {
  initial: 'initial',
  animate: 'animate',
  exit: 'exit',
  variants: {
    initial: (custom: CustomAnimationProps, ...props) =>
      custom.isForwards
        ? bodyVariantForwards(custom, ...props)
        : bodyVariantBackwards,
    animate: (custom: CustomAnimationProps) => ({
      y: '0%',
      opacity: 1,
      scale: 1,
      zIndex: maxZIndex / 2 - custom.changeCount,
      filter: 'blur(0px)',
      transition: { duration: 0.4 },
    }),
    exit: (custom: CustomAnimationProps, ...props) =>
      custom.isForwards
        ? bodyVariantBackwards
        : bodyVariantForwards(custom, ...props),
  },
}

type ScreenProps =
  | {
      animated: true
      custom: CustomAnimationProps
    }
  | { animated?: false }

function AddSongsFromSpotify(props: ScreenProps) {
  const {theme} = useTheme()
  return (
    <AppScreen className="w-full">
      <MotionAppScreenBody
        {...(props.animated ? { ...bodyAnimation, custom: props.custom } : {})}
      >
        <section style={{color: theme[100]}}>
          <section className='w-full h-8 rounded-md flex items-center px-1 space-x-2' style={{backgroundColor: theme[500] +'30'}}>
            <SearchIcon className='scale-90 opacity-30' />
            <div className='text-xs opacity-20'>Search in Spotify</div>
          </section>
          <h1 className='text-2xl font-bold mt-6 mb-4'>Your playlists</h1>
          <section className='space-y-4'>
            <article className='text-white flex justify-between space-x-2 items-center'>
                <section className='flex space-x-3 items-center'>
                  <Image className='rounded-md' src="https://misc.scdn.co/liked-songs/liked-songs-300.png" alt="" width={60} height={60} />
                  <section>
                    <h1>Liked songs</h1>
                    <div className='mt-1 flex space-x-1 items-center'>
                      <h2 className='text-xs' style={{color: theme[100] + '60' }}>Xiduzo • 69 songs</h2>
                    </div>
                  </section>
                </section>
              <ChevronRight style={{ color: theme[500] + '30'}} />
            </article>
            <article className='text-white flex justify-between space-x-2 items-center'>
                <section className='flex space-x-3 items-center'>
                  <Image className='rounded-md' src="https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84aa74bbf82f646a97beb9e4d3" alt="" width={60} height={60} />
                  <section>
                    <h1>Cozy uppers</h1>
                    <div className='mt-1 flex space-x-1 items-center'>
                      <h2 className='text-xs' style={{color: theme[100] + '60' }}>Milan van der Maaten • 77 s...</h2>
                    </div>
                  </section>
                </section>
              <ChevronRight style={{ color: theme[500] + '30'}} />
            </article>
            <article className='text-white flex justify-between space-x-2 items-center'>
                <section className='flex space-x-3 items-center'>
                  <Image className='rounded-md' src="https://mosaic.scdn.co/300/ab67616d00001e021f9e9f704f7dc5bfd0063e72ab67616d00001e028b90b371248a27daa7e3d774ab67616d00001e02d101716ff456b9955b98199cab67616d00001e02f3c7e4934b8dd9eedf69e6e5" alt="" width={60} height={60} />
                  <section>
                    <h1>Gezellige boel</h1>
                    <div className='mt-1 flex space-x-1 items-center'>
                      <h2 className='text-xs' style={{color: theme[100] + '60' }}>Bella van Buren • 71 songs</h2>
                    </div>
                  </section>
                </section>
              <ChevronRight style={{ color: theme[500] + '30'}} />
            </article>
            <article className='text-white flex justify-between space-x-2 items-center'>
                <section className='flex space-x-3 items-center'>
                  <Image className='rounded-md' src="https://mosaic.scdn.co/300/ab67616d00001e023452d31d2ef8ce06f151a028ab67616d00001e02734b36a0655aae40d78d70f4ab67616d00001e02b9242ba03ab231608f123e06ab67616d00001e02e9da42890bbd629df1e8f640" alt="" width={60} height={60} />
                  <section>
                    <h1>Ritmo Latino</h1>
                    <div className='mt-1 flex space-x-1 items-center'>
                      <h2 className='text-xs' style={{color: theme[100] + '60' }}>Val Oceguera • 17 songs</h2>
                    </div>
                  </section>
                </section>
              <ChevronRight style={{ color: theme[500] + '30'}} />
            </article>
            <article className='text-white flex justify-between space-x-2 items-center'>
                <section className='flex space-x-3 items-center'>
                  <Image className='rounded-md' src="https://i.scdn.co/image/ab67706f00000002d12afe707b6db45b89cf6d27" alt="" width={60} height={60} />
                  <section>
                    <h1>RapCaviar</h1>
                    <div className='mt-1 flex space-x-1 items-center'>
                      <h2 className='text-xs' style={{color: theme[100] + '60' }}>Spotify • 50 songs</h2>
                    </div>
                  </section>
                </section>
              <ChevronRight style={{ color: theme[500] + '30'}} />
            </article>
          </section>
        </section>
      </MotionAppScreenBody>
    </AppScreen>
  )
}

function UpAndDownVote(props: ScreenProps) {
  const {theme} = useTheme()

  return (
    <AppScreen className="w-full">
      <section className='absolute inset-0 opacity-60'  style={{backgroundColor: theme[900]}}>
      </section>
      <MotionAppScreenBody
        {...(props.animated ? { ...bodyAnimation, custom: props.custom } : {})}
      >
        <section className='absolute inset-0 flex items-end z-10' style={{backgroundColor: theme[900] + '70'}}>
          <section className='w-full rounded-t-3xl p-4 md:pb-8 pb-40 bg-gradient-to-br' style={{backgroundColor: theme[500]}}>
            <article className='text-white flex justify-between space-x-2 items-center'>
                <section className='flex space-x-3 items-center'>
                  <Image className='rounded-md' src="https://i.scdn.co/image/ab67616d00004851abe13c3228acc0aa278fa4dc" alt="" width={60} height={60} />
                  <section>
                    <h1 style={{color: theme[900]}}>Donald Trump</h1>
                    <div className='mt-1 flex space-x-1 items-center'>
                      <div className='text-xs font-bold p-0.5 px-1 rounded-md' style={{backgroundColor: theme[900] + '50', color: theme[500]}}>0</div>
                      <h2 className='text-xs' style={{color: theme[900] + '90' }}>Mac Miller.</h2>
                    </div>
                  </section>
                </section>
            </article>
            <hr className='my-4' style={{borderColor: theme[900] + '60'}}/>
            <article className='flex space-x-2 items-center'>
              <section className='w-12 h-12 border rounded-md flex items-center justify-center' style={{borderColor: theme[900]}}>
                <ArrowUp style={{color: theme[900]}} />
              </section>
              <section style={{color: theme[900]}}>
                <h1>Up-vote song</h1>
                <div className='opacity-60 text-sm'>It might move up the queue</div>
              </section>
            </article>
            <article className='flex space-x-2 items-center mt-4'>
              <section className='w-12 h-12 border rounded-md flex items-center justify-center' style={{borderColor: theme[900]}}>
                <ArrowDown style={{color: theme[900]}} />
              </section>
              <section style={{color: theme[900]}}>
                <h1>Down-vote song</h1>
                <div className='opacity-60 text-sm'>It might move down the queue</div>
              </section>
            </article>
          </section>
        </section>
        <section className='pt-4'>
          <TrackList />
        </section>
      </MotionAppScreenBody>
    </AppScreen>
  )
}

function TheFissaNeverStops(props: ScreenProps) {
  const {theme} = useTheme()

  return (
    <AppScreen className="w-full">
      <MotionAppScreenBody
        {...(props.animated ? { ...bodyAnimation, custom: props.custom } : {})}
      >
        <section className='opacity-30'>
          <TrackList />
        </section>
        <section className='text-center mt-4 md:mt-12' style={{color: theme[100]}}>
          <h1 className='text-4xl mb-1 md:mb-4'>🦦</h1>
          <div>Add songs or I&apos;ll fill the queue</div>
        </section>
      </MotionAppScreenBody>
    </AppScreen>
  )
}

function usePrevious<T>(value: T) {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

function FeaturesDesktop() {
  const { theme } = useTheme()

  const [changeCount, setChangeCount] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const prevIndex = usePrevious(selectedIndex)
  const isForwards = prevIndex === undefined ? true : selectedIndex > prevIndex

  const onChange = useDebouncedCallback(
    (selectedIndex: number) => {
      setSelectedIndex(selectedIndex)
      setChangeCount((changeCount) => changeCount + 1)
    },
    100,
    { leading: true },
  )

  return (
    <TabGroup
      className="grid grid-cols-12 items-center gap-8 lg:gap-16 xl:gap-24"
      selectedIndex={selectedIndex}
      onChange={onChange}
      vertical
    >
      <TabList className="relative z-10 order-last col-span-6 space-y-6">
        {features.map((feature, featureIndex) => (
          <div
            key={feature.name}
            className="relative rounded-2xl transition-colors hover:bg-gray-800/10"
          >
            {featureIndex === selectedIndex && (
              <motion.div
                layoutId="activeBackground"
                className="absolute inset-0"
                initial={{ borderRadius: 16 }}
                style={{ backgroundColor: theme[900] }}
              />
            )}
            <div className="relative z-10 p-8">
              <feature.icon className="h-8 w-8  transition-all duration-150 delay-150" style={{ color: featureIndex === selectedIndex ? theme[100] : theme[900] }} />
                <h3 className="mt-6 text-lg font-semibold transition-all duration-150 delay-150" style={{ color: featureIndex === selectedIndex ? theme[100] : theme[900] }}>
                <Tab className="text-left ui-not-focus-visible:outline-none">
                  <span className="absolute inset-0 rounded-2xl" />
                  {feature.name}
                </Tab>
              </h3>
              <p className="mt-2 text-sm transition-all duration-150 delay-150" style={{ color: featureIndex === selectedIndex ? theme[100] : theme[900] }}>
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </TabList>
      <div className="relative col-span-6">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <CircleBackground color={theme[900]} className="animate-spin-slower" />
        </div>
        <PhoneFrame className="z-10 mx-auto w-full max-w-[366px]">
          <TabPanels as={Fragment}>
            <AnimatePresence
              initial={false}
              custom={{ isForwards, changeCount }}
            >
              {features.map((feature, featureIndex) =>
                selectedIndex === featureIndex ? (
                  <TabPanel
                    static
                    key={feature.name + changeCount}
                    className="col-start-1 row-start-1 flex focus:outline-offset-[32px] ui-not-focus-visible:outline-none"
                  >
                    <feature.screen
                      animated
                      custom={{ isForwards, changeCount }}
                    />
                  </TabPanel>
                ) : null,
              )}
            </AnimatePresence>
          </TabPanels>
        </PhoneFrame>
      </div>
    </TabGroup>
  )
}

function FeaturesMobile() {
  const [activeIndex, setActiveIndex] = useState(0)
  const slideContainerRef = useRef<React.ElementRef<'div'>>(null)
  const slideRefs = useRef<Array<React.ElementRef<'div'>>>([])
  const { theme } = useTheme()

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLDivElement) {
            setActiveIndex(slideRefs.current.indexOf(entry.target))
            break
          }
        }
      },
      {
        root: slideContainerRef.current,
        threshold: 0.6,
      },
    )

    for (const slide of slideRefs.current) {
      if (slide) {
        observer.observe(slide)
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [slideContainerRef, slideRefs])

  return (
    <>
      <div
        ref={slideContainerRef}
        className="-mb-4 flex snap-x snap-mandatory -space-x-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-4 [scrollbar-width:none] sm:-space-x-6 [&::-webkit-scrollbar]:hidden"
      >
        {features.map((feature, featureIndex) => (
          <div
            key={featureIndex}
            ref={(ref) => ref && (slideRefs.current[featureIndex] = ref)}
            className="w-full flex-none snap-center px-4 sm:px-6"
          >
            <div className="relative transform overflow-hidden rounded-2xl px-5 py-6" style={{backgroundColor: theme[900]}}>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <CircleBackground
                  color={theme[100]}
                  className={featureIndex % 2 === 1 ? 'rotate-180' : undefined}
                />
              </div>
              <PhoneFrame className="relative mx-auto w-full max-w-[366px]">
                <feature.screen />
              </PhoneFrame>
              <div className="absolute inset-x-0 bottom-0 p-6 backdrop-blur sm:p-10" style={{backgroundColor: theme[900]}}>
                <feature.icon className="h-8 w-8" style={{color: theme[100]}} />
                <h3 className="mt-6 text-sm font-semibold sm:text-lg" style={{color: theme[100]}}>
                  {feature.name}
                </h3>
                <p className="mt-2 text-sm" style={{color: theme[100] +'95'}}>
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-3">
        {features.map((_, featureIndex) => (
          <button
            type="button"
            key={featureIndex}
            className={clsx(
              'relative h-1 w-6 rounded-full',
            )}
            style={{backgroundColor: featureIndex === activeIndex ? theme[500] : theme[900]}}
            aria-label={`Go to slide ${featureIndex + 1}`}
            onClick={() => {
              slideRefs.current[featureIndex]?.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
              })
            }}
          >
            <span className="absolute -inset-x-1.5 -inset-y-3" />
          </button>
        ))}
      </div>
    </>
  )
}

export function PrimaryFeatures() {
  const { theme } = useTheme()

  return (
    <section
      id="features"
      aria-label="Features for investing all your money"
      className="py-20 sm:py-32"
      style={{ backgroundColor: theme['100'] }}
    >
      <Container>
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-3xl">
          <h2 className="text-3xl font-medium tracking-tight" style={{ color: theme['900']}}>
            A collaborative and democratic playlist
          </h2>
          <p className="mt-2 text-lg" style={{ color: theme['900'] + '90'}}>
            Powered by Spotify, controlled by you.<br/>Host a Fissa and let the crowd decide what to play next!
          </p>
        </div>
      </Container>
      <div className="mt-16 md:hidden">
        <FeaturesMobile />
      </div>
      <Container className="hidden md:mt-20 md:block">
        <FeaturesDesktop />
      </Container>
    </section>
  )
}
