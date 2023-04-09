/*
  Warnings:

  - The primary key for the `tracks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `room_id` on the `tracks` table. All the data in the column will be lost.
  - You are about to alter the column `index` on the `tracks` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - The primary key for the `votes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `room_id` on the `votes` table. All the data in the column will be lost.
  - You are about to alter the column `track_id` on the `votes` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(22)`.
  - You are about to drop the `rooms` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[pin,index]` on the table `tracks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pin` to the `tracks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pin` to the `votes` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `vote` on the `votes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tracks" DROP CONSTRAINT "tracks_room_id_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_track_id_room_id_fkey";

-- DropIndex
DROP INDEX "tracks_room_id_index_key";

-- AlterTable
ALTER TABLE "tracks" DROP CONSTRAINT "tracks_pkey",
DROP COLUMN "room_id",
ADD COLUMN     "pin" VARCHAR(4) NOT NULL,
ADD COLUMN     "score" SMALLINT NOT NULL DEFAULT 0,
ALTER COLUMN "index" SET DATA TYPE SMALLINT,
ADD CONSTRAINT "tracks_pkey" PRIMARY KEY ("pin", "track_id");

-- AlterTable
ALTER TABLE "votes" DROP CONSTRAINT "votes_pkey",
DROP COLUMN "room_id",
ADD COLUMN     "pin" VARCHAR(4) NOT NULL,
DROP COLUMN "vote",
ADD COLUMN     "vote" SMALLINT NOT NULL,
ALTER COLUMN "track_id" SET DATA TYPE VARCHAR(22),
ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("track_id", "user_id", "pin");

-- DropTable
DROP TABLE "rooms";

-- DropEnum
DROP TYPE "VOTE";

-- CreateTable
CREATE TABLE "fissas" (
    "pin" VARCHAR(4) NOT NULL,
    "current_index" SMALLINT NOT NULL DEFAULT 0,
    "last_played_index" SMALLINT NOT NULL DEFAULT 0,
    "expected_end_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "last_update_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "should_reorder" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "fissas_pkey" PRIMARY KEY ("pin")
);

-- CreateIndex
CREATE UNIQUE INDEX "fissas_pin_key" ON "fissas"("pin");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_pin_index_key" ON "tracks"("pin", "index");

-- AddForeignKey
ALTER TABLE "fissas" ADD CONSTRAINT "fissas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_pin_fkey" FOREIGN KEY ("pin") REFERENCES "fissas"("pin") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_track_id_pin_fkey" FOREIGN KEY ("track_id", "pin") REFERENCES "tracks"("track_id", "pin") ON DELETE CASCADE ON UPDATE CASCADE;
