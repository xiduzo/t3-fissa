FROM node:19-alpine

WORKDIR /usr/src/app

COPY . .

RUN npm install -g pnpm
RUN pnpm install
RUN pnpx prisma generate

WORKDIR /usr/src/app/apps/sync

CMD [ "npm", "run", "dev" ]