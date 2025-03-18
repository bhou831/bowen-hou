import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Add these two lines for static export
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  try {
    const slideshowDir = path.join(process.cwd(), 'public/images/slideshow');
    const files = fs.readdirSync(slideshowDir);

    // Filter for image files and sort them
    const imageFiles = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      })
      .sort();

    // Convert to public URLs
    const images = imageFiles.map((file) => `/images/slideshow/${file}`);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error reading slideshow directory:', error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
