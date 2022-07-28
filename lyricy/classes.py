from dataclasses import dataclass


@dataclass
class BaseLyrics:
    """Dataclass Class for lyrics"""

    title: str
    sample_lyrics: str
    link: str
    index: str
