import { theme } from "@fissa/tailwind-config"
import { format, formatNumber } from "@fissa/utils"
import { FlashList } from "@shopify/flash-list"
import { Stack, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { TouchableHighlight, View } from "react-native"
import { BADGE } from "../../../../packages/db"
import { Button, PageTemplate, Popover, Typography } from "../../src/components"
import { useAuth } from "../../src/providers"
import { api } from "../../src/utils"

const Index = () => {
  const { user, signOut } = useAuth()
  const { replace } = useRouter()
  const { data, isInitialLoading } = api.auth.getUserStats.useQuery()

  const signOutUser = useCallback(() => {
    signOut()
    replace("")
  }, [signOut, replace])

  return (
    <PageTemplate fullScreen className="p-6 pb-4">
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackVisible: true
        }}
      />
      <View className="space-y-10">
        <View className="space-y-1">
          <Typography centered variant="h1">{user?.display_name}</Typography>
          <Typography centered dimmed>Joined {format(data?.createdAt ?? new Date(), "MMMM yyyy")}</Typography>
        </View>
        <View className="space-y-2">
          <View className="justify-between items-center flex-row">
            <Typography variant="h2">Stats</Typography>
            {/* <Typography dimmed>+2 undiscovered</Typography> */}
          </View>
          <View className="flex-grow h-80 -mx-2">
            <FlashList estimatedItemSize={24} horizontal renderItem={({ item }) => {
              return <Badge isLoading={isInitialLoading} badge={item} score={data?.badges.find(badge => badge.name === item)?.score} />
            }} data={Object.values(BADGE)} />
          </View>
        </View>
      </View>
      <View>
        <Button
          inverted
          title="Sign out"
          onPress={signOutUser} />
      </View>
    </PageTemplate>
  )
}

type Badge = { name: string, icon: string, description: string, subtext?: string }
const BADGE_NAMES: Record<BADGE, Badge> = {
  [BADGE.DOWN_VOTES_CAST]: {
    name: "Critic",
    icon: "🐈",
    description: "Earned by down voting songs of others"
  },
  [BADGE.DOWN_VOTES_RECEIVED]: {
    name: "Buzzkill",
    icon: "🦟",
    description: "Earned by receiving down votes on your songs"
  },
  [BADGE.FISSAS_CREATED]: {
    name: "Super host",
    icon: "🦃",
    description: "Earned by hosting Fissas",
    subtext: "Can only earn 1 point per day"
  },
  [BADGE.FISSAS_JOINED]: {
    name: "Party animal",
    icon: "🦚",
    description: "Earned by joining Fissas",
    subtext: "Can only earn 1 point per day"
  },
  [BADGE.TRACKS_ADDED]: {
    name: "Beatmaster",
    icon: "🦗",
    description: "Earned by adding songs to Fissas"
  },
  [BADGE.UP_VOTES_CAST]: {
    name: "Cheerleader",
    icon: "🐄",
    description: "Earned by up voting songs of others"
  },
  [BADGE.UP_VOTES_RECEIVED]: {
    name: "Superstar",
    icon: "🐩",
    description: "Earned by receiving up votes on your songs"
  },
  [BADGE.POINTS_EARNED]: {
    name: "Music Maestro",
    icon: "🦜",
    description: "Your total Fissa score over all Fissas"
  },
}

const Badge = ({ badge, score, isLoading }: { badge: BADGE, isLoading: boolean, score?: number }) => {
  const [selected, setSelected] = useState(false)

  return (
    <View className="mx-2 mb-4">
      <TouchableHighlight
        className="rounded-md"
        onPress={() => setSelected(true)}
        underlayColor={theme['100'] + '40'}
      >
        <View className="items-center border rounded-md w-36 lg:w-56 p-3 space-y-2" style={{
          borderColor: theme['100'] + '40',
        }}>
          <Typography centered dimmed>{BADGE_NAMES[badge].name}</Typography>
          <View className="w-24 h-24 lg:w-32 lg:h-32 items-center justify-center">
            <Typography centered dimmed className="text-6xl lg:text-7xl" style={{
              lineHeight: 70
            }}>{BADGE_NAMES[badge].icon}</Typography>
          </View>
          {!isLoading && <Typography variant='h3'>{formatNumber(score ?? 0)}</Typography>}
          {isLoading && <Typography variant='h3' className="w-6 animate-pulse" style={{ backgroundColor: theme['100'] + '10' }}>&nbsp;</Typography>}
        </View>
      </TouchableHighlight>
      <Popover visible={selected} onRequestClose={() => setSelected(false)}>
        <Typography variant='h3' inverted centered>{BADGE_NAMES[badge].name}</Typography>
        <Typography inverted centered className="pb-14 pt-16 text-6xl">{formatNumber(score ?? 0)}</Typography>
        <Typography inverted centered dimmed>
          {BADGE_NAMES[badge].description}
        </Typography>
        {BADGE_NAMES[badge].subtext && <Typography variant='bodyM' className="italic mt-2" inverted centered dimmed>
          {BADGE_NAMES[badge].subtext}
        </Typography>}
      </Popover>
    </View>
  )
}

export default Index
