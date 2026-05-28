import os
import pytest
from lyricy import Lyricy, Lyrics, Providers

TEST_QUERY_1 = "wasted"
FILE_PATH_1 = "wasted.lrc"

TEST_QUERY_2 = "beast mode"
FILE_PATH_2 = "beast_mode.lrc"

TEST_QUERY_3 = "Imagine Dragons Believer"
FILE_PATH_3 = "believer.lrc"


def test_lyricy_lrclib():
    """
    Test searching for lyrics and saving them using the modern 'lrclib' provider.
    """
    lyricy = Lyricy()
    results: list[Lyrics] = lyricy.search(TEST_QUERY_3, provider=Providers.LRCLIB)
    assert len(results) > 0
    selected_lyrics = results[0]

    # If no results found (rate limited or network issue), we skip gracefully
    if selected_lyrics.title == "No result found":
        pytest.skip("LrcLib search returned no results (possibly rate limited)")

    selected_lyrics.fetch()
    assert isinstance(selected_lyrics.lyrics, str)
    assert isinstance(selected_lyrics.lyrics_without_lrc_tags, str)
    selected_lyrics.save(FILE_PATH_3)

    assert os.path.exists(FILE_PATH_3)
    with open(FILE_PATH_3) as file:
        text = file.read()

    assert text == selected_lyrics.lyrics
    os.remove(FILE_PATH_3)


def test_lyricy_rclyricsband():
    """
    Test searching for lyrics and saving them using the updated 'rclyricsband' provider.
    """
    lyricy = Lyricy()
    results: list[Lyrics] = lyricy.search(TEST_QUERY_2, provider=Providers.RCLYRICSBAND)
    assert len(results) > 0
    selected_lyrics = results[0]

    if selected_lyrics.title == "No result found":
        pytest.skip("RcLyricsBand search returned no results")

    selected_lyrics.fetch()
    assert isinstance(selected_lyrics.lyrics, str)
    assert isinstance(selected_lyrics.lyrics_without_lrc_tags, str)
    selected_lyrics.save(FILE_PATH_2)

    assert os.path.exists(FILE_PATH_2)
    with open(FILE_PATH_2) as file:
        text = file.read()

    assert text == selected_lyrics.lyrics
    os.remove(FILE_PATH_2)


def test_lyricy_megalobiz():
    """
    Test searching for lyrics and saving them using the 'megalobiz' provider.
    """
    lyricy = Lyricy()
    results: list[Lyrics] = lyricy.search(TEST_QUERY_1, provider=Providers.MEGALOBIZ)
    assert len(results) > 0
    selected_lyrics = results[0]

    if selected_lyrics.title == "No result found":
        pytest.skip("Megalobiz search returned no results or is down (500/503)")

    selected_lyrics.fetch()
    assert isinstance(selected_lyrics.lyrics, str)
    assert isinstance(selected_lyrics.lyrics_without_lrc_tags, str)
    selected_lyrics.save(FILE_PATH_1)

    assert os.path.exists(FILE_PATH_1)
    with open(FILE_PATH_1) as file:
        text = file.read()

    assert text == selected_lyrics.lyrics
    os.remove(FILE_PATH_1)
