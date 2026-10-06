# Put GL Core Scout online (GitHub Pages)

You only need a free GitHub account. These are the same steps you used for IV Lab.

## First time (about 5 minutes)
1. Go to github.com → **+** (top right) → **New repository**.
2. Name it, for example `gl-core-scout`. Choose **Public** (GitHub Pages is free for public repositories). Click **Create repository**.
3. On the new page click **uploading an existing file**.
4. Unzip `GL_Core_Scout_website.zip` and drag **everything inside it** onto the page: `index.html`, `manifest.webmanifest`, `sw.js` and the `icons` folder. Click **Commit changes**.
5. Open **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
6. Wait about a minute and refresh the page. GitHub shows your link, e.g. `https://YOUR-NAME.github.io/gl-core-scout/`. Share that link with anyone.

## Install it on a phone
Open the link in Chrome on Android → menu (⋮) → **Add to Home screen** / **Install app**.
On iPhone (Safari) → Share → **Add to Home Screen**.

## Updating after a new regional
Run the kit (or ask Claude to). Upload the new `index.html` and `sw.js` from `output/website/` to the same repository: **Add file → Upload files**, then commit. Visitors get the new version next time they open the site.

## Notes
- Everyone's own team, Core Lab and settings are saved in their own browser only. Nothing is shared or uploaded.
- The language switch (English / Español / 日本語) is in the top-right corner. Each visitor's choice is remembered.
