---
name: light-up-mountain
description: Mark an existing destination as visited in this site's mountain atlas, prepare its photo, and add the user's rating. Use when the user wants to unlock or light up an atlas mountain.
---

# Light up an atlas mountain

Work from the repository root. Atlas data lives in `src/content/mountains/entries.json`.
Find the destination by name and preserve its existing ID, coordinates, marker style, and travel details.

The atlas UI in `src/app/mountains/MountainsGlobe.tsx` derives the lit marker from
`status: "visited"` and the ranking from numeric `rating` values. No separate
emoji or ranking-list edit is needed.

Use the supplied photograph to create the atlas asset:

```sh
just generate-atlas-photo --id <existing-entry-id> --source <source-image-path>
```

Quote paths containing spaces. The helper preserves the original, strips metadata,
and creates a JPEG capped at 1414px on the longest edge at
`public/images/mountains/<existing-entry-id>.jpg`. Use `--replace` when the user
is updating an existing atlas image. Inspect the supplied image to write accurate alt text.

Update the matching entry:

- Set `status` to `visited`.
- Set `rating` to the user's score out of 10, with at most one decimal place.
  Do not invent a score. If none is supplied, preserve an existing score or ask
  for one; an explicitly unrated visit can use a non-empty `ratingNote` instead.
  Remove an obsolete unrated note when adding a score.
- Set `image` to `/images/mountains/<existing-entry-id>.jpg`.
- Set `imageAlt` to a concise description of the supplied photograph.

Run `npm run validate-content` and verify the generated image dimensions.
Keep photography album metadata unchanged unless the user also requests album edits.
If the destination does not exist, gather the missing entry details before creating
it; consult the atlas section of `README.md` and `scripts/validate-content.js` for
the current schema. Publishing is a separate action from this local update.
