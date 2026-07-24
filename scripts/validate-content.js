const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const projectRoot = path.resolve(__dirname, '..');
const publicDirectory = path.join(projectRoot, 'public');
const collections =
  require('../src/content/photography/collections.json').collections;
const albums = require('../src/content/music/albums.json').albums;
const failures = [];

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
  `Content validation passed: ${collections.length} collections, ${albums.length} albums, and ${journalFiles.length} journal post(s).`,
);
