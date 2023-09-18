"""lyrics providers"""

from typing import List
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup

from .classes import BaseLyrics


class Megalobiz:
    """Search and scrape lyrics for Megalobiz site"""

    @staticmethod
    def search_lyrics(song_name: str) -> List[BaseLyrics]:
        """Search for lyrics"""

        results: List[BaseLyrics] = []
        search_link: str = "https://www.megalobiz.com/search/all?qry="
        markup: str = requests.get(search_link + quote_plus(song_name)).text
        soup = BeautifulSoup(markup, "html.parser")
        required_tags = soup.find_all("a", {"class": "entity_name"})

        outer_tags = soup.findAll("div", {"class": "details"})

        inner_tags = [
            outer_tags[i].find_all("span")[-1] for i in range(0, len(outer_tags), 2)
        ]

        sample_lyrics_list = [i.text for i in inner_tags]

        for index, tag in enumerate(required_tags):
            results.append(
                BaseLyrics(
                    title = tag.get("title"),
                    link = "https://www.megalobiz.com" + tag.get("href"),
                    sample_lyrics = sample_lyrics_list[index],
                    index = str(index + 1)
                )
            )

        if len(results) == 0:
            return [
                BaseLyrics(
                    title = "No result found", link = "", sample_lyrics = "", index = "1"
                )
            ]

        return results

    @staticmethod
    def get_lyrics(link: str) -> str:
        """Scrape the lyrics for given track link"""

        markup: str = requests.get(link).text
        soup = BeautifulSoup(markup, "html.parser")
        return (
            soup.find("div", {"class": "lyrics_details entity_more_info"})
            .find("span")
            .text
        )


class RcLyricsBand:
    """Search and scrape lyrics for RcLyricsBand site"""

    @staticmethod
    def search_lyrics(song_name: str) -> List[BaseLyrics]:
        """Search for lyrics"""

        search_link: str = "https://rclyricsband.com/?s="
        markup: str = requests.get(search_link + quote_plus(song_name)).text
        soup = BeautifulSoup(markup, "html.parser")
        outer_tags = soup.find_all("article", {"class": "post"})
        results: List[BaseLyrics] = []
        for index, outer_tag in enumerate(outer_tags):
            title_tag = outer_tag.find('h2', {'class': 'entry-title'})
            results.append(
                BaseLyrics(
                    title = title_tag.text.strip(),
                    link = title_tag.find('a').get('href'),
                    sample_lyrics = outer_tag.find('div', {'class': 'search-entry-summary'}).text.strip(),
                    index = str(index + 1)
                )
            )
        if len(results) == 0:
            return [
                BaseLyrics(
                    title = "No result found", link = "", sample_lyrics = "", index = "1"
                )
            ]
        return results

    @staticmethod
    def get_lyrics(link: str) -> str:
        """Scrape the lyrics for given track link"""

        markup: str = requests.get(link).text
        soup = BeautifulSoup(markup, "html.parser")
        lyric_text: str = soup.find(id = 'whole_lyrics_line').text.strip()
        if lyric_text[-4:].lower() == ".com":
            lyric_text: list[str] = lyric_text.split('\n')
            lyric_text.pop()
            lyric_text: str = "\n".join(lyric_text)
        return lyric_text
