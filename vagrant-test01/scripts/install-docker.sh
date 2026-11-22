#!/bin/bash
# Installation de Docker Engine sur Ubuntu 22.04 (méthode officielle : https://docs.docker.com/engine/install/ubuntu/)
# Ce script est lancé automatiquement par Vagrant (provisioning) avec les droits root.
set -e

# Si Docker est déjà installé, on ne refait pas tout
if command -v docker >/dev/null 2>&1; then
  echo ">>> Docker est déjà installé : $(docker --version)"
  exit 0
fi

echo ">>> 1. Installation des prérequis"
apt-get update
apt-get install -y ca-certificates curl

echo ">>> 2. Ajout de la clé GPG officielle de Docker"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo ">>> 3. Ajout du dépôt Docker aux sources APT"
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update

echo ">>> 4. Installation de Docker Engine, CLI, containerd, buildx et compose"
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo ">>> 5. Autoriser l'utilisateur vagrant à utiliser docker sans sudo"
usermod -aG docker vagrant

echo ">>> 6. Démarrage de Docker au boot"
systemctl enable --now docker

echo ">>> Docker installé : $(docker --version)"
