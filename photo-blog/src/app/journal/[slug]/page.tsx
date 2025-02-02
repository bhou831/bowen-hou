import { getPostBySlug, getLocalPostBySlug } from '@/lib/blog-utils';
import { MDXRemote } from 'next-mdx-remote/rsc';

interface Props {
  params: {
    slug: string;
  };
}

export default async function JournalPost({ params }: Props) {
  const post = process.env.NODE_ENV === 'development'
    ? await getLocalPostBySlug(params.slug)
    : await getPostBySlug(params.slug);

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <article className="max-w-2xl mx-auto prose dark:prose-invert">
      <h1>{post.title}</h1>
      <time className="text-sm text-gray-600 dark:text-gray-400">
        {new Date(post.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </time>
      <div className="mt-8">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}