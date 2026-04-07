import albums from '@/content/music/albums.json';
import AlbumGrid from './AlbumGrid';

export default function Music() {
  return <AlbumGrid albums={albums.albums} />;
}
