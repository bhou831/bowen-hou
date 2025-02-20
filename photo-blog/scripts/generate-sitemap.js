const fs = require('fs');
const path = require('path');
const glob = require('glob');

async function generateSitemap() {
  // Get all markdown files from the journal directory
  const journalFiles = glob.sync('./src/content/journal/*.md');
  
  // Extract slugs from filenames
  const journalSlugs = journalFiles.map(file => {
    const filename = path.basename(file, '.md');
    return `/journal/${filename}/`;  // Note the trailing slash
  });

  // Your other routes (with trailing slashes for trailingSlash: true config)
  const staticRoutes = [
    '/',
    '/journal/',
    '/music/',
    '/photography/'
  ];

  // Combine all routes
  const allRoutes = [...staticRoutes, ...journalSlugs];
  
  // Create sitemap content
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  for (const route of allRoutes) {
    sitemap += `
  <url>
    <loc>https://bowen-hou.com${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.7'}</priority>
  </url>`;
  }
  
  sitemap += `
</urlset>`;
  
  // Make sure public directory exists
  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public');
  }
  
  // Write the sitemap
  fs.writeFileSync('./public/sitemap.xml', sitemap);
  
  // Create robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://bowen-hou.com/sitemap.xml`;
  
  fs.writeFileSync('./public/robots.txt', robotsTxt);
  
  console.log('Sitemap and robots.txt generated successfully!');
}

generateSitemap();