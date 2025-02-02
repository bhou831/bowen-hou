import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

export interface Album {
  id: string;
  title: string;
  artist: string;
  releaseDate: string;
  description: string;
  coverImage: string;
  links: {
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
  };
}

export async function getAlbums(): Promise<Album[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: 'content/music/albums/',
      Delimiter: '/',
    });

    const response = await s3Client.send(command);
    const albums: Album[] = [];

    for (const prefix of response.CommonPrefixes || []) {
      if (!prefix.Prefix) continue;

      const metadataCommand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${prefix.Prefix}metadata.json`,
      });

      try {
        const metadataResponse = await s3Client.send(metadataCommand);
        const metadata = await metadataResponse.Body?.transformToString();
        
        if (metadata) {
          albums.push(JSON.parse(metadata));
        }
      } catch (error) {
        console.error(`Error fetching metadata for ${prefix.Prefix}:`, error);
      }
    }

    return albums.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  } catch (error) {
    console.error('Error fetching albums:', error);
    return [];
  }
}

// For local development
export async function getLocalAlbums(): Promise<Album[]> {
  if (process.env.NODE_ENV === 'development') {
    // Mock data for development
    return [
      {
        id: '1',
        title: 'Sample Album',
        artist: 'Sample Artist',
        releaseDate: '2024',
        description: 'This is a sample album for development.',
        coverImage: '/albums/sample/cover.jpg',
        links: {
          spotify: 'https://open.spotify.com/album/sample',
        },
      },
    ];
  }
  return [];
}