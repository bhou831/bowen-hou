import { getJournalPosts, formatDate } from '@/lib/blog-utils';
import Link from 'next/link';

export default async function Journal() {
  const posts = await getJournalPosts();

  return (
    <div>
      <div className="w-full max-w-3xl">
        <h1 className="sr-only">Journal</h1>
        <div className="space-y-6 sm:space-y-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-gray-200 pb-6 sm:pb-8"
            >
              <Link href={`/journal/${post.slug}`} className="block">
                <h2 className="text-xl font-semibold leading-snug hover:text-gray-600 sm:text-2xl">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  {formatDate(post.date)} · {post.readingTime} min read
                </p>
                <p className="mt-4 text-gray-700">{post.excerpt}</p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
