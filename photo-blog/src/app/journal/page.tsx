import { getJournalPosts } from '@/lib/blog-utils';
import Link from 'next/link';

export default async function Journal() {
  const posts = await getJournalPosts();

  return (
    <div className="pl-8 pr-8">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">Journal</h1>
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="border-b border-gray-200 dark:border-gray-800 pb-8">
              <Link href={`/journal/${post.slug}`} className="block">
                <h2 className="text-2xl font-semibold hover:text-gray-600 dark:hover:text-gray-400">
                  {post.title}
                </h2>
                <time className="text-sm text-gray-600 dark:text-gray-400 block mt-2">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <p className="mt-4 text-gray-700 dark:text-gray-300">
                  {post.excerpt}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}