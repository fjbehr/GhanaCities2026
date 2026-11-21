#!/usr/bin/env bash
# Ghana Cities: loads a data bundle made on the processing PC (npm run deploy:export) into
# the server: replaces the database, the rasters and the basemap, then republishes GeoServer.
#
#   sudo bash /opt/ghana-cities/deploy/import-data.sh /tmp/ghana-cities-data.tar.gz
#   sudo bash /opt/ghana-cities/deploy/import-data.sh /tmp/ghana-cities-data.tar.gz --keep-db
#
# --keep-db  leave the database on the server as it is (e.g. loaded by hand) and only
#            replace rasters and basemap and republish GeoServer.
#
# The site is briefly unavailable (about a minute) while the database is replaced.
set -euo pipefail

APP_USER="ghana"
APP_DIR="/opt/ghana-cities"
DB_NAME="ghana_cities"
DB_USER="ghana"
BUNDLE=""
KEEP_DB=false
for arg in "$@"; do
	case "$arg" in
		--keep-db) KEEP_DB=true ;;
		-*) echo "Unknown option: $arg" >&2; exit 2 ;;
		*) BUNDLE="$arg" ;;
	esac
done

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
$KEEP_DB || [ -f "$work/ghana_cities.dump" ] || fail "the bundle contains no ghana_cities.dump"
[ -d "$work/data/derived/rasters" ] || fail "the bundle contains no data/derived/rasters"
[ -f "$work/ghana_cities.dump" ] && chmod 644 "$work/ghana_cities.dump"

step "Stopping the website and GeoServer"
systemctl stop ghana-cities geoserver

if $KEEP_DB; then
	step "Keeping the database on this server; handing its tables to the app role $DB_USER"
	# Data loaded by hand belongs to whoever loaded it; the site and GeoServer log in as $DB_USER.
	# Only objects in this database change owner (PostGIS' own objects stay with postgres).
	pg -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
	pg -d "$DB_NAME" <<SQL
DO \$\$
DECLARE r record;
BEGIN
	FOR r IN
		SELECT c.oid::regclass AS obj,
			CASE c.relkind WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW'
				WHEN 'S' THEN 'SEQUENCE' WHEN 'f' THEN 'FOREIGN TABLE' ELSE 'TABLE' END AS kind
		FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE n.nspname = 'public'
			AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
			AND pg_get_userbyid(c.relowner) <> '$DB_USER'
			-- skip PostGIS' own tables and views
			AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e')
			-- sequences behind serial/identity columns follow their table
			AND NOT (c.relkind = 'S' AND EXISTS (
				SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype IN ('a', 'i')))
		ORDER BY c.relkind = 'S', c.relkind IN ('v', 'm')
	LOOP
		EXECUTE format('ALTER %s %s OWNER TO $DB_USER', r.kind, r.obj);
	END LOOP;
END
\$\$;
SQL
	echo "objects owned by $DB_USER: $(pg -d "$DB_NAME" -c "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND pg_get_userbyid(c.relowner) = '$DB_USER'")"
else
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
	# Caddy sets X-Forwarded-For on every request; the site expects it (ADDRESS_HEADER in .env)
	code=$(curl -s -o /dev/null -w '%{http_code}' -H 'X-Forwarded-For: 127.0.0.1' "http://127.0.0.1:3000$1")
	printf '  %s  %s\n' "$code" "$1"
}
check "/"
check "/city/accra"
check "/api/cities"
check "/geoserver/ghana/wms?service=WMS&request=GetCapabilities"
check "/basemap/ghana.json"
echo
echo "Done. Open $(grep -E '^ORIGIN=' "$APP_DIR/.env" | cut -d= -f2-) in a browser."
