import { BaseLyrics } from '../types';

export function parseTtmlTime(timeStr: string): string {
  if (!timeStr) return '';
  timeStr = timeStr.trim().replace(/s$/, '');

  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondsPart = parts[2];
    let seconds = 0;
    let centiseconds = 0;
    if (secondsPart.includes('.')) {
      const [secStr, msStr] = secondsPart.split('.');
      seconds = parseInt(secStr, 10);
      centiseconds = parseInt((msStr + '00').slice(0, 2), 10);
    } else {
      seconds = parseInt(secondsPart, 10);
    }
    const totalMinutes = hours * 60 + minutes;
    return `[${String(totalMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}]`;
  } else if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const secondsPart = parts[1];
    let seconds = 0;
    let centiseconds = 0;
    if (secondsPart.includes('.')) {
      const [secStr, msStr] = secondsPart.split('.');
      seconds = parseInt(secStr, 10);
      centiseconds = parseInt((msStr + '00').slice(0, 2), 10);
    } else {
      seconds = parseInt(secondsPart, 10);
    }
    return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}]`;
  } else {
    const totalSeconds = parseFloat(timeStr);
    if (isNaN(totalSeconds)) return '';
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);
    let centiseconds = Math.round((totalSeconds % 1) * 100);
    if (centiseconds === 100) {
      seconds += 1;
      centiseconds = 0;
      if (seconds === 60) {
        minutes += 1;
        seconds = 0;
      }
    }
    return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}]`;
  }
}

export function ttmlToLrc(ttmlText: string): string {
  if (!ttmlText) return '';
  const lines: string[] = [];
  const pRegex = /<p\s+[^>]*begin="([^"]+)"[^>]*>(.*?)<\/p>/gs;
  let match;
  while ((match = pRegex.exec(ttmlText)) !== null) {
    const begin = match[1];
    const content = match[2];
    const text = content.replace(/<[^>]+>/g, '').trim();
    const lrcTime = parseTtmlTime(begin);
    if (lrcTime && text) {
      lines.push(`${lrcTime}${text}`);
    }
  }
  return lines.join('\n');
}

export class BetterLyricsProvider {
  static readonly name = 'BetterLyrics';

  static async search(
    songName: string,
    artistName: string = '',
    duration: number = -1,
    albumName: string = ''
  ): Promise<BaseLyrics[]> {
    let title = songName;
    let artist = artistName;

    if (!artist && songName.includes(' - ')) {
      const parts = songName.split(' - ');
      artist = parts[0].trim();
      title = parts[1].trim();
    }

    const params = new URLSearchParams();
    params.append('s', title);
    params.append('a', artist);
    if (duration > 0) {
      params.append('d', String(duration));
    }
    if (albumName) {
      params.append('al', albumName);
    }

    const url = `https://lyrics-api.boidu.dev/getLyrics?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        const ttml = data.ttml;
        if (ttml) {
          const lrcContent = ttmlToLrc(ttml);
          if (lrcContent) {
            const encodedLrc = btoa(unescape(encodeURIComponent(lrcContent)));
            const sampleLines = lrcContent
              .split('\n')
              .map(line => line.replace(/\[\d+:\d+\.\d+\]/g, '').trim())
              .filter(line => line);
            const sample = sampleLines.slice(0, 3).join(' | ');

            return [{
              title: `${title} - ${artist} (BetterLyrics)`,
              link: `betterlyrics:embed:${encodedLrc}`,
              sample_lyrics: sample,
              index: '1'
            }];
          }
        }
      }
    } catch (e) {
      console.error('BetterLyrics search error:', e);
    }

    return [];
  }

  static async getLyrics(link: string): Promise<string> {
    if (!link.startsWith('betterlyrics:embed:')) return '';
    try {
      const base64 = link.split('betterlyrics:embed:')[1];
      return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      console.error('BetterLyrics decode error:', e);
      return '';
    }
  }
}
