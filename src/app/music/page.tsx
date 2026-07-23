import albums from '@/content/music/albums.json';
import AlbumGrid, { type Album } from './AlbumGrid';

export default function Music() {
  return <AlbumGrid albums={albums.albums as Album[]} />;
}
