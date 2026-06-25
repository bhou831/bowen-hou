import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { formatDate } from '@/lib/blog-utils';

type ParamsType = Promise<{ slug: string }>;

async function getPost(fileName: string) {
  const fullPath = path.join(
    process.cwd(),
    'src/content/journal',
    `${fileName}.md`,
  );
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return {
    title: data.title,
    date: data.date,
    excerpt: data.excerpt,
    contentHtml,
    readingTime: Math.max(1, Math.ceil(wordCount / 200)),
  };
}

export async function generateMetadata({
  params,
}: {
  params: ParamsType;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  const description = post.excerpt || `A journal post by Bowen Hou.`;
  const url = `/journal/${slug}/`;

  return {
    title: `${post.title} | Bowen Hou Journal`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${post.title} | Bowen Hou Journal`,
      description,
      url: `https://bowen-hou.com${url}`,
      type: 'article',
      publishedTime: post.date,
      authors: ['Bowen Hou'],
    },
  };
}

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
    <div className="w-full flex justify-center">
      <article className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 text-left">
          {post.title}
        </h1>
        <p className="text-sm text-gray-500 mt-2 mb-8">
          {formatDate(post.date)} · {post.readingTime} min read
        </p>
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
    </div>
  );
}
