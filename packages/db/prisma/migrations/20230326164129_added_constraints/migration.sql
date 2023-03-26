/*
  Warnings:

  - The primary key for the `tracks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `track_id` on the `tracks` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(22)`.
  - A unique constraint covering the columns `[pin]` on the table `rooms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[room_id,index]` on the table `tracks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `rooms` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tracks" DROP CONSTRAINT "tracks_room_id_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_track_id_room_id_fkey";

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "user_id" TEXT NOT NULL,
ALTER COLUMN "current_index" SET DEFAULT 0,
ALTER COLUMN "last_played_index" SET DEFAULT 0,
ALTER COLUMN "expected_end_time" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tracks" DROP CONSTRAINT "tracks_pkey",
ALTER COLUMN "track_id" SET DATA TYPE VARCHAR(22),
ADD CONSTRAINT "tracks_pkey" PRIMARY KEY ("room_id", "track_id");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_pin_key" ON "rooms"("pin");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_room_id_index_key" ON "tracks"("room_id", "index");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("pin") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_track_id_room_id_fkey" FOREIGN KEY ("track_id", "room_id") REFERENCES "tracks"("track_id", "room_id") ON DELETE CASCADE ON UPDATE CASCADE;
