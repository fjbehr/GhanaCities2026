# Deploying Ghana Cities to a Linux server

This guide takes the site from your PC to a public server with its own domain and HTTPS.
It is written for a **Strato Linux VPS** with Ubuntu 24.04, but works on any similar
Ubuntu 24.04 server with root access.

You need about two hours, most of it waiting for installs and uploads.

## How it works

```
Internet ──HTTPS──> Caddy (ports 80/443, automatic certificate)
                      └─> Website, Node/SvelteKit (127.0.0.1:3000)
                            ├─ /geoserver/* → GeoServer (127.0.0.1:8081), read-only map services
                            ├─ /basemap/*   → pmtiles (127.0.0.1:8082), vector basemap
                            └─ database     → PostgreSQL + PostGIS (local only)
```

Only Caddy is reachable from the internet. Everything else listens on the server itself.

**The data is prepared on your PC, not on the server.** The data pipeline (downloads,
OpenStreetMap import, raster processing) needs more memory than a small server has. You run
it on your PC, pack the results into one file and upload that file. Live data (weather, air,
rivers, fires) is fetched by the server itself.

## Which server size

| Strato plan | vCores | RAM  | Disk   | Verdict                                                                                                                                                    |
| ----------- | ------ | ---- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VPS S       | 1      | 2 GB | 60 GB  | **Works with limits**: fine for low traffic. GeoServer gets 768 MB; a 2 GB swap file absorbs peaks. Building the site after an update takes a few minutes. |
| VPS M       | 2      | 4 GB | 120 GB | Comfortable. Set `GEOSERVER_HEAP="1536m"` in `install.sh` before running it.                                                                               |

The site itself needs well under 1 GB of disk. If VPS S turns out too tight (the site gets
slow, or `free -h` shows swap constantly in use), you can upgrade the plan in the Strato
panel without reinstalling.

Strato's plans do not include backups. The setup makes a daily database backup on the
server; copy it off the server from time to time (see [Backups](#backups)).

## 1. Before you start

1. **Order the VPS** and choose **Ubuntu 24.04** as the operating system.
2. **Note the server's IP address** and the root password from the Strato server login.
3. **Point your domain at the server**: in the Strato domain settings, set an **A record**
   for the domain (or a subdomain such as `cities.example.org`) to the server's IP address.
   It can take up to an hour to take effect. Check with `ping your-domain` on your PC.
4. **Create an SSH key** on your PC, if you do not have one yet. In PowerShell:

   ```powershell
   ssh-keygen -t ed25519
   ```

   Press Enter for the default location; choose a passphrase.

5. **Install your key on the server** (PowerShell, replace the IP address):

   ```powershell
   type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@203.0.113.10 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
   ```

   It asks for the root password once. Afterwards `ssh root@203.0.113.10` logs in without it.

If the Strato panel offers its own firewall for the server, allow ports 22, 80 and 443 there.

## 2. Install the server

Log in and download the install script from the repository:

```bash
ssh root@203.0.113.10
curl -fsSLO https://raw.githubusercontent.com/fjbehr/GhanaCities2026/main/deploy/install.sh
bash install.sh --domain cities.example.org --email you@example.org
```

Use your real domain and an e-mail address that Let's Encrypt can send certificate notices
to. The script runs for about 10–20 minutes. It:

- updates the system, enables automatic security updates, a firewall (SSH, HTTP, HTTPS only),
  fail2ban against password guessing and a 2 GB swap file;
- installs Node.js 24, PostgreSQL 18 with PostGIS, Java 21, GeoServer 3.0.1, pmtiles and Caddy;
- creates the user `ghana` and checks out the code to `/opt/ghana-cities`;
- writes `/opt/ghana-cities/.env` with **newly generated passwords** for the database and
  GeoServer (they never leave the server);
- creates the database, systemd services for GeoServer, pmtiles and the website, the HTTPS
  configuration and a daily database backup;
- builds the site and starts everything.

At the end the site is online but empty. That is expected; the data comes next.

The script can be run again safely, e.g. after an error. It keeps existing passwords and data.

## 3. Upload the data

**On your PC** (PowerShell, in the project folder), after the pipeline has run:

```powershell
npm run deploy:export
scp deploy/out/ghana-cities-data.tar.gz root@203.0.113.10:/tmp/
```

The file is about 280 MB: the database, the rasters per city and the basemap.

**On the server:**

```bash
sudo bash /opt/ghana-cities/deploy/import-data.sh /tmp/ghana-cities-data.tar.gz
```

This replaces the database, rasters and basemap, publishes the layers in GeoServer, makes
GeoServer read-only for the public and checks the main pages. The site is offline for about
a minute while it runs. At the end it prints a short status list; every line should read `200`.

Then open `https://your-domain` in a browser.

## 4. After the first start

**Fire layer.** Add your free NASA FIRMS key, then restart the site:

```bash
sudo nano /opt/ghana-cities/.env        # FIRMS_MAP_KEY=…
sudo systemctl restart ghana-cities
```

**GeoServer admin in the browser.** It is off by default. To use it:

```bash
sudo nano /opt/ghana-cities/.env        # GEOSERVER_ADMIN=true
sudo systemctl restart ghana-cities
sudo grep GEOSERVER_PASSWORD /opt/ghana-cities/.env
```

Then log in at `https://your-domain/geoserver/web/` as `admin` with that password. The REST
API (`/geoserver/rest`) is never reachable from outside, also not with this switch.

GeoServer on the server starts with an empty configuration, so it should show only the
workspace `ghana` and none of GeoServer's demo layers. If you see demo workspaces (`ne`,
`nurc`, `sf`, `tiger`, `topp`), delete them under _Workspaces_, after deleting the layer
groups `spearfish`, `tasmania` and `tiger-ny`.

**SSH hardening (recommended).** Once key login works, switch off password login. Keep your
current session open and test a new login in a second window before you close it:

```bash
echo "PasswordAuthentication no" | sudo tee /etc/ssh/sshd_config.d/90-no-passwords.conf
sudo systemctl restart ssh
```

## Everyday tasks

### Update the code

After changes have been pushed to GitHub:

```bash
sudo bash /opt/ghana-cities/deploy/update.sh
```

This pulls the code, rebuilds the site and restarts it. Run it as well after you change
`ORIGIN` in `.env`, because the address is built into the site.

### Update the data

Run the pipeline on your PC (all of it with `npm run pipeline`, or single steps), then repeat
[step 3](#3-upload-the-data). Once a month is a sensible rhythm for rainfall and OpenStreetMap.

### Backups

The server writes a database backup every night to `/var/backups/ghana-cities/` and keeps
14 days. Copy one to your PC now and then (PowerShell):

```powershell
scp "root@203.0.113.10:/var/backups/ghana-cities/*.dump" .
```

To put a backup back (replace the date with the one you want):

```bash
sudo systemctl stop ghana-cities geoserver
sudo -u postgres dropdb ghana_cities
sudo -u postgres createdb --owner=ghana ghana_cities
sudo -u postgres psql -d ghana_cities -c "CREATE EXTENSION postgis; CREATE EXTENSION postgis_raster;"
sudo -u postgres psql -c "ALTER DATABASE ghana_cities SET postgis.gdal_enabled_drivers = 'GTiff PNG';"
sudo -u postgres pg_restore --no-owner --role=ghana --no-comments --no-privileges \
  -d ghana_cities /var/backups/ghana-cities/ghana_cities-2026-10-11.dump
sudo systemctl start geoserver ghana-cities
```

The rasters and the basemap are not in the database backup. They come from your PC with
every data upload, so your PC (and the upload file) is their backup.

### Check status and logs

```bash
systemctl status ghana-cities geoserver pmtiles caddy postgresql
journalctl -u ghana-cities -f          # website log, live (Ctrl+C to stop)
journalctl -u geoserver --since today  # GeoServer log
free -h                                # memory and swap
df -h /                                # disk space
```

Restart a single part with `sudo systemctl restart <name>`, e.g. `geoserver`.

## Troubleshooting

| Symptom                                        | Likely cause                                                     | What to do                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Browser shows a certificate error              | DNS did not point at the server when Caddy started               | Check `ping your-domain`, then `sudo systemctl restart caddy`           |
| Page shows "GeoServer is not reachable (502)"  | GeoServer still starting (takes about a minute) or out of memory | Wait; then `journalctl -u geoserver -n 50`                              |
| Map preview images missing                     | Layers not published                                             | Run `import-data.sh` again                                              |
| Site very slow, `free -h` shows heavy swap use | Server too small for the traffic                                 | Upgrade to VPS M and raise the GeoServer memory                         |
| `npm run build` fails with "out of memory"     | Not enough RAM during the build                                  | `sudo systemctl stop geoserver`, run `update.sh`, start GeoServer again |

## Security summary

- Only ports 22 (SSH), 80 and 443 are open; HTTPS certificates renew automatically.
- GeoServer, the basemap server and the database are not reachable from outside.
- Through the website, GeoServer only answers read-only map requests for the `ghana`
  workspace. Its admin pages need `GEOSERVER_ADMIN=true` and a login; the REST API stays local.
- GeoServer refuses data changes from anyone but its admin (WFS service level "Basic").
- Passwords are generated on the server and stored only in `/opt/ghana-cities/.env`
  (readable by root and the `ghana` user).
- Security updates install automatically; fail2ban blocks repeated failed SSH logins.

## Status of these scripts

The scripts were checked for syntax and the data export was tested on the processing PC.
They have **not yet been run on a real Strato server**. Expect that the first run may need a
small fix; the scripts stop at the first error and can be run again.
