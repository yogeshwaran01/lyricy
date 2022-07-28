from lyricy import Lyricy, Lyrics, Providers

TEST_QUERY_1 = "karka karka"
FILE_PATH_1 = "karka_karka.lru"

TEST_QUERY_2 = "beast mode"
FILE_PATH_2 = "beast_mode.lru"


def test_lyricy_megalobiz():
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


def test_lyricy_rclyricsband():
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
