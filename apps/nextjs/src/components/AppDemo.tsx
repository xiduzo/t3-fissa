import { AppScreen } from './AppScreen'
import { TrackList } from './TrackList'


export function AppDemo() {
  return (
    <AppScreen>
      <AppScreen.Body className='space-y-4'>
        <TrackList/>
      </AppScreen.Body>
    </AppScreen>
  )
}
