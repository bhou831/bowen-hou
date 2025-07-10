import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Add these two lines for static export
export const dynamic = 'force-static';
export const revalidate = false;

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET() {
  try {
    const slideshowDir = path.join(process.cwd(), 'public/images/slideshow');
    const files = fs.readdirSync(slideshowDir);

    // Filter for image files and sort them
    const imageFiles = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      });

    const shuffledImages = shuffleArray(imageFiles);

    const images = shuffledImages.map((file) => `/images/slideshow/${file}`);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error reading slideshow directory:', error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
