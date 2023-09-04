# nyp19vp-be

## To start kafka, kafdrop and mongodb server

### Prerequisite

Docker and docker must be installed and run in your machine.

Eslint and Prettier extension MUST BE INSTALLED

### Commands

In the root directory

```sh
cd monorepo/docker/

# run the docker compose file
./run.sh
```

## To start service

### Run all

In the root directory

```sh
cd monorepo/

npx nx run-many --target=serve
```

### Run a specific service

In the root directory

```sh
cd monorepo/

npx nx serve <service name or service folder name>
```
