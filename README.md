# Daily Cal Ghost Theme
This repo is a self-contained sandbox for building and previewing the Daily Cal's custom Ghost theme. The theme itself exists in the `./theme` directory; the surrounding setup exists to run it locally so changes can be tested in a Ghost instance before shipping them to the [actual site](https://dailycal.org).

Docker is configured to run the official `ghost:6` image. The `theme/` folder is bind-mounted into the container at `content/themes/dc-theme`, which Ghost renders. Site data, mainly the SQLite database containing some example articles, exists in `content/`.

The theme's styles (Sass) and scripts (JS) are generated from source files, so they need to be compiled before Ghost can render the site correctly. After cloning or editing those sources, run a build so the theme has the finished assets it expects.

## Running locally

1. Install node packages and compile source files:
```bash
cd theme
npm install
npm run build
cd ..
```

2. Start Ghost (`-d` will run as a daemon):
```bash
docker compose up -d
```

3. Open the site at http://localhost:2368 and the admin at http://localhost:2368/ghost

## Refreshing after theme changes

1. If you've edited any of the source SCSS/JS files, you need to recompile the theme before restarting ghost:
```bash
cd theme
npm run build
cd ..
```

2. Restart the ghost instance:

```bash
docker compose restart ghost
```

3. Hard refresh in the browser (`Cmd+Shift+R` or `Ctrl+Shift+R`) to forget cached assets.

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

This is a shared local-only account baked into the committed database. These credentials can be used to log into the local admin panel. Do not reuse them anywhere real.

- **Full name:** `Admin`
- **Email address:** `admin@example.com`
- **Password:** `bogusAdminP@ssw0rd`

## Documentation

For documentation relating to the stock Tripoli theme are available [here](https://aspirethemes.com/docs/tripoli). For documentation on the DC-specific modifications (which may supersede the Tripoli documentation), see the [README in the theme/ directory](./theme/README.md).
