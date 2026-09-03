import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import html from 'remark-html';
import { formatDate, getPostBySlug } from '@/lib/blog-utils';

type ParamsType = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: ParamsType;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

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
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const processedContent = await remark()
    .use(remarkGfm)
    .use(html)
    .process(post.content);
  const contentHtml = processedContent.toString();

  return (
    <div className="w-full flex justify-center">
      <article className="w-full max-w-6xl">
        <header className="mx-auto w-full max-w-2xl lg:max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 text-left">
            {post.title}
          </h1>
          <p className="text-sm text-gray-500 mt-2 mb-8">
            {formatDate(post.date)} · {post.readingTime} min read
          </p>
        </header>
        <div
          className="journal-prose prose max-w-none"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </div>
  );
}
