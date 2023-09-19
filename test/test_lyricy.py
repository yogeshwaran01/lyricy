import os

from lyricy import Lyricy, Lyrics, Providers

from test import TEST_QUERY_1, TEST_QUERY_2, FILE_PATH_1, FILE_PATH_2


def test_lyricy_megalobiz():
    """
    Test searching for lyrics and saving them using the 'megalobiz' provider.
    """
    lyricy = Lyricy()
    results: list[Lyrics] = lyricy.search(TEST_QUERY_1)
    selected_lyrics = results[0]
    selected_lyrics.fetch()
    assert type(selected_lyrics.lyrics) == str
    assert type(selected_lyrics.lyrics_without_lrc_tags) == str
    selected_lyrics.save(FILE_PATH_1)

    with open(FILE_PATH_1) as file:
        text = file.read()

    assert text == selected_lyrics.lyrics
    os.remove(os.path.join(os.getcwd(), FILE_PATH_1))


def test_lyricy_rclyricsband():
    """
    Test searching for lyrics and saving them using the 'rclyricsband' provider.
    """
    lyricy = Lyricy()
    results: list[Lyrics] = lyricy.search(TEST_QUERY_2, provider=Providers.RCLYRICSBAND)
    selected_lyrics = results[0]
    selected_lyrics.fetch()
    assert type(selected_lyrics.lyrics) == str
    assert type(selected_lyrics.lyrics_without_lrc_tags) == str
    selected_lyrics.save(FILE_PATH_2)

    with open(FILE_PATH_2) as file:
        text = file.read()

    assert text == selected_lyrics.lyrics
    os.remove(os.path.join(os.getcwd(), FILE_PATH_2))
