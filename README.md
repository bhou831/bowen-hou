# Bowen Hou

Source for [bowen-hou.com](https://bowen-hou.com), a personal photography archive, music journal, mountains atlas, and occasional blog.

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
npm run check
npm run lint
npm run typecheck
npm run validate-content
npm run build
npm run format
```

`npm run build` creates the static site in `out/` and generates `sitemap.xml` and `robots.txt`.

## Content

- Photography metadata: `src/content/photography/collections.json`
- Music recommendations: `src/content/music/albums.json`
- Mountains atlas: `src/content/mountains/entries.json`
- Journal posts: `src/content/journal/*.md`
- Local media: `public/images/`

### Add a photography collection

Place the source folder on the Desktop, then run:

```sh
just add-album --path <folder-name> --cover <filename.jpg> [--name <album-id>]
```

The import script generates a smaller cover image, resizes and renames copies of the collection photos in a temporary staging directory, installs the completed collection into `public/images/collections/`, and adds an entry to `collections.json`. Fill in the new collection's title and description after the script finishes.

The source folder and original photos remain unchanged. If any processing or metadata step fails, the script removes the staged output instead of installing a partial collection.

To audit previously imported photos whose longest edge exceeds 4000px, run:

```sh
just cap-photo-edge
```

Review the reported files, retain a backup, and then resize them in place with:

```sh
just cap-photo-edge --apply
```

### Add a music recommendation

Add the album metadata to `src/content/music/albums.json`. Every album needs an
ID, title, artist, cover image, description, and at least one streaming link:

```json
{
  "id": "album-mm-dd-yy",
  "title": "Album Title",
  "artist": "Artist Name",
  "coverImage": "/images/albums/album-folder/cover.jpg",
  "description": "Why this album is worth hearing.",
  "links": {
    "appleMusic": "https://music.apple.com/us/album/album-name/123456789",
    "spotify": "https://open.spotify.com/album/...",
    "youtube": "https://www.youtube.com/..."
  }
}
```

Place the square cover image at the matching `coverImage` path. To add a
30-second preview, copy the numeric album ID from the end of the Apple Music URL
and list the album's previewable tracks:

```sh
curl -sS \
  'https://itunes.apple.com/lookup?id=123456789&entity=song&limit=200' |
  jq -r '.results[]
    | select(.wrapperType == "track" and .previewUrl)
    | [.trackName, .previewUrl]
    | @tsv'
```

Choose the track that best represents the recommendation—prefer a track
mentioned in the description—and add its Apple-hosted preview URL:

```json
"preview": {
  "source": "apple",
  "trackTitle": "Track Title",
  "url": "https://audio-ssl.itunes.apple.com/itunes-assets/..."
}
```

If lookup returns no tracks, search the album's storefront instead:

```sh
curl -sS -G 'https://itunes.apple.com/search' \
  --data-urlencode 'term=Album Title Artist Name' \
  --data 'media=music' \
  --data 'entity=song' \
  --data 'country=US' \
  --data 'limit=50' |
  jq -r '.results[]
    | select(.previewUrl)
    | [.collectionName, .trackName, .previewUrl]
    | @tsv'
```

Change `country=US` to the storefront in the Apple Music URL when necessary.
If Apple does not provide a preview, omit `preview`; the album modal will show
“Preview unavailable.” Run `npm run build` after adding the album to validate
the content and static export.

### Add a mountain destination

Add mountain, range, ridge, park, trail, pass, landform, and attraction entries to
`src/content/mountains/entries.json`. Local images belong in
`public/images/mountains/`.

```json
{
  "id": "unique-slug",
  "name": "Destination name",
  "countryCode": "US",
  "location": [46.8523, -121.7603],
  "type": "mountain",
  "status": "visited",
  "markerStyle": "snow",
  "region": "Cascade Range",
  "gatewayAirport": {
    "name": "Seattle",
    "code": "SEA",
    "note": "optional connection or charter detail"
  },
  "park": "Optional park or reserve",
  "mapUrl": "https://maps.app.goo.gl/example",
  "description": "An optional personal story.",
  "image": "/images/mountains/example.jpg",
  "imageAlt": "A descriptive alternative for the photograph"
}
```

`type` must be `mountain`, `range`, `ridge`, `park`, `trail`, `pass`, `landform`,
or `attraction`;
`status` must be `visited` or `dream`. Every entry needs a supported two-letter
country code, geographic region, practical gateway airport with a three-letter
code, Google Maps URL, and a `markerStyle` of `mountain`, `snow`, `fuji`, or
`volcano`. The marker style controls the globe emoji; `fuji` is reserved for
Mount Fuji, while clustered destinations use their dominant non-Fuji style.
Airport connection notes, park or reserve names, and descriptions are optional.
Any entry can omit photography and use the contour placeholder; when an image
is present, descriptive alternative text is required.

Create an optimized atlas photograph from an existing source without changing
the original:

```sh
just add-mountain-photo --id <entry-id> --source <path-to-image> [--replace]
```

The helper corrects orientation, strips metadata, keeps the original aspect
ratio, and writes a JPEG no larger than 1414px on its longest
edge to `public/images/mountains/<entry-id>.jpg`. It will not upscale images or
overwrite an existing atlas photograph unless `--replace` is supplied. A
replacement is encoded to a temporary file before the existing photograph is
atomically replaced. Run `npm run validate-content` after editing the atlas.

## Deployment

Deploy the generated site files:

```sh
just deploy
```

Images are excluded from the regular deployment. Sync them separately after adding or removing media:

```sh
just sync-images
```
