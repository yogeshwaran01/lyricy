import music_tag
from .source import Megalobiz

from .classes import BaseLyrics
from .cli import lyrics_without_tags


class Lyrics(BaseLyrics):
    
    def fetch(self):
        self.lyrics = Megalobiz.get_lyrics(self.link)
        self.lyrics_without_lrc_tags = lyrics_without_tags(self.lyrics)

    def save(self, path):
        with open(path, 'w') as file:
            file.write(Megalobiz.get_lyrics(self.link))

    def add_to_track(self, path):
        f = music_tag.load_file(path)
        f['lyrics'] = self.lyrics
        f.save()

class Lyricy:
    
    def __init__(self, query: str) -> None:
        self.query = query
        self.results = []
    
    @classmethod
    def from_track(cls, path: str):
        f = music_tag.load_file(path)
        return cls(str(f['title']))
    
    def search(self):
        r = Megalobiz.search_lyrics(self.query)
        self.results = [Lyrics(**i.__dict__) for i in r]
