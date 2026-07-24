import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Post {
  slug: string;
  title: string;
  date: string;
  content: string;
  excerpt?: string;
  readingTime: number;
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function getJournalPosts(): Promise<Post[]> {
  const postsDirectory = path.join(process.cwd(), 'src/content/journal');
  const fileNames = fs.readdirSync(postsDirectory);

  const posts = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName): Post => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      const wordCount = content.split(/\s+/).filter(Boolean).length;

      return {
        slug,
        title: data.title,
        date: data.date,
        content,
        excerpt: data.excerpt || content.slice(0, 200) + '...',
        readingTime: Math.max(1, Math.ceil(wordCount / 200)),
      };
    });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const fullPath = path.join(
    process.cwd(),
    'src/content/journal',
    `${slug}.md`,
  );
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return {
    slug,
    title: data.title,
    date: data.date,
    content,
    excerpt: data.excerpt,
    readingTime: Math.max(1, Math.ceil(wordCount / 200)),
  };
}
