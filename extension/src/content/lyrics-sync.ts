import { LyricLine, LyricsData } from '../common/types';

export class LyricsSynchronizer {
  private data: LyricsData | null = null;

  setLyrics(data: LyricsData) {
    // Filter out any metadata lines that might have slipped into lines
    const cleanLines = data.lines.filter(line => {
      // Exclude standard LRC headers like [ti:Title] or [ar:Artist] if parsed as text
      if (line.text.startsWith('[') && line.text.endsWith(']')) {
        return false;
      }
      return true;
    });

    this.data = {
      ...data,
      lines: cleanLines
    };
  }

  getLyricsData(): LyricsData | null {
    return this.data;
  }

  syncTime(time: number): {
    activeIndex: number;
    isInstrumental: boolean;
    activeLine: LyricLine | null;
  } {
    if (!this.data || this.data.lines.length === 0) {
      return { activeIndex: -1, isInstrumental: false, activeLine: null };
    }

    const lines = this.data.lines;

    // Unsynced lyrics: return activeIndex = -1 to show all lines statically
    if (!this.data.synced) {
      return { activeIndex: -1, isInstrumental: false, activeLine: null };
    }

    // Find the line that corresponds to the current playback time
    let index = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time !== -1 && lines[i].time <= time) {
        index = i;
      } else if (lines[i].time > time) {
        break;
      }
    }

    // Before the first line
    if (index === -1) {
      const firstLineTime = lines[0].time;
      // If there is an instrumental intro of more than 4 seconds
      if (firstLineTime > 4 && time < firstLineTime - 1.5) {
        return { 
          activeIndex: -2, 
          isInstrumental: true, 
          activeLine: { time: 0, text: '• • •' } 
        };
      }
      return { activeIndex: -1, isInstrumental: false, activeLine: null };
    }

    const activeLine = lines[index];
    const nextLine = lines[index + 1];

    // Check for an instrumental break between active line and next line
    if (nextLine && nextLine.time !== -1) {
      const gap = nextLine.time - activeLine.time;
      const timeElapsed = time - activeLine.time;
      
      // If gap is long (e.g. > 6s) and we have read the current line for at least 4s
      // and we are still at least 1.5s away from the next line
      if (gap > 6 && timeElapsed > Math.max(3.5, gap - 3) && time < nextLine.time - 1.5) {
        return {
          activeIndex: index,
          isInstrumental: true,
          activeLine: { time: activeLine.time + 3.5, text: '• • •' }
        };
      }
    }

    return { activeIndex: index, isInstrumental: false, activeLine };
  }
}
