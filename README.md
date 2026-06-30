# Bowen Hou

Source for [bowen-hou.com](https://bowen-hou.com), a personal photography archive, music journal, and occasional blog.

The site is built with Next.js, React, Tailwind CSS, and the Spectral typeface. It is exported as static files and deployed to AWS S3.

## Requirements

- Node.js and npm
- `ffmpeg` for importing photography collections
- [Just](https://github.com/casey/just) for the convenience commands below
- AWS CLI configured for the production bucket when deploying

## Local development

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

The site is available at [http://localhost:3000](http://localhost:3000).

Useful checks:

```sh
npm run lint
npm run build
npm run format
```

`npm run build` creates the static site in `out/` and generates `sitemap.xml` and `robots.txt`.

## Content

- Photography metadata: `src/content/photography/collections.json`
- Music recommendations: `src/content/music/albums.json`
- Journal posts: `src/content/journal/*.md`
- Local media: `public/images/`

### Add a photography collection

Place the source folder on the Desktop, then run:

```sh
just add-album --path <folder-name> --cover <filename.jpg> [--name <album-id>]
```

The import script generates a smaller cover image, resizes and renames the collection photos, moves the collection into `public/images/collections/`, and adds an entry to `collections.json`. Fill in the new collection's title and description after the script finishes.

The script moves the source folder and removes the original files as it processes them, so retain a separate backup of the originals.

To audit previously imported photos whose longest edge exceeds 4000px, run:

```sh
just cap-photo-edge
```

Review the reported files, retain a backup, and then resize them in place with:

```sh
just cap-photo-edge --apply
```

## Deployment

Deploy the generated site files:

```sh
just deploy
```

Images are excluded from the regular deployment. Sync them separately after adding or removing media:

```sh
just sync-images
```
