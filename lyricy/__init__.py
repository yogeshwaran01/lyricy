"""
lyricy
~~~~~~~~~~
A command line lyrics utility tool which search and add lyrics to your offline songs.
"""

__package__ = "lyricy"
__description__ = "A command line lyrics utility tool \
which search and add lyrics to your offline songs"
__url__ = "https://github.com/yogeshwaran01/lyricy"
__version__ = "1.5"
__author__ = "YOGESHWARAN R <yogeshin247@gmail.com>"
__license__ = "MIT License"
__copyright__ = "Copyright 2022 Yogeshwaran R"


from enum import Enum
from typing import List

import music_tag

from .classes import BaseLyrics
from .cli import lyrics_without_tags, capitalized_lyrics
from .providers import Megalobiz, RcLyricsBand, LrcLib, BetterLyrics


class Providers(Enum):
    MEGALOBIZ = Megalobiz
    RCLYRICSBAND = RcLyricsBand
    LRCLIB = LrcLib
    BETTERLYRICS = BetterLyrics


class Lyrics(BaseLyrics):
    def fetch(self):
        """Fetch the full lyrics of the song with lrc tags"""
        if self.link.startswith("lrclib:"):
            self.lyrics = LrcLib.get_lyrics(self.link)
        elif self.link.startswith("betterlyrics:"):
            self.lyrics = BetterLyrics.get_lyrics(self.link)
        elif "rclyricsband" in self.link:
            self.lyrics = RcLyricsBand.get_lyrics(self.link)
        elif "megalobiz" in self.link:
            self.lyrics = Megalobiz.get_lyrics(self.link)
        else:
            self.lyrics = ""

        self.lyrics = capitalized_lyrics(self.lyrics)
        self.lyrics_without_lrc_tags = lyrics_without_tags(self.lyrics)

    def save(self, path: str):
        """Save the lyrics file"""
        with open(path, "w") as file:
            file.write(self.lyrics)

    def add_to_track(self, path: str, only_lyrics=False):
        """
        Add the lyrics to track metadata
        `path`: path of the track
        """
        f = music_tag.load_file(path)
        if f is not None:
            if only_lyrics:
                f["lyrics"] = self.lyrics_without_lrc_tags
            else:
                f["lyrics"] = self.lyrics
            f.save()


class Lyricy:
    @staticmethod
    def search(
        query: str,
        provider=Providers.LRCLIB,
        artist_name: str = "",
        duration: int = -1,
        album_name: str = "",
    ) -> List[Lyrics]:
        """Search for a lyrics for given Query"""
        if provider == Providers.RCLYRICSBAND:
            r = RcLyricsBand.search_lyrics(query)
        elif provider == Providers.MEGALOBIZ:
            r = Megalobiz.search_lyrics(query)
        elif provider == Providers.BETTERLYRICS:
            r = BetterLyrics.search_lyrics(query, artist_name, duration, album_name)
        elif provider == Providers.LRCLIB:
            r = LrcLib.search_lyrics(query)
        else:
            # Fallback search chain (Default/Auto mode)
            r = LrcLib.search_lyrics(query)
            if not r or r[0].title == "No result found":
                if artist_name:
                    r = BetterLyrics.search_lyrics(
                        query, artist_name, duration, album_name
                    )
                if not r or r[0].title in [
                    "No result found",
                    "No result found on BetterLyrics",
                    "BetterLyrics: API key required for uncached query",
                ]:
                    r = RcLyricsBand.search_lyrics(query)
                if not r or r[0].title == "No result found":
                    r = Megalobiz.search_lyrics(query)

        return [Lyrics(**i.__dict__) for i in r]
