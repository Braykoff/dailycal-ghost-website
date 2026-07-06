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

3. Open the site at [http://localhost:2368](http://localhost:2368) and the admin at [http://localhost:2368/ghost](http://localhost:2368/ghost)

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

## Exporting

Ghost accepts the theme as a zip file. Upload it in the production admin panel under **Settings > Design** (Change theme > Upload theme).

### Generate a zip locally

Use this for quick testing or one-off deployments. From the repo root:

```bash
cd theme
npm run build
npx gulp zip
cd ..
```

Gulp writes the zip to the repository root (one level above `theme/`). The filename includes the build date, the version from `theme/package.json`, and the current git commit hash.

The zip contains only what Ghost needs: compiled CSS/JS, Handlebars templates, and theme assets. Source files (Sass, unminified JS, `gulpfile.js`, etc.) are excluded.

### Recommended: GitHub release (production)

For production deploys, prefer a GitHub release so the theme is built, validated, and packaged in CI with a traceable version tag.

1. **Bump the theme version** in `theme/package.json` (for example, `1.2.0` → `1.2.1`).

2. **Commit and merge** the version bump to `main`.

3. **Create a GitHub release** with a tag that matches the new version exactly: `vX.Y.Z` (for example, `v1.2.1`). The tag must use the `v` prefix and semver format; it must match `package.json` or the release workflow will fail.

4. **Let CI package the theme.** Publishing the release triggers [`.github/workflows/release.yaml`](./.github/workflows/release.yaml), which:
   - Verifies the release tag matches `theme/package.json`
   - Installs dependencies, runs `npm run build`, and validates the theme with [GScan](https://gscan.ghost.org/)
   - Runs `npx gulp zip` to produce a versioned zip (same naming scheme as above, using the release commit’s hash)
   - Attaches the zip to the release as a downloadable asset

5. **Download the zip** from the release’s **Assets** section on GitHub.

6. **Upload to Ghost** in the production admin panel: **Settings → Design → Change theme → Upload theme**, then activate the new theme.

If packaging fails, check the release notes checklist and the Actions log for the failed step (version mismatch, GScan errors, or zip generation).

## Documentation

Documentation relating to the stock Tripoli theme is available [here](https://aspirethemes.com/docs/tripoli). For documentation on the DC-specific modifications (which may supersede the Tripoli documentation), see the [README in the theme/ directory](./theme/README.md).

## Admin login (local, throwaway)

This is a shared local-only account baked into the committed database. These credentials can be used to log into the local admin panel. Do not reuse them anywhere real.

- **Full name:** `Admin`
- **Email address:** `admin@example.com`
- **Password:** `bogusAdminP@ssw0rd`
