---
name: onboard-album
description: Add a music album to this site’s collection from user-provided Apple Music, Spotify, YouTube, and preview links. Use when the user asks to onboard, recommend, or publish an album on the site’s music page, including sourcing official Apple Music cover art, writing the album entry, and validating the build.
---

# Onboard Album

Add one or more albums to this Next.js music site while preserving its existing content schema and visual behavior.

## Workflow

1. Inspect the project before editing:
   - Read `src/content/music/albums.json` to confirm the current schema and insertion order.
   - Inspect `src/app/music/AlbumGrid.tsx` only if the requested data needs capabilities not already supported.
   - Check `public/images/albums/` for existing cover-art naming conventions.
2. Normalize the user’s supplied metadata without changing their intended voice:
   - Keep the album title and artist credit as supplied unless the source clearly exposes a spelling correction; if changing it, prefer a minimal correction.
   - Preserve Apple Music, Spotify, and YouTube URLs exactly, including query parameters.
   - Use the supplied preview URL and track title. Set `preview.source` to `"apple"`.
   - Turn rough notes into concise first-person album copy. Preserve personal opinions, musical references, and anecdotes; fix obvious grammar and spelling without making the writing generic.
3. Fetch official cover art from Apple Music when an Apple Music album URL or ID is available:
   - Extract the numeric album ID from the URL.
   - Query `https://itunes.apple.com/lookup?id=<album-id>&entity=album`.
   - Use the returned `artworkUrl100`, replacing its size suffix with `/1200x1200bb.jpg` when supported.
   - Save the image as `public/images/albums/<slug>/cover.jpg`, using a lowercase hyphenated slug that is stable and descriptive.
   - Verify the downloaded file is a readable JPEG or another image format supported by the site. Do not generate substitute artwork when official artwork is available.
4. Add the entry at the top of the `albums` array so the newest recommendation appears first. Use a unique ID based on the current date, such as `album-MM-DD-YY`, adding a numeric suffix for multiple albums on the same day.
5. Keep the entry shaped like this:

   ```json
   {
     "id": "album-MM-DD-YY",
     "title": "Album title",
     "artist": "Artist",
     "coverImage": "/images/albums/slug/cover.jpg",
     "preview": {
       "source": "apple",
       "trackTitle": "Track title",
       "url": "https://audio-ssl.itunes.apple.com/..."
     },
     "description": "First-person recommendation.",
     "links": {
       "appleMusic": "https://music.apple.com/...",
       "spotify": "https://open.spotify.com/...",
       "youtube": "https://youtube.com/..."
     }
   }
   ```

   Omit unavailable streaming links rather than inventing them. Keep the preview only when a valid preview URL is supplied.
6. Validate before reporting completion:
   - Parse `src/content/music/albums.json` as JSON and confirm the new entry’s cover path, links, preview, and unique ID.
   - Run `npm run build` from the project root.
   - If the build fails, fix only issues caused by the onboarding change and rerun it.

## Editing and safety

- Use `apply_patch` for text edits. Use a normal download command only for the requested cover-art asset.
- Do not overwrite an existing album directory or cover without checking whether it belongs to the same album.
- Do not alter the album component or global styling for a standard onboarding request; the current UI already supports title, artist, cover, description, streaming links, and a 30-second Apple preview.
- Do not add release dates, genres, credits, translations, or production claims unless the user supplies them or the source record is needed to identify the album artwork.
- If Apple artwork cannot be fetched, report the blocker and ask for a cover image or permission to proceed without artwork; do not silently use a random image.
