import { BADGE } from "@fissa/db";
import { differenceInHours } from "@fissa/utils";
import { ServiceWithContext } from "../utils/context";

export class BadgeService extends ServiceWithContext {
  async fissaCreated() {
    const userId = this.session?.user.id
    if (!userId) return

    try {
      await this.db.$transaction(async transaction => {
        const point = await transaction.badges.findUnique({
          where: { userId_name: { userId, name: BADGE.FISSAS_CREATED } }
        })

        if (!point) {
          await transaction.badges.create({
            data: { userId, name: BADGE.FISSAS_CREATED, score: 1 }
          })
          return
        }

        if (differenceInHours(point.lastUpdated, new Date()) < 24) {
          return
        }

        await transaction.badges.update({
          where: { userId_name: { userId, name: BADGE.FISSAS_CREATED } },
          data: { score: { increment: 1 } }
        })
      })
    } catch (error) {
      console.warn(error)
    }
  }

  async joinedFissa(pin: string) {
    const userId = this.session?.user.id
    if (!userId) return

    try {
      await this.db.$transaction(async transaction => {
        const fissa = await transaction.fissa.findUnique({
          where: { pin },
          select: { by: { select: { accounts: { select: { userId: true } } } } }
        })

        if (fissa?.by?.accounts[0]?.userId === userId) {
          return
        }


        const point = await transaction.badges.findUnique({
          where: { userId_name: { userId, name: BADGE.FISSAS_JOINED } }
        })

        if (!point) {
          await transaction.badges.create({
            data: { userId, name: BADGE.FISSAS_JOINED, score: 1 }
          })
          return
        }

        if (differenceInHours(point.lastUpdated, new Date()) < 24) {
          return
        }

        await transaction.badges.update({
          where: { userId_name: { userId, name: BADGE.FISSAS_JOINED } },
          data: { score: { increment: 1 } }
        })
      })
    } catch (error) {
      console.warn(error)
    }
  }

  async tracksAdded(amount: number) {
    const userId = this.session?.user.id
    if (!userId) return

    try {
      await this.db.badges.upsert(({
        where: { userId_name: { userId, name: BADGE.TRACKS_ADDED } },
        create: { userId, name: BADGE.TRACKS_ADDED, score: amount },
        update: { score: { increment: amount } }
      }))
    } catch (error) {
      console.warn(error)
    }
  }

  async voted(vote: number, forUser?: string | null) {
    const userId = this.session?.user.id
    if (!userId) return

    try {
      await this.db.$transaction(async transaction => {
        const name = vote > 0 ? BADGE.UP_VOTES_CAST : BADGE.DOWN_VOTES_CAST
        await transaction.badges.upsert({
          where: { userId_name: { userId, name } },
          create: { name, userId, score: 1 },
          update: { score: { increment: 1 } }
        })

        if (forUser) {
          const forName = vote > 0 ? BADGE.UP_VOTES_RECEIVED : BADGE.DOWN_VOTES_RECEIVED
          await transaction.badges.upsert({
            where: { userId_name: { userId: forUser, name: forName } },
            create: { userId: forUser, name: forName, score: 1 },
            update: { score: { increment: 1 } }
          })

        }
      })
    } catch (error) {
      console.warn(error)
    }
  }
}
