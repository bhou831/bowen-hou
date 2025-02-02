import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface Post {
  slug: string;
  title: string;
  date: string;
  content: string;
  excerpt?: string;
}

export async function getJournalPosts(): Promise<Post[]> {
  try {
    // List all objects in the journal posts directory
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: 'content/journal/',
    });

    const response = await s3Client.send(command);
    const posts: Post[] = [];

    // Process each markdown file
    for (const object of response.Contents || []) {
      if (!object.Key?.endsWith('.md')) continue;

      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: object.Key,
      });

      const response = await s3Client.send(getObjectCommand);
      const content = await response.Body?.transformToString();
      
      if (content) {
        const { data, content: markdown } = matter(content);
        const slug = object.Key.replace('content/journal/', '').replace('.md', '');
        
        posts.push({
          slug,
          title: data.title,
          date: data.date,
          content: markdown,
          excerpt: data.excerpt || markdown.slice(0, 200) + '...',
        });
      }
    }

    // Sort posts by date
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error fetching journal posts:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `content/journal/${slug}.md`,
    });

    const response = await s3Client.send(command);
    const content = await response.Body?.transformToString();

    if (!content) {
      return null;
    }

    const { data, content: markdown } = matter(content);

    return {
      slug,
      title: data.title,
      date: data.date,
      content: markdown,
      excerpt: data.excerpt,
    };
  } catch (error) {
    console.error(`Error fetching post ${slug}:`, error);
    return null;
  }
}

// For local development, you can use these functions instead:
export async function getLocalJournalPosts(): Promise<Post[]> {
  const postsDirectory = path.join(process.cwd(), 'src/content/journal');
  const filenames = fs.readdirSync(postsDirectory);
  
  const posts = filenames.map((filename) => {
    const slug = filename.replace('.md', '');
    const fullPath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
    return {
      slug,
      title: data.title,
      date: data.date,
      content,
      excerpt: data.excerpt || content.slice(0, 200) + '...',
    };
  });
  
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getLocalPostBySlug(slug: string): Promise<Post | null> {
  try {
    const fullPath = path.join(process.cwd(), 'src/content/journal', `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
    return {
      slug,
      title: data.title,
      date: data.date,
      content,
      excerpt: data.excerpt,
    };
  } catch {
    return null;
  }
}