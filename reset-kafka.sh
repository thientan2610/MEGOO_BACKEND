#!/bin/bash

cd monorepo/docker

# Stop and remove containers
docker-compose stop kafka kafdrop zookeeper
docker-compose rm -f kafka kafdrop zookeeper

# Remove volumes
docker volume rm $(docker volume ls --filter name=kafka_data -q)
docker volume rm $(docker volume ls --filter name=kafdrop_data -q)
docker volume rm $(docker volume ls --filter name=zookeeper_data -q)

# start the containers
docker-compose up -d zookeeper kafka kafdrop