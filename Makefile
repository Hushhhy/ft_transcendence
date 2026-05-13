SHELL := /bin/bash

DOCKER_COMPOSE := $(shell \
	if docker compose version >/dev/null 2>&1; then \
		echo "docker compose"; \
	elif docker-compose version >/dev/null 2>&1; then \
		echo "docker-compose"; \
	fi)

ifndef DOCKER_COMPOSE
$(error Docker Compose introuvable. Installez "docker compose" ou "docker-compose")
endif

CERT_DIR := nginx/certs
CERT_KEY := $(CERT_DIR)/localhost.key
CERT_CRT := $(CERT_DIR)/localhost.crt

help:
	@echo "Commandes disponibles :"
	@echo "  make up            - Lance le projet (build + detach)"
	@echo "  make down          - Stoppe les conteneurs"
	@echo "  make restart       - Redémarre la stack"
	@echo "  make logs          - Affiche les logs en continu"
	@echo "  make ps            - Liste les services"
	@echo "  make certs         - Génère un certificat TLS local"
	@echo "  make db-push       - Synchronise le schema Prisma dans la DB"
	@echo "  make clean         - Stoppe et supprime les conteneurs"
	@echo "  make fclean        - clean + suppression des volumes + images locales"
	@echo "  make prune         - Supprime les images/layers dangling (safe)"
	@echo "  make deep-prune    - Nettoyage Docker agressif (attention)"
	@echo "  make re            - fclean puis up"

env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env créé depuis .env.example"; \
	fi

certs:
	@mkdir -p $(CERT_DIR)
	@if [ ! -f $(CERT_KEY) ] || [ ! -f $(CERT_CRT) ]; then \
		echo "Génération d'un certificat TLS auto-signé (localhost)..."; \
		openssl req -x509 -nodes -days 365 \
			-newkey rsa:2048 \
			-keyout $(CERT_KEY) \
			-out $(CERT_CRT) \
			-subj "/C=FR/ST=IDF/L=Paris/O=Transcendence/CN=localhost" 1>/dev/null 2>&1; \
		echo "Certificat généré dans $(CERT_DIR)/"; \
	fi

up: env certs
	$(DOCKER_COMPOSE) up -d --build
	@echo "Application disponible sur: https://localhost:8443"

down:
	$(DOCKER_COMPOSE) down

restart: down up

logs:
	$(DOCKER_COMPOSE) logs -f --tail=200

ps:
	$(DOCKER_COMPOSE) ps

build:
	$(DOCKER_COMPOSE) build --no-cache

pull:
	$(DOCKER_COMPOSE) pull

backend-logs:
	$(DOCKER_COMPOSE) logs -f --tail=200 backend

frontend-logs:
	$(DOCKER_COMPOSE) logs -f --tail=200 frontend

nginx-logs:
	$(DOCKER_COMPOSE) logs -f --tail=200 nginx

db-logs:
	$(DOCKER_COMPOSE) logs -f --tail=200 db

backend-shell:
	$(DOCKER_COMPOSE) exec backend sh

frontend-shell:
	$(DOCKER_COMPOSE) exec frontend sh

db-shell:
	$(DOCKER_COMPOSE) exec db psql -U user -d transcendence

db-push:
	$(DOCKER_COMPOSE) exec backend npx prisma db push

clean:
	$(DOCKER_COMPOSE) down --remove-orphans

fclean:
	$(DOCKER_COMPOSE) down -v --remove-orphans --rmi local

prune:
	docker image prune -f
	docker builder prune -f

deep-prune:
	docker system prune -af --volumes

re: fclean up

.PHONY: help env up down restart logs ps clean fclean re build pull \
	backend-logs frontend-logs nginx-logs db-logs \
	backend-shell frontend-shell db-shell db-push certs \
	prune deep-prune
