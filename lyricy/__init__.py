"""
    lyricy
    ~~~~~~~~~~
    A command line lyrics utility tool which search and add lyrics to your offline songs.
"""

__package__ = "lyricy"
__description__ = "A command line lyrics utility tool \
which search and add lyrics to your offline songs"
__url__ = "https://github.com/yogeshwaran01/lyricy"
__version__ = "1.3"
__author__ = "YOGESHWARAN R <yogeshin247@gmail.com>"
__license__ = "MIT License"
__copyright__ = "Copyright 2022 Yogeshwaran R"


from enum import Enum
from typing import List

import music_tag

from .classes import BaseLyrics
from .cli import lyrics_without_tags
from .providers import Megalobiz, RcLyricsBand


class Providers(Enum):
    MEGALOBIZ = Megalobiz
    RCLYRICSBAND = RcLyricsBand


class Lyrics(BaseLyrics):
    def fetch(self):
        """Fetch the full lyrics of the song with lrc tags"""
        if "rclyricsband" in self.link:
            self.lyrics = RcLyricsBand.get_lyrics(self.link)
        else:
            self.lyrics = Megalobiz.get_lyrics(self.link)
        self.lyrics_without_lrc_tags = lyrics_without_tags(self.lyrics)

    def save(self, path: str):
        """Save the lyrics file"""
        with open(path, "w") as file:
            file.write(self.lyrics)

    def add_to_track(self, path: str):
        """
        Add the lyrics to track metadata
        `path`: path of the track
        """
        f = music_tag.load_file(path)
        f["lyrics"] = self.lyrics
        f.save()


class Lyricy:
    @staticmethod
    def search(query: str, provider=Providers.MEGALOBIZ) -> List[Lyrics]:
        """Search for a lyrics for given Query"""
        if provider == Providers.RCLYRICSBAND:
            r = RcLyricsBand.search_lyrics(query)
            return [Lyrics(**i.__dict__) for i in r]

        r = Megalobiz.search_lyrics(query)
        return [Lyrics(**i.__dict__) for i in r]
