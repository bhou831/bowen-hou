const fs = require('fs');
const path = require('path');
const glob = require('glob');


async function generateSitemap() {

  const journalFiles = glob.sync('./src/content/journal/*.md');
  

  const journalSlugs = journalFiles.map(file => {
    const filename = path.basename(file, '.md');
    return `/journal/${filename}`;
  });


  const staticRoutes = [
    '/',
    '/journal',
    '/music',
    '/photography'
  ];


  const allRoutes = [...staticRoutes, ...journalSlugs];


  const sitemapPath = './public/sitemap-0.xml';
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');


  let urlsetCloseTag = '</urlset>';
  let sitemapContent = sitemap.replace(urlsetCloseTag, '');
  
  for (const route of journalSlugs) {
    const url = `  <url>
    <loc>https://bowen-hou.com${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    
    sitemapContent += url;
  }
  
  sitemapContent += urlsetCloseTag;
  
  fs.writeFileSync(sitemapPath, sitemapContent);
}

generateSitemap();