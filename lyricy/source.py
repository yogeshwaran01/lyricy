from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup

from .classes import Lyrics


class Megalobiz:
    """Search and scrape lyrics for Megalobiz site"""

    def search_lyrics(song_name: str) -> list[Lyrics]:
        """Search for lyrics"""

        results = []
        search_link = "https://www.megalobiz.com/search/all?qry="
        markup = requests.get(search_link + quote_plus(song_name)).text
        soup = BeautifulSoup(markup, "html.parser")
        required_tags = soup.find_all("a", {"class": "entity_name"})

        outer_tags = soup.findAll("div", {"class": "details"})

        inner_tags = [
            outer_tags[i].find_all("span")[-1] for i in range(0, len(outer_tags), 2)
        ]

        sample_lyrics_list = [i.text for i in inner_tags]

        for index, tag in enumerate(required_tags):
            results.append(
                Lyrics(
                    title=tag.get("title"),
                    link="https://www.megalobiz.com" + tag.get("href"),
                    sample_lyrics=sample_lyrics_list[index],
                    index=str(index + 1),
                )
            )

        if len(results) == 0:
            return None

        else:
            return results

    def get_lyrics(link: str) -> str:
        """Scrape the lyrics for given track link"""

        markup = requests.get(link).text
        soup = BeautifulSoup(markup, "html.parser")
        return (
            soup.find("div", {"class": "lyrics_details entity_more_info"})
            .find("span")
            .text
        )


class RcLyricsBand:
    """Search and scrape lyrics for RcLyricsBand site"""

    def search_lyrics(song_name: str):
        """Search for lyrics"""

        search_link = "https://rclyricsband.com/?s="
        markup = requests.get(search_link + quote_plus(song_name)).text
        soup = BeautifulSoup(markup, "html.parser")
        outer_tags = soup.find_all("h2", {"class": "search-entry-title"})
        results = []
        for outer_tag in outer_tags:
            inner_tag = outer_tag.find("a")
            results.append(
                Lyrics(
                    title=inner_tag.get("title"),
                    link=inner_tag.get("href"),
                    sample_lyrics="",
                )
            )
        if len(results) == 0:
            return None
        else:
            return results

    def get_lyrics(link: str):
        """Scrape the lyrics for given track link"""

        markup = requests.get(link).text
        soup = BeautifulSoup(markup, "html.parser")
        return soup.find("div", {"class": "su-box su-box-style-default"}).text
