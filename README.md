# Prowlarr qBittorrent Web Interface v4.0.0

![Interface Screenshot](https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=1200&auto=format&fit=crop)

Une interface web moderne et élégante pour gérer vos recherches Prowlarr et téléchargements qBittorrent.

## 🚀 Fonctionnalités

- 🔍 Recherche unifiée dans tous vos indexers Prowlarr
  - Filtrage par catégorie (Films, Séries, Anime, etc.)
  - Sous-catégories pour les films et séries (SD, HD, UHD, BluRay)
  - Tri avancé par nom, taille, sources ou pairs
- 🎬 Intégration TMDB
  - Affichage des posters de films et séries
  - Lien direct vers la page TMDB
  - Recherche automatique des métadonnées
- 📥 Intégration qBittorrent
  - Téléchargement direct vers qBittorrent
  - Configuration par utilisateur
  - Support de l'authentification qBittorrent
- 🎨 Interface moderne
  - Design responsive et adaptatif
  - Thème sombre élégant
  - Composants réutilisables avec Tailwind CSS
- 👥 Gestion multi-utilisateurs
  - Rôles admin/utilisateur
  - Configuration personnalisée par utilisateur
  - Paramètres qBittorrent individuels
- 🔒 Sécurité
  - Authentification JWT
  - Mots de passe hashés avec bcrypt
  - Protection des routes par rôle
- 🗃️ Base de données
  - SQLite persistante
  - Migrations automatiques
  - Sauvegarde des configurations

## 📋 Installation avec Docker

### Prérequis
- Docker et Docker Compose installés sur votre système
- Un serveur Linux (recommandé) ou Windows avec Docker

### Installation rapide

1. Créez un nouveau dossier pour le projet :
```bash
mkdir prowlarr-search && cd prowlarr-search
```

2. Créez le fichier `docker-compose.yml` :
```yaml
version: '3'
services:
  prowlarr-search:
    image: ppo852/prowlarr-search:v4
    container_name: prowlarr-search
    ports:
      - "80:80"  # L'application sera accessible sur le port 80
    volumes:
      - ./data:/app/data  # Stockage persistant pour la base SQLite
    environment:
      - PUID=1000  # Remplacez par votre User ID
      - PGID=1000  # Remplacez par votre Group ID
      - JWT_SECRET=votre_secret_jwt  # Changez ceci !
    restart: unless-stopped
```

3. Créez le dossier pour les données persistantes :
```bash
mkdir data
chmod 777 data  # Assurez-vous que Docker peut écrire dans ce dossier
```

4. Lancez l'application :
```bash
docker-compose up -d
```

### 🔐 Première connexion

1. Accédez à `http://votre-ip`
2. Connectez-vous avec les identifiants par défaut :
   - Utilisateur : `admin`
   - Mot de passe : `admin`
3. **IMPORTANT** : Changez immédiatement le mot de passe administrateur !

## ⚙️ Configuration

### Configuration initiale (Admin)

Dans les paramètres d'administration, configurez :
1. L'URL et la clé API Prowlarr
2. Le token d'accès TMDB (pour les métadonnées)
3. Le nombre minimum de sources
4. Créez les comptes utilisateurs

### Configuration utilisateur

Chaque utilisateur peut configurer :
- Son URL qBittorrent
- Ses identifiants qBittorrent
- Son mot de passe personnel

## 🔄 Mise à jour

Pour mettre à jour vers la dernière version :

```bash
docker-compose pull
docker-compose up -d
```

## 💾 Sauvegarde

### Sauvegarde automatique

Le dossier `./data` contient la base de données SQLite. Sauvegardez-le régulièrement :

```bash
# Exemple de script de backup
tar -czf backup-$(date +%Y%m%d).tar.gz ./data
```

### Restauration

Pour restaurer une sauvegarde :

1. Arrêtez le conteneur :
```bash
docker-compose down
```

2. Remplacez le dossier data :
```bash
rm -rf ./data
tar -xzf votre-backup.tar.gz
```

3. Redémarrez :
```bash
docker-compose up -d
```

## 🔒 Sécurité

- Authentification JWT sécurisée
- Base de données SQLite chiffrée
- Mots de passe hashés avec bcrypt
- Support HTTPS recommandé (utilisez un reverse proxy)

### Configuration HTTPS (recommandé)

Utilisez un reverse proxy comme Traefik ou Nginx pour gérer HTTPS :

```yaml
# Exemple avec Traefik
version: '3'
services:
  prowlarr-search:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.prowlarr.rule=Host(`search.votredomaine.com`)"
      - "traefik.http.routers.prowlarr.tls=true"
      - "traefik.http.routers.prowlarr.tls.certresolver=letsencrypt"
```

## 🐛 Résolution des problèmes

1. Problèmes de permissions :
```bash
# Vérifiez les permissions du dossier data
ls -la ./data
# Ajustez si nécessaire
chown -R 1000:1000 ./data
```

2. Logs du conteneur :
```bash
# Voir les logs en temps réel
docker-compose logs -f
```

3. Base de données corrompue :
```bash
# Sauvegardez d'abord !
cp ./data/database.sqlite ./data/database.backup.sqlite
# Réparez la base
sqlite3 ./data/database.sqlite "VACUUM;"
```

## 📝 License

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [Prowlarr](https://github.com/Prowlarr/Prowlarr)
- [qBittorrent](https://github.com/qbittorrent/qBittorrent)
- [TMDB](https://www.themoviedb.org/) pour leur API
- [React](https://reactjs.org/) pour le framework frontend
- [Tailwind CSS](https://tailwindcss.com/) pour le système de design
- [Lucide Icons](https://lucide.dev/) pour les icônes