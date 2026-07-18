import { BaseLyrics, ProviderType } from '../types';
import { BetterLyricsProvider } from './betterlyrics';
import { LrcLibProvider } from './lrclib';

export { BetterLyricsProvider, LrcLibProvider };

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`Promise timed out after ${timeoutMs}ms`);
      resolve(fallbackValue);
    }, timeoutMs);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }).catch((err) => {
      clearTimeout(timer);
      console.error('Promise failed:', err);
      return fallbackValue;
    }),
    timeoutPromise
  ]);
}

export class LyricsProviderManager {
  static async searchLyrics(
    songName: string,
    artistName: string = '',
    duration: number = -1,
    albumName: string = '',
    providerPriority: ProviderType[] = ['lrclib', 'betterlyrics']
  ): Promise<{ provider: ProviderType; results: BaseLyrics[] }[]> {
    const searchPromises = providerPriority.map(async (providerKey) => {
      let results: BaseLyrics[] = [];
      try {
        let searchPromise: Promise<BaseLyrics[]>;
        if (providerKey === 'lrclib') {
          searchPromise = LrcLibProvider.search(songName, artistName);
        } else if (providerKey === 'betterlyrics') {
          searchPromise = BetterLyricsProvider.search(songName, artistName, duration, albumName);
        } else {
          searchPromise = Promise.resolve([]);
        }

        results = await withTimeout(searchPromise, 14000, []);
      } catch (e) {
        console.error(`Error querying provider ${providerKey}:`, e);
      }

      // Filter out empty results or placeholders
      const validResults = results.filter(
        r => r.link && !r.title.toLowerCase().includes('no result found')
      );

      return { provider: providerKey, results: validResults };
    });

    const allResults = await Promise.all(searchPromises);

    // Filter, sort by user's priority order, and return
    return allResults
      .filter(item => item.results.length > 0)
      .sort((a, b) => providerPriority.indexOf(a.provider) - providerPriority.indexOf(b.provider));
  }

  static async getLyrics(link: string, provider: ProviderType): Promise<string> {
    let fetchPromise: Promise<string>;
    if (provider === 'lrclib' || link.startsWith('lrclib:')) {
      fetchPromise = LrcLibProvider.getLyrics(link);
    } else if (provider === 'betterlyrics' || link.startsWith('betterlyrics:')) {
      fetchPromise = BetterLyricsProvider.getLyrics(link);
    } else {
      fetchPromise = Promise.resolve('');
    }

    return withTimeout(fetchPromise, 14000, '');
  }
}
