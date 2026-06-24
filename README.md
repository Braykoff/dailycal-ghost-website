# Daily Cal Ghost Theme
This repo is a self-contained sandbox for building and previewing the Daily Cal's custom Ghost theme. The theme itself exists in the [theme](./theme/) directory; the surrounding setup exists to run it locally so changes can be tested in a Ghost instance before shipping them to the [actual site](https://dailycal.org).

Docker is configured to run the official `ghost:6` image. The `theme/` folder is bind-mounted into the container at `content/themes/dc-theme`, which Ghost renders. Site data, mainly the SQLite database containing some example articles, exists in `content/`.

Ghost renders bundles in `theme/assets/built/`, which are compiled from raw CSS/JS in the theme. `TODO` more information on compiling these with pnpm, and steps below for installing npm and building changes.

## Running locally

1. Start Ghost:
   ```bash
   docker compose up -d
   ```
2. Open the site at http://localhost:2368 and the admin at http://localhost:2368/ghost

## Refreshing after theme changes

1. Ghost compiles the theme at boot and serves the compiled assets in `theme/assets/built/`. If you've edited source CSS/JS files, these bundles must be recompiled before restarting Ghost, which requires Node and pnpm:

```bash
cd theme
pnpm install
pnpm build
```

2. Restart the ghost instace by running:

```bash
docker compose restart ghost
```

3. Hard refresh in the browser (Cmd+Shift+R) to forget cached assets.

## Stopping Ghost

Stop the container but keep it around (fastest to start again):

```bash
docker compose stop
```

Or stop and remove the container and network entirely:

```bash
docker compose down
```

Either way, site data is stored in the `content/` directory, so it will still exist if you restart Ghost later.

## Admin login (local, throwaway)

This is a shared local-only account baked into the committed database. They can be used to log into the local admin panel. Do not reuse these credentials anywhere real.

- **Full name:** `Admin`
- **Email address:** `admin@example.com`
- **Password:** `bogusAdminP@ssw0rd`
