import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollectionById, getCollections } from '@/lib/photo-utils';

type ParamsType = Promise<{ collectionId: string }>;

function descriptionExcerpt(description: string): string {
  return description.replace(/\s+/g, ' ').trim().slice(0, 155);
}

export function generateStaticParams() {
  return getCollections().map((collection) => ({
    collectionId: collection.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: ParamsType;
}): Promise<Metadata> {
  const { collectionId } = await params;
  const collection = getCollectionById(collectionId);

  if (!collection) {
    return {};
  }

  const title = `${collection.title} Photography | Bowen Hou`;
  const description = descriptionExcerpt(collection.description);
  const url = `/photography/${collection.id}/`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${collection.title} | Bowen Hou Photography`,
      description,
      url: `https://bowen-hou.com${url}`,
      type: 'article',
      images: [
        {
          url: collection.coverImage,
          alt: `${collection.title} by Bowen Hou`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${collection.title} | Bowen Hou Photography`,
      description,
      images: [collection.coverImage],
    },
  };
}

export default async function PhotoCollectionPage({
  params,
}: {
  params: ParamsType;
}) {
  const { collectionId } = await params;
  const collection = getCollectionById(collectionId);

  if (!collection) {
    notFound();
  }

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `${collection.title} - Bowen Hou Photography`,
    description: collection.description,
    url: `https://bowen-hou.com/photography/${collection.id}/`,
    author: {
      '@type': 'Person',
      name: 'Bowen Hou',
      alternateName: '侯博文',
      url: 'https://bowen-hou.com/',
    },
    image: collection.images.map((image) => ({
      '@type': 'ImageObject',
      url: `https://bowen-hou.com${image}`,
      name: `${collection.title} photo by Bowen Hou`,
    })),
  };

  return (
    <article className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <div className="mb-8 max-w-3xl">
        <Link
          href="/photography/"
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Photography
        </Link>
        <h1 className="mt-3 text-3xl font-light text-gray-900">
          {collection.title}
        </h1>
        <p className="mt-4 whitespace-pre-line text-base text-gray-700">
          {collection.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {collection.images.map((image, index) => (
          <div
            key={image}
            className="relative aspect-[4/3] overflow-hidden rounded-sm bg-gray-100"
          >
            <Image
              src={image}
              alt={`${collection.title} photo ${index + 1} by Bowen Hou`}
              fill
              className="object-cover"
              sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
              quality={90}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
