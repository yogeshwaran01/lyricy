import { BaseLyrics } from '../types';

export class LrcLibProvider {
  static readonly name = 'LrcLib';

  static async search(songName: string, artistName: string = ''): Promise<BaseLyrics[]> {
    const results: BaseLyrics[] = [];
    const query = artistName ? `${songName} ${artistName}` : songName;
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'lyricy-extension (https://github.com/yogeshwaran01/lyricy)' }
      });

      if (!response.ok) return [];

      const data = await response.json();
      if (!Array.isArray(data)) return [];

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const lyricsContent = item.syncedLyrics || item.plainLyrics || '';
        
        let sample = '';
        if (lyricsContent) {
          const lines = lyricsContent
            .split('\n')
            .map((l: string) => l.replace(/\[\d+:\d+\.\d+\]/g, '').trim())
            .filter((l: string) => l);
          sample = lines.slice(0, 3).join(' | ');
        }

        let title = `${item.trackName} - ${item.artistName}`;
        if (item.albumName) {
          title += ` (${item.albumName})`;
        }

        results.push({
          title,
          link: `lrclib:${item.id}`,
          sample_lyrics: sample,
          index: String(i + 1)
        });
      }
    } catch (e) {
      console.error('LrcLib search error:', e);
    }

    return results;
  }

  static async getLyrics(link: string): Promise<string> {
    if (!link.startsWith('lrclib:')) return '';
    const id = link.split(':')[1];
    const url = `https://lrclib.net/api/get/${id}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'lyricy-extension (https://github.com/yogeshwaran01/lyricy)' }
      });

      if (!response.ok) return '';
      const item = await response.json();
      return item.syncedLyrics || item.plainLyrics || '';
    } catch (e) {
      console.error('LrcLib getLyrics error:', e);
      return '';
    }
  }
}
