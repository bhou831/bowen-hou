import { getJournalPosts, getLocalJournalPosts } from '@/lib/blog-utils';
import Link from 'next/link';

export default async function Journal() {
  // Use local posts in development, S3 posts in production
  const posts = process.env.NODE_ENV === 'development' 
    ? await getLocalJournalPosts()
    : await getJournalPosts();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Journal</h1>
      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="border-b border-gray-200 dark:border-gray-800 pb-8">
            <Link href={`/journal/${post.slug}`}>
              <h2 className="text-2xl font-semibold hover:text-gray-600 dark:hover:text-gray-400">
                {post.title}
              </h2>
            </Link>
            <time className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              {post.excerpt}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}