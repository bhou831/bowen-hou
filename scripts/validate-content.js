const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const projectRoot = path.resolve(__dirname, '..');
const publicDirectory = path.join(projectRoot, 'public');
const collections =
  require('../src/content/photography/collections.json').collections;
const albums = require('../src/content/music/albums.json').albums;
const mountainEntries =
  require('../src/content/mountains/entries.json').entries;
const failures = [];
const supportedCountryCodes = new Set([
  'AR',
  'CA',
  'CH',
  'CL',
  'CN',
  'ES',
  'ID',
  'IS',
  'IT',
  'JP',
  'NP',
  'NO',
  'NZ',
  'PE',
  'PK',
  'RU',
  'TZ',
  'US',
]);

function addFailure(message) {
  failures.push(message);
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    addFailure(`${label} must be a non-empty string.`);
  }
}

function requireUniqueIds(items, label) {
  const seen = new Set();

  for (const item of items) {
    requireText(item.id, `${label} id`);

    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(item.id || '')) {
      addFailure(
        `${label} id "${item.id}" may only contain letters, numbers, underscores, and hyphens.`,
      );
    }

    if (seen.has(item.id)) {
      addFailure(`Duplicate ${label} id: ${item.id}`);
    }
    seen.add(item.id);
  }
}

function requireLocalAsset(assetPath, label) {
  requireText(assetPath, label);
  if (typeof assetPath !== 'string' || assetPath.trim() === '') return;

  if (!assetPath.startsWith('/')) {
    addFailure(`${label} must use an absolute site path: ${assetPath}`);
    return;
  }

  const resolvedPath = path.resolve(
    publicDirectory,
    assetPath.replace(/^\/+/, ''),
  );
  if (
    !resolvedPath.startsWith(`${publicDirectory}${path.sep}`) ||
    !fs.existsSync(resolvedPath)
  ) {
    addFailure(`${label} does not exist in public/: ${assetPath}`);
  }
}

function requireHttpsUrl(value, label) {
  requireText(value, label);
  if (typeof value !== 'string' || value.trim() === '') return;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      addFailure(`${label} must use HTTPS: ${value}`);
    }
  } catch {
    addFailure(`${label} is not a valid URL: ${value}`);
  }
}

requireUniqueIds(collections, 'collection');
for (const collection of collections) {
  const label = `Collection "${collection.id}"`;
  requireText(collection.title, `${label} title`);
  requireText(collection.description, `${label} description`);
  requireLocalAsset(collection.coverImage, `${label} cover image`);

  if (!Array.isArray(collection.images) || collection.images.length === 0) {
    addFailure(`${label} must contain at least one image.`);
    continue;
  }

  collection.images.forEach((image, index) =>
    requireLocalAsset(image, `${label} image ${index + 1}`),
  );
}

requireUniqueIds(albums, 'album');
for (const album of albums) {
  const label = `Album "${album.id}"`;
  requireText(album.title, `${label} title`);
  requireText(album.artist, `${label} artist`);
  requireText(album.description, `${label} description`);
  requireLocalAsset(album.coverImage, `${label} cover image`);

  const streamingLinks = Object.entries(album.links || {}).filter(
    ([, value]) => typeof value === 'string' && value.trim() !== '',
  );
  if (streamingLinks.length === 0) {
    addFailure(`${label} must contain at least one streaming link.`);
  }
  streamingLinks.forEach(([service, url]) =>
    requireHttpsUrl(url, `${label} ${service} link`),
  );

  if (album.preview) {
    if (album.preview.source !== 'apple') {
      addFailure(`${label} preview source must be "apple".`);
    }
    requireText(album.preview.trackTitle, `${label} preview track title`);
    requireHttpsUrl(album.preview.url, `${label} preview URL`);
  }
}

if (!Array.isArray(mountainEntries)) {
  addFailure('Mountain entries must be an array.');
} else {
  requireUniqueIds(mountainEntries, 'mountain entry');
  for (const entry of mountainEntries) {
    const label = `Mountain entry "${entry.id}"`;
    requireText(entry.name, `${label} name`);
    if (entry.description !== undefined) {
      requireText(entry.description, `${label} description`);
    }
    requireText(entry.region, `${label} region`);
    if (!entry.gatewayAirport || typeof entry.gatewayAirport !== 'object') {
      addFailure(`${label} gatewayAirport must be an object.`);
    } else {
      requireText(entry.gatewayAirport.name, `${label} gateway airport name`);
      if (
        typeof entry.gatewayAirport.code !== 'string' ||
        !/^[A-Z]{3}$/.test(entry.gatewayAirport.code)
      ) {
        addFailure(
          `${label} gateway airport code must be a three-letter uppercase code.`,
        );
      }
      if (entry.gatewayAirport.note !== undefined) {
        requireText(entry.gatewayAirport.note, `${label} gateway airport note`);
      }
    }
    if (entry.park !== undefined) {
      requireText(entry.park, `${label} park or reserve`);
    }

    if (!supportedCountryCodes.has(entry.countryCode)) {
      addFailure(`${label} countryCode must be a supported ISO country code.`);
    }

    if (
      ![
        'mountain',
        'range',
        'ridge',
        'park',
        'trail',
        'pass',
        'landform',
        'attraction',
      ].includes(entry.type)
    ) {
      addFailure(
        `${label} type must be mountain, range, ridge, park, trail, pass, landform, or attraction.`,
      );
    }
    if (!['visited', 'dream'].includes(entry.status)) {
      addFailure(`${label} status must be visited or dream.`);
    }
    if (entry.rating !== undefined) {
      if (
        typeof entry.rating !== 'number' ||
        !Number.isFinite(entry.rating) ||
        entry.rating < 0 ||
        entry.rating > 10 ||
        Math.round(entry.rating * 10) !== entry.rating * 10
      ) {
        addFailure(
          `${label} rating must be between 0 and 10 with at most one decimal place.`,
        );
      }
      if (entry.status !== 'visited') {
        addFailure(`${label} only visited destinations can have a rating.`);
      }
    }
    if (entry.ratingNote !== undefined) {
      requireText(entry.ratingNote, `${label} rating note`);
      if (entry.status !== 'visited') {
        addFailure(
          `${label} only visited destinations can have a rating note.`,
        );
      }
    }
    if (
      entry.status === 'visited' &&
      entry.rating === undefined &&
      entry.ratingNote === undefined
    ) {
      addFailure(`${label} visited destinations need a rating or rating note.`);
    }
    if (!['mountain', 'snow', 'fuji', 'volcano'].includes(entry.markerStyle)) {
      addFailure(
        `${label} markerStyle must be mountain, snow, fuji, or volcano.`,
      );
    }
    if (
      !Array.isArray(entry.location) ||
      entry.location.length !== 2 ||
      !entry.location.every((coordinate) => Number.isFinite(coordinate))
    ) {
      addFailure(`${label} location must be a [latitude, longitude] tuple.`);
    } else {
      const [latitude, longitude] = entry.location;
      if (latitude < -90 || latitude > 90) {
        addFailure(`${label} latitude must be between -90 and 90.`);
      }
      if (longitude < -180 || longitude > 180) {
        addFailure(`${label} longitude must be between -180 and 180.`);
      }
    }

    if (entry.image) {
      requireLocalAsset(entry.image, `${label} image`);
      requireText(entry.imageAlt, `${label} image alt text`);
    } else if (entry.imageAlt) {
      addFailure(`${label} cannot include imageAlt without an image.`);
    }

    requireHttpsUrl(entry.mapUrl, `${label} map URL`);
    if (typeof entry.mapUrl === 'string') {
      try {
        const hostname = new URL(entry.mapUrl).hostname;
        const isGoogleMapsHost =
          hostname === 'maps.app.goo.gl' ||
          hostname === 'google.com' ||
          hostname.endsWith('.google.com');
        if (!isGoogleMapsHost) {
          addFailure(`${label} map URL must point to Google Maps.`);
        }
      } catch {
        // requireHttpsUrl reports malformed URLs.
      }
    }
  }
}

const requiredSiteAssets = [
  '/favicon.ico',
  '/images/og/og.jpg',
  '/images/icons/spotify.png',
  '/images/icons/apple-music.png',
  '/images/icons/youtube.png',
  ...Array.from(
    { length: 26 },
    (_, index) => `/images/slideshow/cover_page_${index + 1}.JPG`,
  ),
];
requiredSiteAssets.forEach((asset) =>
  requireLocalAsset(asset, `Required site asset`),
);

const journalDirectory = path.join(projectRoot, 'src', 'content', 'journal');
const journalFiles = fs
  .readdirSync(journalDirectory)
  .filter((fileName) => fileName.endsWith('.md'));

for (const fileName of journalFiles) {
  const filePath = path.join(journalDirectory, fileName);
  const { data, content } = matter(fs.readFileSync(filePath, 'utf8'));
  const label = `Journal post "${fileName}"`;
  requireText(data.title, `${label} title`);
  requireText(data.date, `${label} date`);
  requireText(data.excerpt, `${label} excerpt`);
  requireText(content, `${label} content`);

  if (typeof data.date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    addFailure(`${label} date must use YYYY-MM-DD format.`);
  }
}

if (failures.length > 0) {
  console.error(`Content validation failed with ${failures.length} error(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Content validation passed: ${collections.length} collections, ${albums.length} albums, ${mountainEntries.length} mountain entries, and ${journalFiles.length} journal post(s).`,
);
