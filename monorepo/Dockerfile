FROM node:lts-alpine
ENV NODE_ENV=stage

# install git
RUN apk update && apk upgrade && \
  apk add --no-cache bash git openssh

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install
COPY . .

RUN npx nx run-many --target=build