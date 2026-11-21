#!/usr/bin/env bash
# Ghana Cities: brings the server to the newest code on GitHub and rebuilds the site.
#
#   sudo bash /opt/ghana-cities/deploy/update.sh                                  # from GitHub
#   sudo bash /opt/ghana-cities/deploy/update.sh /tmp/ghana-cities-code.tar.gz    # from a tarball
#
# Data is not touched; for new data use import-data.sh.
set -euo pipefail

APP_USER="ghana"
APP_DIR="/opt/ghana-cities"
SOURCE="${1:-}"

[ "$(id -u)" -eq 0 ] || { echo "run as root: sudo bash update.sh" >&2; exit 1; }
as_app() { sudo -u "$APP_USER" -H bash -c "cd '$APP_DIR' && $*"; }

if [ -n "$SOURCE" ]; then
	[ -f "$SOURCE" ] || { echo "code tarball not found: $SOURCE" >&2; exit 1; }
	echo "==> Unpacking the code from $SOURCE"
	tar -xzf "$SOURCE" -C "$APP_DIR"
	chown -R "$APP_USER:$APP_USER" "$APP_DIR"
else
	echo "==> Fetching the newest code"
	as_app "git pull --ff-only"
fi
echo "==> Installing packages and building"
as_app "npm ci --no-audit --no-fund"
as_app "npm run portal"
as_app "npm run build"
echo "==> Restarting the website"
systemctl restart ghana-cities
sleep 3
curl -s -o /dev/null -w '  %{http_code}  /\n' -H 'X-Forwarded-For: 127.0.0.1' http://127.0.0.1:3000/
echo "Done."
