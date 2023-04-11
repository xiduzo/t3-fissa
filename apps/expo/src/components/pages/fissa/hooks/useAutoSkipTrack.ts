import { useSpotify } from "@fissa/utils"
import { useGetFissaDetails, useSkipTrack } from "../../../../hooks"
import { useAuth } from "../../../../providers"
import {  useMemo } from "react"

export const useAutoSkipTrack = (pin: string) => {
    const { user} = useAuth()
    const { data} = useGetFissaDetails(String(pin))
    const spotify = useSpotify()

    const { mutateAsync } = useSkipTrack(pin)

    useMemo(async() => {
        if(!user) return
        if(!data?.currentIndex) return
        if(data.currentIndex < 0) return

        if(data.by.email !== user.email) return

        const { is_playing } = await spotify.getMyCurrentPlaybackState()
        if(is_playing) return

        // Skip tracks when fissa says we are playing a track
        // While spotify says we are not playing a track
        await mutateAsync()
    }, [user, data?.currentIndex, spotify, mutateAsync])
}