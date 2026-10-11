#!/usr/bin/env bash
# Ghana Cities: one-time server setup for Ubuntu 24.04 (e.g. a Strato Linux VPS).
#
#   sudo bash install.sh --domain example.org --email you@example.org
#
# Installs and configures: firewall, swap, Node.js, PostgreSQL + PostGIS, Java + GeoServer,
# pmtiles, Caddy (HTTPS), the app as systemd services and a daily database backup.
# Safe to re-run: existing passwords in .env and existing data are kept.
# The data itself comes later with import-data.sh (see deploy/README.md).
set -euo pipefail

# ---------------------------------------------------------------------------- settings
REPO_URL="https://github.com/fjbehr/GhanaCities2026.git"
BRANCH="main"
APP_USER="ghana"
APP_DIR="/opt/ghana-cities"
GEOSERVER_VERSION="3.0.1"
GEOSERVER_DIR="/opt/geoserver"
GEOSERVER_DATA="/var/lib/geoserver-data"
PMTILES_VERSION="1.31.2"
NODE_MAJOR="24"
PG_MAJOR="18"
DB_NAME="ghana_cities"
DB_USER="ghana"
BACKUP_DIR="/var/backups/ghana-cities"
# Memory for a 2 GB server; raise GEOSERVER_HEAP to 1536m on a 4 GB server
GEOSERVER_HEAP="768m"
SWAP_SIZE="2G"

DOMAIN=""
EMAIL=""
while [ $# -gt 0 ]; do
	case "$1" in
		--domain) DOMAIN="$2"; shift 2 ;;
		--email) EMAIL="$2"; shift 2 ;;
		--repo) REPO_URL="$2"; shift 2 ;;
		--branch) BRANCH="$2"; shift 2 ;;
		*) echo "Unknown option: $1"; exit 2 ;;
	esac
done

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31mError: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "run as root: sudo bash install.sh --domain … --email …"
[ -n "$DOMAIN" ] || fail "--domain is required (the address the site will have, e.g. ghana-cities.example.org)"
[ -n "$EMAIL" ] || fail "--email is required (Let's Encrypt uses it for certificate notices)"
. /etc/os-release
[ "${ID:-}" = "ubuntu" ] || fail "this script is written for Ubuntu (found: ${PRETTY_NAME:-unknown})"
[ "$(uname -m)" = "x86_64" ] || fail "this script expects an x86_64 server"

as_app() { sudo -u "$APP_USER" -H bash -c "cd '$APP_DIR' && $*"; }
random_secret() { openssl rand -hex 20; }

# ---------------------------------------------------------------------------- 1. base system
step "Updating the system and installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -y -q
apt-get install -y -q ca-certificates curl gnupg git unzip openssl ufw fail2ban \
	unattended-upgrades openjdk-21-jre-headless postgresql-common
systemctl enable --now fail2ban unattended-upgrades

step "Swap file ($SWAP_SIZE) so builds and GeoServer fit into a small server"
if ! swapon --show | grep -q '^/swapfile'; then
	fallocate -l "$SWAP_SIZE" /swapfile
	chmod 600 /swapfile
	mkswap /swapfile
	swapon /swapfile
	grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
	sysctl -w vm.swappiness=10 >/dev/null
	echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
fi

step "Firewall: only SSH, HTTP and HTTPS"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ---------------------------------------------------------------------------- 2. software
step "Node.js $NODE_MAJOR"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" != "$NODE_MAJOR" ]; then
	curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
	apt-get install -y -q nodejs
fi

step "PostgreSQL $PG_MAJOR with PostGIS"
if [ ! -f /etc/apt/sources.list.d/pgdg.sources ] && [ ! -f /etc/apt/sources.list.d/pgdg.list ]; then
	/usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
fi
apt-get install -y -q "postgresql-$PG_MAJOR" "postgresql-$PG_MAJOR-postgis-3"
# Modest memory settings for a 2 GB server
cat > "/etc/postgresql/$PG_MAJOR/main/conf.d/ghana-cities.conf" <<EOF
shared_buffers = 192MB
effective_cache_size = 512MB
work_mem = 8MB
maintenance_work_mem = 64MB
max_connections = 40
EOF
systemctl restart postgresql

step "Caddy (web server with automatic HTTPS)"
if ! command -v caddy >/dev/null; then
	curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
		| gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
	curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
		> /etc/apt/sources.list.d/caddy-stable.list
	apt-get update -q
	apt-get install -y -q caddy
fi

step "pmtiles $PMTILES_VERSION"
if ! /usr/local/bin/pmtiles version 2>/dev/null | grep -q "$PMTILES_VERSION"; then
	tmp=$(mktemp -d)
	curl -fsSL -o "$tmp/pmtiles.tar.gz" \
		"https://github.com/protomaps/go-pmtiles/releases/download/v${PMTILES_VERSION}/go-pmtiles_${PMTILES_VERSION}_Linux_x86_64.tar.gz"
	tar -xzf "$tmp/pmtiles.tar.gz" -C "$tmp"
	install -m 755 "$tmp/pmtiles" /usr/local/bin/pmtiles
	rm -rf "$tmp"
fi

# ---------------------------------------------------------------------------- 3. app user and code
step "App user '$APP_USER' and code in $APP_DIR"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --no-create-home --home-dir "$APP_DIR" --shell /bin/bash "$APP_USER"
if [ ! -d "$APP_DIR/.git" ]; then
	git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
	chown -R "$APP_USER:$APP_USER" "$APP_DIR"
else
	as_app "git pull --ff-only"
fi

step "Configuration file .env (passwords are generated once and stay on this server)"
ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
	DB_PASSWORD=$(random_secret)
	GEOSERVER_PASSWORD=$(random_secret)
	cat > "$ENV_FILE" <<EOF
# Generated by deploy/install.sh on $(date -I). Keep this file private.
DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

GEOSERVER_URL=http://localhost:8081/geoserver
GEOSERVER_USER=admin
GEOSERVER_PASSWORD=$GEOSERVER_PASSWORD
# true: GeoServer admin (with login) at https://$DOMAIN/geoserver/web/
GEOSERVER_ADMIN=false

BASEMAP_URL=http://localhost:8082

# Free key from https://firms.modaps.eosdis.nasa.gov/api/map_key/ (optional)
FIRMS_MAP_KEY=

# Public address; read when building. Rebuild after changing it (deploy/update.sh).
ORIGIN=https://$DOMAIN

# The site listens on this machine only; Caddy forwards from HTTPS
HOST=127.0.0.1
PORT=3000
ADDRESS_HEADER=X-Forwarded-For
XFF_DEPTH=1
EOF
	chown "$APP_USER:$APP_USER" "$ENV_FILE"
	chmod 600 "$ENV_FILE"
fi
env_value() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2-; }
DB_PASSWORD=$(env_value DATABASE_URL | sed -E 's#^postgres://[^:]+:([^@]+)@.*#\1#')

# ---------------------------------------------------------------------------- 4. database
step "Database $DB_NAME and role $DB_USER"
pg() { sudo -u postgres psql -v ON_ERROR_STOP=1 -qtA "$@"; }
if [ "$(pg -c "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'")" = "1" ]; then
	pg -v pw="$DB_PASSWORD" <<< "ALTER ROLE $DB_USER LOGIN PASSWORD :'pw';"
else
	pg -v pw="$DB_PASSWORD" <<< "CREATE ROLE $DB_USER LOGIN PASSWORD :'pw';"
fi
if [ "$(pg -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'")" != "1" ]; then
	sudo -u postgres createdb --owner="$DB_USER" --encoding=UTF8 "$DB_NAME"
fi
pg -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS postgis_raster;"
pg -c "ALTER DATABASE $DB_NAME SET postgis.gdal_enabled_drivers = 'GTiff PNG';"

# ---------------------------------------------------------------------------- 5. GeoServer
step "GeoServer $GEOSERVER_VERSION"
if [ ! -f "$GEOSERVER_DIR/VERSION.txt" ] || ! grep -q "version = $GEOSERVER_VERSION" "$GEOSERVER_DIR/VERSION.txt"; then
	tmp=$(mktemp -d)
	curl -fsSL -o "$tmp/geoserver.zip" \
		"https://sourceforge.net/projects/geoserver/files/GeoServer/${GEOSERVER_VERSION}/geoserver-${GEOSERVER_VERSION}-bin.zip/download"
	rm -rf "$GEOSERVER_DIR"
	mkdir -p "$GEOSERVER_DIR"
	unzip -q "$tmp/geoserver.zip" -d "$GEOSERVER_DIR"
	rm -rf "$tmp"
	# Some releases unpack into a sub-folder; move its content up
	if [ ! -f "$GEOSERVER_DIR/VERSION.txt" ] && [ "$(ls -A "$GEOSERVER_DIR" | wc -l)" = "1" ]; then
		sub="$GEOSERVER_DIR/$(ls -A "$GEOSERVER_DIR")"
		shopt -s dotglob
		mv "$sub"/* "$GEOSERVER_DIR"/
		shopt -u dotglob
		rmdir "$sub"
	fi
	[ -f "$GEOSERVER_DIR/VERSION.txt" ] || fail "GeoServer archive has an unexpected layout"
	chmod +x "$GEOSERVER_DIR"/bin/*.sh
fi
# An empty data directory makes GeoServer start without its bundled demo layers
mkdir -p "$GEOSERVER_DATA"
chown -R "$APP_USER:$APP_USER" "$GEOSERVER_DIR" "$GEOSERVER_DATA"

# ---------------------------------------------------------------------------- 6. services
step "systemd services"
cat > /etc/systemd/system/geoserver.service <<EOF
[Unit]
Description=GeoServer (Ghana Cities OGC services)
After=network.target postgresql.service

[Service]
User=$APP_USER
Environment=GEOSERVER_HOME=$GEOSERVER_DIR
Environment=GEOSERVER_DATA_DIR=$GEOSERVER_DATA
Environment="JAVA_OPTS=-Xms256m -Xmx$GEOSERVER_HEAP -XX:+UseSerialGC"
# Listen on this machine only; the public reaches it through the site's /geoserver proxy
Environment="JETTY_OPTS=jetty.http.host=127.0.0.1 jetty.http.port=8081"
ExecStart=$GEOSERVER_DIR/bin/startup.sh
Restart=on-failure
TimeoutStartSec=180

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/pmtiles.service <<EOF
[Unit]
Description=pmtiles vector tile server (Ghana Cities basemap)
After=network.target

[Service]
User=$APP_USER
ExecStart=/usr/local/bin/pmtiles serve $APP_DIR/data/derived/basemap --port=8082 --interface=127.0.0.1 --public-url=https://$DOMAIN/basemap
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/ghana-cities.service <<EOF
[Unit]
Description=Ghana Cities website (SvelteKit / Node)
After=network.target postgresql.service geoserver.service pmtiles.service

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node --env-file=.env build
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

step "Caddy: HTTPS for $DOMAIN"
cat > /etc/caddy/Caddyfile <<EOF
{
	email $EMAIL
}

$DOMAIN {
	reverse_proxy 127.0.0.1:3000
	header Strict-Transport-Security "max-age=31536000"
}
EOF

step "Daily database backup (kept 14 days in $BACKUP_DIR)"
mkdir -p "$BACKUP_DIR"
chown postgres:postgres "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
cat > /usr/local/sbin/ghana-cities-backup <<EOF
#!/usr/bin/env bash
set -euo pipefail
sudo -u postgres pg_dump -Fc -f "$BACKUP_DIR/$DB_NAME-\$(date +%F).dump" "$DB_NAME"
find "$BACKUP_DIR" -name '*.dump' -mtime +14 -delete
EOF
chmod 755 /usr/local/sbin/ghana-cities-backup
cat > /etc/systemd/system/ghana-cities-backup.service <<EOF
[Unit]
Description=Ghana Cities database backup

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/ghana-cities-backup
EOF
cat > /etc/systemd/system/ghana-cities-backup.timer <<EOF
[Unit]
Description=Daily Ghana Cities database backup

[Timer]
OnCalendar=*-*-* 03:30
Persistent=true

[Install]
WantedBy=timers.target
EOF

# ---------------------------------------------------------------------------- 7. build and start
step "Installing packages and building the site (takes a few minutes)"
as_app "npm ci --no-audit --no-fund"
as_app "npm run portal"
as_app "npm run build"

step "Starting services"
systemctl daemon-reload
systemctl enable --now postgresql geoserver pmtiles ghana-cities ghana-cities-backup.timer
systemctl restart caddy

step "Done"
cat <<EOF

The server is set up. The site has no data yet. Next steps (see deploy/README.md):
  1. On your PC:     npm run deploy:export
  2. Copy the file:  scp deploy/out/ghana-cities-data.tar.gz <user>@$DOMAIN:/tmp/
  3. On the server:  sudo bash $APP_DIR/deploy/import-data.sh /tmp/ghana-cities-data.tar.gz

Passwords are in $ENV_FILE (readable by root and $APP_USER only).
EOF
