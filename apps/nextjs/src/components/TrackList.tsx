import { ArrowDown, ArrowUp, EllipsisVertical, SkipForward } from 'lucide-react'
import Image from 'next/image'
import { useTheme } from "~/providers/ThemeProvider"

export function TrackList() {
  const {theme} = useTheme()

  return (
    <section className='space-y-4'>
      <article className='text-white flex justify-between space-x-2 items-center p-1.5 -m-1.5 rounded-md'  style={{backgroundColor: theme[100] + '10'}}>
        <section className='flex space-x-3 flex-grow'>
          <Image className='rounded-md' src="https://i.scdn.co/image/ab67616d00004851273246d060cdf5ddbb6a5ed2" alt="" width={60} height={60} />
          <section className='flex-grow'>
            <h1>Ik Fok Met Jou</h1>
            <h2 className='text-xs' style={{color: theme[100] + '80' }}>Hef, Frsh, Eves Laurent</h2>
            <div className='rounded-sm overflow-hidden mt-2 w-full' style={{backgroundColor: theme[500] + '20'}}>
              <div className='h-1 w-[40%] rounded-sm' style={{backgroundColor: theme[500]}}></div>
            </div>
          </section>
        </section>
        <SkipForward/>
      </article>
      <article className='text-white flex justify-between space-x-2 items-center'>
          <section className='flex space-x-3 items-center'>
            <Image className='rounded-md' src="https://i.scdn.co/image/ab67616d00004851ba665c3ce15a992b68dbe2f3" alt="" width={60} height={60} />
            <section>
              <h1>Nunca Es Suficiente</h1>
              <div className='mt-1 flex space-x-1 items-center'>
                <div className='text-xs font-bold p-0.5 px-1 rounded-md' style={{backgroundColor: theme[100] + '50', color: theme[900]}}>+8</div>
                <h2 className='text-xs' style={{color: theme[100] + '80' }}>Los Angeles Azules, N...</h2>
              </div>
            </section>
          </section>
          <ArrowUp style={{color: theme[500]}} />
      </article>
      <article className='text-white flex justify-between space-x-2 items-center'>
          <section className='flex space-x-3 items-center'>
            <Image className='rounded-md' src="https://i.scdn.co/image/ab67616d00004851abe13c3228acc0aa278fa4dc" alt="" width={60} height={60} />
            <section>
              <h1>Donald Trump</h1>
              <div className='mt-1 flex space-x-1 items-center'>
                <div className='text-xs font-bold p-0.5 px-1 rounded-md' style={{backgroundColor: theme[100] + '50', color: theme[900]}}>0</div>
                <h2 className='text-xs' style={{color: theme[100] + '80' }}>Mac Miller.</h2>
              </div>
            </section>
          </section>
          <EllipsisVertical className='opacity-50' />
      </article>
      <article className='text-white flex justify-between space-x-2 items-center'>
          <section className='flex space-x-3 items-center'>
            <Image className='rounded-md' src="https://i.scdn.co/image/ab67616d000048511581308227d16ad003f1d3ff" alt="" width={60} height={60} />
            <section>
              <h1>Oh Devil (feat. Devin...</h1>
              <div className='mt-1 flex space-x-1 items-center'>
                <div className='text-xs font-bold p-0.5 px-1 rounded-md' style={{backgroundColor: theme[100] + '50', color: theme[900]}}>0</div>
                <h2 className='text-xs' style={{color: theme[100] + '80' }}>Electric Guest, Devin Di...</h2>
              </div>
            </section>
          </section>
          <EllipsisVertical className='opacity-50' />
      </article>
      <article className='text-white flex justify-between space-x-2 items-center'>
          <section className='flex space-x-3 items-center'>
            <Image className='rounded-md' src="https://i.scdn.co/image/ab67616d00004851255e131abc1410833be95673" alt="" width={60} height={60} />
            <section>
              <h1>Never Gonna Give Yo...</h1>
              <div className='mt-1 flex space-x-1 items-center'>
                <div className='text-xs font-bold p-0.5 px-1 rounded-md' style={{backgroundColor: theme[100] + '50', color: theme[900]}}>-8</div>
                <h2 className='text-xs' style={{color: theme[100] + '80' }}>Rick Astley</h2>
              </div>
            </section>
          </section>
          <ArrowDown style={{color: theme[500]}} />
      </article>
    </section>
  )
}
