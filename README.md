# TP Vagrant : VM Ubuntu 22.04 (jammy) avec VirtualBox ✅

**État : ça marche.** La VM `ubuntu-jammy` démarre avec `vagrant up`, et `vagrant ssh` permet de s'y connecter.

## Utilisation au quotidien (dans PowerShell)

```powershell
cd "C:\Users\Lenovo\Pictures\drive\OneDrive\Documents\Vagrant\vagrant-test01"
vagrant up       # démarre la VM (environ 1 minute)
vagrant ssh      # ouvre un terminal dans la VM
```

Dans la VM, les commandes montrées au tableau :

```bash
uname        # -> Linux
whoami       # -> vagrant
hostname     # -> ubuntu-jammy
df -h        # espace disque ; /vagrant = le dossier vagrant-test01 partagé avec Windows
exit         # revenir sur Windows
```

De retour sur Windows :

```powershell
vagrant halt     # éteindre la VM
```

Résultat obtenu lors du test :

```
Linux
vagrant
ubuntu-jammy
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        39G  1.7G   38G   5% /
vagrant         477G  428G   50G  90% /vagrant
...
```

## 🐳 Partie 2 : Docker dans la VM ✅

**Objectif :** installer Docker dans la VM Vagrant, puis créer une image Docker et la lancer.

### Organisation des fichiers

```
vagrant-test01/
├── Vagrantfile               ← la VM + la redirection du port 8080 + le provisioning Docker
├── scripts/
│   └── install-docker.sh     ← installe Docker (méthode officielle), lancé automatiquement par Vagrant
└── app/
    ├── Dockerfile            ← la recette de l'image Docker (nginx + notre page)
    └── index.html            ← la page web copiée dans l'image
```

### Étape 1 : installer Docker automatiquement (provisioning)

Ces lignes ont été ajoutées au `Vagrantfile` :

```ruby
  config.vm.network "forwarded_port", guest: 8080, host: 8080
  config.vm.provision "docker-install", type: "shell", path: "scripts/install-docker.sh"
```

Ensuite, on lance (ou `vagrant reload --provision` si la VM est déjà allumée) :

```powershell
vagrant up --provision
```

Le script installe Docker et ajoute l'utilisateur `vagrant` au groupe `docker`, ce qui permet d'utiliser docker sans `sudo`.
Résultat : `Docker version 29.9.3`.

### Étape 2 : créer l'image et lancer le conteneur (dans la VM)

```bash
vagrant ssh
cd /vagrant/app                       # le dossier app/ de Windows, vu depuis la VM
docker build -t gilles-parfait/mon-site:1.0 .   # construit l'image version 1.0 à partir du Dockerfile
docker images                         # l'image gilles-parfait/mon-site:1.0 apparaît
docker run -d --name site-gilles-parfait -p 8080:80 gilles-parfait/mon-site:1.0   # lance un conteneur à partir de l'image
docker ps                             # le conteneur "site-gilles-parfait" est "Up"
curl localhost:8080                   # la page HTML s'affiche
```

Explication de `docker run` :
- `-d` : le conteneur tourne en arrière-plan.
- `--name site-gilles-parfait` : le nom du conteneur.
- `-p 8080:80` : le port 8080 de la VM est redirigé vers le port 80 du conteneur.

### Personnalisation au nom de Gilles Parfait

- **Nom de l'image :** `gilles-parfait/mon-site:1.0`. Docker exige des minuscules et aucun espace, d'où le tiret.
  La forme `auteur/nom:version` est la convention de Docker Hub.
- **Nom du conteneur :** `site-gilles-parfait`.
- **Auteur dans l'image** (`LABEL maintainer="Gilles Parfait"` dans le Dockerfile). Pour le vérifier :
  ```bash
  docker inspect -f '{{json .Config.Labels}}' gilles-parfait/mon-site:1.0
  ```
- **Sur la page web :** « Réalisé par Gilles Parfait ».

### Étape 3 : voir le résultat depuis Windows

Ouvre **http://localhost:8080** dans le navigateur. Tu dois voir « 🐳 Ça marche ! »

Chemin parcouru par la requête :
**Windows** `localhost:8080` → (Vagrant `forwarded_port`) → **VM** `:8080` → (Docker `-p 8080:80`) → **conteneur nginx** `:80`

### Commandes Docker utiles

| Commande | Ce qu'elle fait |
|---|---|
| `docker --version` | version de Docker |
| `docker images` | liste des images |
| `docker ps` / `docker ps -a` | conteneurs qui tournent / tous les conteneurs |
| `docker build -t nom:tag .` | construire une image depuis le Dockerfile du dossier courant |
| `docker run -d -p 8080:80 --name x image` | lancer un conteneur |
| `docker logs site-gilles-parfait` | voir les journaux du conteneur |
| `docker exec -it site-gilles-parfait sh` | ouvrir un terminal dans le conteneur |
| `docker stop site-gilles-parfait` / `docker start site-gilles-parfait` | arrêter / redémarrer le conteneur |
| `docker rm -f site-gilles-parfait` | supprimer le conteneur |
| `docker rmi gilles-parfait/mon-site:1.0` | supprimer l'image |

**Modifier le site :** édite `app/index.html` sous Windows, puis dans la VM :
```bash
cd /vagrant/app
docker build -t gilles-parfait/mon-site:1.1 .
docker rm -f site-gilles-parfait
docker run -d --name site-gilles-parfait -p 8080:80 gilles-parfait/mon-site:1.1
```

> Le conteneur a été lancé avec `--restart unless-stopped` : il redémarre tout seul quand la VM redémarre.

## Le Vagrantfile (`vagrant-test01/Vagrantfile`)

```ruby
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  config.vm.box_version = "20241002.0.0"

  # Configure the hostname
  config.vm.hostname = "ubuntu-jammy"

  # configuration du provider virtualbox
  config.vm.provider "virtualbox" do |vb|
    vb.name = "ubuntu-jammy"
    vb.memory = "2048"
    vb.cpus = 2
  end

  # Redirection de port : Windows localhost:8080 -> VM port 8080 (où tournera le conteneur Docker)
  config.vm.network "forwarded_port", guest: 8080, host: 8080

  # Provisioning : installation automatique de Docker dans la VM
  config.vm.provision "docker-install", type: "shell", path: "scripts/install-docker.sh"
end
```

Ce que fait chaque ligne :
- `config.vm.box` : l'image de base, ici Ubuntu 22.04 « jammy ».
- `box_version` : la version exacte de cette image.
- `hostname` : le nom de la machine dans la VM.
- `vb.name` : le nom de la VM dans VirtualBox.
- `vb.memory` et `vb.cpus` : la mémoire (2 Go) et le nombre de processeurs (2) donnés à la VM.

## Commandes Vagrant utiles

| Commande           | Ce qu'elle fait                                          |
|--------------------|----------------------------------------------------------|
| `vagrant up`       | crée (si besoin) et démarre la VM                        |
| `vagrant ssh`      | ouvre un terminal dans la VM                             |
| `vagrant status`   | affiche l'état de la VM (running, poweroff…)             |
| `vagrant halt`     | éteint la VM proprement                                  |
| `vagrant reload`   | redémarre la VM (après une modification du Vagrantfile)  |
| `vagrant suspend`  | met la VM en pause                                       |
| `vagrant destroy`  | supprime la VM (le Vagrantfile, lui, est conservé)       |
| `vagrant box list` | liste les images téléchargées                            |

## Ce qui a été fait pour que ça marche (historique)

1. **Ancien Vagrant cassé** : il était enregistré comme installé, mais son dossier avait disparu.
   Il a été désinstallé, puis Vagrant **2.4.9** a été réinstallé avec
   `winget install --id Hashicorp.Vagrant -e`. VirtualBox **7.2.8** était déjà installé.
2. **Problème DNS** : la box internet n'arrivait pas à trouver `vagrantcloud.com`.
   Contournement utilisé : `$env:VAGRANT_SERVER_URL = "https://app.vagrantup.com"` avant de lancer `vagrant up`.
   Ce réglage n'est utile que pour **télécharger** une nouvelle box. La box Ubuntu est déjà téléchargée, donc ce n'est plus nécessaire pour celle-ci.
3. **Coupure du téléchargement** à 88 % : la commande a été relancée et Vagrant a repris là où il s'était arrêté.
4. **6 VM fantômes dans VirtualBox** (`ohhh`, `Warm`, `senoir`, `giles`, `cisco`, `Cybersecurity… 1`),
   dont les fichiers n'existaient plus et qui faisaient planter Vagrant (`E_ACCESSDENIED`).
   Elles ont été retirées de la liste avec `VBoxManage unregistervm`.
5. **Hyper-V actif**, à cause de Docker Desktop / WSL2 : VirtualBox fonctionnait par-dessus Hyper-V et Ubuntu se figeait au démarrage.
   Désactivé en administrateur avec `bcdedit /set hypervisorlaunchtype off`, puis redémarrage du PC.
6. **VM abîmée par le démarrage figé** : la carte réseau n'était pas configurée, donc pas de SSH.
   La VM a été recréée avec `vagrant destroy -f` puis `vagrant up` → « Machine booted and ready! » ✅

## ⚠️ À savoir

- **Docker Desktop et WSL2 ne marchent plus** tant qu'Hyper-V est désactivé.
  Pour les réactiver (VirtualBox redeviendra alors lent ou bloqué), lance en administrateur :
  `bcdedit /set hypervisorlaunchtype auto`, puis redémarre.
  Pour revenir à VirtualBox : `bcdedit /set hypervisorlaunchtype off`, puis redémarre.
- Le message « guest additions do not match » au démarrage est sans gravité : le dossier partagé `/vagrant` fonctionne.
- **`vagrant` n'est pas reconnu dans un terminal ?** Ferme puis rouvre le terminal, pour recharger le PATH.

## ðŸš€ Partie 3 : site web + CI/CD (GitHub Actions) + Docker Hub

### Ce qui a changÃ©
- `vagrant-test01/app/` contient maintenant une vraie petite application **Node.js** (`server.js`, sans dÃ©pendance) avec une page (`public/index.html`), `/health` et `/api/info`.
- **Tests automatiques** : `test/server.test.js` (lancÃ©s par `npm test`).
- **Workflow** `.github/workflows/ci-cd.yml`, dÃ©clenchÃ© Ã  chaque `git push` sur `main` :
  1. **CI** : lance les tests ;
  2. **CD** : si les tests passent, construit l'image et la pousse sur Docker Hub (`:latest` et `:<commit>`) ;
  3. **Smoke test** : tÃ©lÃ©charge l'image publiÃ©e depuis Docker Hub, la lance et vÃ©rifie qu'elle rÃ©pond.

### Mise en place (une seule fois)
1. CrÃ©er un compte sur hub.docker.com et un **Access Token** (Account settings â†’ Security).
2. CrÃ©er un dÃ©pÃ´t GitHub public, puis dans *Settings â†’ Secrets and variables â†’ Actions* ajouter :
   - `DOCKERHUB_USERNAME` : ton identifiant Docker Hub
   - `DOCKERHUB_TOKEN` : le token
3. Pousser le code :
   ```powershell
   cd "C:\Users\Lenovo\Pictures\drive\OneDrive\Documents\Vagrant"
   git init -b main
   git add .
   git commit -m "TP Vagrant Docker CI/CD"
   git remote add origin https://github.com/<ton-user>/<ton-depot>.git
   git push -u origin main
   ```
4. Onglet **Actions** de GitHub : le pipeline se lance tout seul. Ensuite, chaque modification poussÃ©e relance CI + CD.

### Tester dans la VM
```bash
vagrant ssh
cd /vagrant/app
docker build -t mon-site . && docker run -d --name site -p 8080:3000 mon-site
curl localhost:8080
```
(les ports : Windows 8080 â†’ VM 8080 â†’ conteneur 3000)

### Pour le prof : tester l'application sur son ordinateur
Il suffit d'avoir Docker, puis :
```bash
docker run -d -p 8080:3000 --name site kinggilles/mon-site:latest
```
Puis ouvrir http://localhost:8080. Il rÃ©cupÃ¨re toujours la derniÃ¨re version publiÃ©e par le pipeline.
