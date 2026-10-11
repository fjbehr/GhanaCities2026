#!/usr/bin/env bash
# Ghana Cities: loads a data bundle made on the processing PC (npm run deploy:export) into
# the server: replaces the database, the rasters and the basemap, then republishes GeoServer.
#
#   sudo bash /opt/ghana-cities/deploy/import-data.sh /tmp/ghana-cities-data.tar.gz
#
# The site is briefly unavailable (about a minute) while the database is replaced.
set -euo pipefail

APP_USER="ghana"
APP_DIR="/opt/ghana-cities"
DB_NAME="ghana_cities"
DB_USER="ghana"
BUNDLE="${1:-}"

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31mError: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "run as root: sudo bash import-data.sh <bundle.tar.gz>"
[ -f "$BUNDLE" ] || fail "bundle not found: ${BUNDLE:-<none given>}"
as_app() { sudo -u "$APP_USER" -H bash -c "cd '$APP_DIR' && $*"; }
pg() { sudo -u postgres psql -v ON_ERROR_STOP=1 -qtA "$@"; }

step "Unpacking $BUNDLE"
work=$(mktemp -d)
chmod 755 "$work" # postgres must be able to read the dump
trap 'rm -rf "$work"' EXIT
tar -xzf "$BUNDLE" -C "$work"
[ -f "$work/ghana_cities.dump" ] || fail "the bundle contains no ghana_cities.dump"
[ -d "$work/data/derived/rasters" ] || fail "the bundle contains no data/derived/rasters"
chmod 644 "$work/ghana_cities.dump"

step "Stopping the website and GeoServer"
systemctl stop ghana-cities geoserver

step "Replacing the database"
pg -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" >/dev/null
sudo -u postgres dropdb --if-exists "$DB_NAME"
sudo -u postgres createdb --owner="$DB_USER" --encoding=UTF8 "$DB_NAME"
pg -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS postgis_raster;"
pg -c "ALTER DATABASE $DB_NAME SET postgis.gdal_enabled_drivers = 'GTiff PNG';"
# Objects are created as the app role; extension comments belong to postgres and are skipped
if ! sudo -u postgres pg_restore --no-owner --role="$DB_USER" --no-comments --no-privileges \
	-d "$DB_NAME" "$work/ghana_cities.dump"; then
	echo "pg_restore reported warnings; checking the result …"
fi
rows=$(pg -d "$DB_NAME" -c "SELECT count(*) FROM indicator" 2>/dev/null || echo 0)
[ "${rows:-0}" -gt 0 ] || fail "the database has no indicators after the restore"
echo "indicators: $rows"

step "Replacing rasters and basemap"
mkdir -p "$APP_DIR/data/derived"
for part in rasters basemap; do
	if [ -d "$work/data/derived/$part" ]; then
		rm -rf "$APP_DIR/data/derived/$part"
		mv "$work/data/derived/$part" "$APP_DIR/data/derived/$part"
	fi
done
chown -R "$APP_USER:$APP_USER" "$APP_DIR/data"

step "Starting GeoServer and publishing the layers"
systemctl start geoserver
for _ in $(seq 1 60); do
	curl -sf -o /dev/null "http://127.0.0.1:8081/geoserver/web/" && break
	sleep 3
done
curl -sf -o /dev/null "http://127.0.0.1:8081/geoserver/web/" || fail "GeoServer did not start (journalctl -u geoserver)"
# Publishes the workspace and makes GeoServer read-only for the public (07 + 07b)
as_app "npm run pipeline:geoserver"

step "Restarting the basemap server and the website"
systemctl restart pmtiles
systemctl start ghana-cities
sleep 3

step "Checking"
check() {
	code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000$1")
	printf '  %s  %s\n' "$code" "$1"
}
check "/"
check "/city/accra"
check "/api/cities"
check "/geoserver/ghana/wms?service=WMS&request=GetCapabilities"
check "/basemap/ghana.json"
echo
echo "Done. Open https://$(grep -E '^ORIGIN=' "$APP_DIR/.env" | cut -d/ -f3) in a browser."
