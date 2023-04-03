FROM node:19-alpine

WORKDIR /usr/src/app

COPY . .

RUN npm install -g pnpm
RUN pnpm install
RUN npx turbo db:generate

WORKDIR /usr/src/app/apps/docker

CMD [ "npm", "run", "dev" ]