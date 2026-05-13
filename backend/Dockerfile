# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: pgrellie <pgrellie@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/03/03 18:18:09 by pgrellie          #+#    #+#              #
#    Updated: 2026/04/08 17:20:22 by pgrellie         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

# Iamge de base
FROM node:20-bullseye-slim

# Creer et se positionne dans /app dans le conteneur
WORKDIR /app

# Copie le/les fichiers package*.json dans le conteneurs
COPY package*.json ./

RUN npm install

# Copie le code source
COPY . .

# Genere le client Prisma qui permet d'interagir
# avec la base de donnee en typescript.
# Necessaire pour @prisma/client fonctionne
RUN npx prisma generate
### RUN npm run prisma:generate

# Sert a compiler Typescrip en Javascript
RUN npm run build

# Exposition du port
EXPOSE 4000

# POUR EXEC SUR WINDOWS (ALEXIS)
# RUN sed -i 's/\r$//' ./docker-entrypoint.sh 

RUN chmod +x ./docker-entrypoint.sh

# POUR EXEC SUR WINDOWS (ALEXIS)
# CMD ["sh", "./docker-entrypoint.sh"]

CMD ["./docker-entrypoint.sh"]

# Optimisation multi-stage (avancé)
# Pour une image production encore plus légère, vous pouvez séparer build et runtime :
# 
# # Stage 1: Build
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm run build
# 
# # Stage 2: Production
# FROM node:20-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install --production
# COPY --from=builder /app/dist ./dist
# EXPOSE 3000
# CMD ["npm", "start"]
# 
# Commencez par la version simple, puis expérimentez avec l'optimisation !

