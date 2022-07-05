import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
import music_tag

search_link = "https://rclyricsband.com/?s="


def search_lyrics(song_name: str, one=True):
    print(f"Searching for {song_name}")
    markup = requests.get(search_link + quote_plus(song_name)).text
    soup = BeautifulSoup(markup, "html.parser")
    outer_tags = soup.find_all("h2", {"class": "search-entry-title"})
    results = []
    for outer_tag in outer_tags:
        inner_tag = outer_tag.find("a")
        results.append({"title": inner_tag.get("title"), "link": inner_tag.get("href")})
    if len(results) == 0:
        return None
    if one:
        print(f"Found Best Match: {results[0]['title']}")
        return results[0]
    else:
        results


def get_lyrics(link: str):
    print("Getting Lyrics ...")
    markup = requests.get(link).text
    soup = BeautifulSoup(markup, "html.parser")
    return soup.find("div", {"class": "su-box su-box-style-default"}).text


def set_lyrics_to_song(song_path: str):
    f = music_tag.load_file(song_path)
    title = str(f["title"])
    search_results = search_lyrics(title)
    if search_results:
        lyrics = get_lyrics(search_results["link"])
        print("Setting Lyrics ...")
        f["lyrics"] = lyrics
        f.save()
        print("Done :)")
    else:
        print("No Lyrics Found")


if __name__ == "__main__":
    import sys

    path = sys.argv[1]
    set_lyrics_to_song(path)
