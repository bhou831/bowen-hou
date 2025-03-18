import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

// Define params type as a Promise
type ParamsType = Promise<{ slug: string }>;

// Function to get a single post
async function getPost(fileName: string) {
  const fullPath = path.join(
    process.cwd(),
    'src/content/journal',
    `${fileName}.md`,
  );
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Convert markdown to HTML string
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    title: data.title,
    date: data.date,
    contentHtml,
  };
}

// Generate static params for pre-rendering
export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'src/content/journal');
  const fileNames = fs.readdirSync(postsDirectory);

  return fileNames.map((fileName) => ({
    slug: fileName.replace(/\.md$/, ''),
  }));
}

export default async function JournalPost({ params }: { params: ParamsType }) {
  const { slug } = await params;
  const post = await getPost(slug);

  return (
    <div className="w-full pl-8 pr-8 flex justify-center">
      <article className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-left">
          {post.title}
        </h1>
        <time className="text-sm text-gray-600 dark:text-gray-400 block mt-2 mb-8 text-left">
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <div
          className="prose dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
    </div>
  );
}
