"""lyrics providers"""

import os
import re
from typing import List
from urllib.parse import quote_plus
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup

from .classes import BaseLyrics


def parse_ttml_time(time_str: str) -> str:
    """
    Convert TTML timestamp (e.g., '00:00:12.500' or '12.5' or '00:01:23.45')
    into LRC timestamp format '[mm:ss.xx]'
    """
    if not time_str:
        return ""

    # Strip any suffix like 's'
    time_str = time_str.strip().rstrip("s")

    # Handle hh:mm:ss.mss format
    parts = time_str.split(":")
    if len(parts) == 3:
        try:
            hours = int(parts[0])
            minutes = int(parts[1])
            seconds_part = parts[2]

            # Split seconds and milliseconds
            if "." in seconds_part:
                sec_str, ms_str = seconds_part.split(".")
                seconds = int(sec_str)
                # Pad or truncate milliseconds to 2 digits (centiseconds)
                centiseconds = int(ms_str[:2].ljust(2, "0"))
            else:
                seconds = int(seconds_part)
                centiseconds = 0

            total_minutes = hours * 60 + minutes
            return f"[{total_minutes:02d}:{seconds:02d}.{centiseconds:02d}]"
        except ValueError:
            return ""

    elif len(parts) == 2:
        try:
            minutes = int(parts[0])
            seconds_part = parts[1]

            if "." in seconds_part:
                sec_str, ms_str = seconds_part.split(".")
                seconds = int(sec_str)
                centiseconds = int(ms_str[:2].ljust(2, "0"))
            else:
                seconds = int(seconds_part)
                centiseconds = 0

            return f"[{minutes:02d}:{seconds:02d}.{centiseconds:02d}]"
        except ValueError:
            return ""

    else:
        # Just seconds (e.g., '72.5' or '120')
        try:
            total_seconds = float(time_str)
            minutes = int(total_seconds // 60)
            seconds = int(total_seconds % 60)
            centiseconds = int(round((total_seconds % 1) * 100))
            if centiseconds == 100:
                seconds += 1
                centiseconds = 0
                if seconds == 60:
                    minutes += 1
                    seconds = 0
            return f"[{minutes:02d}:{seconds:02d}.{centiseconds:02d}]"
        except ValueError:
            return ""


def ttml_to_lrc(ttml_text: str) -> str:
    """
    Parse TTML XML string and convert to LRC format
    """
    if not ttml_text:
        return ""

    try:
        root = ET.fromstring(ttml_text)
        lines = []

        def recurse_elements(element):
            begin = element.get("begin")
            if begin is not None:
                text = "".join(element.itertext()).strip()
                if text:
                    lrc_time = parse_ttml_time(begin)
                    if lrc_time:
                        lines.append((begin, f"{lrc_time}{text}"))

            for child in element:
                recurse_elements(child)

        recurse_elements(root)

        if lines:
            return "\n".join([text for _, text in lines])

    except Exception:
        pass

    # Fallback regex parsing if XML parsing fails or returns empty
    lines = []
    p_matches = re.findall(
        r'<p\s+[^>]*begin="([^"]+)"[^>]*>(.*?)</p>', ttml_text, re.DOTALL
    )
    for begin, content in p_matches:
        text = re.sub(r"<[^>]+>", "", content).strip()
        lrc_time = parse_ttml_time(begin)
        if lrc_time and text:
            lines.append(f"{lrc_time}{text}")

    return "\n".join(lines)


class LrcLib:
    """Search and retrieve lyrics for LrcLib API"""

    @staticmethod
    def search_lyrics(song_name: str) -> List[BaseLyrics]:
        """Search for lyrics"""
        results: List[BaseLyrics] = []
        search_link = "https://lrclib.net/api/search?q="
        headers = {"User-Agent": "lyricy (https://github.com/yogeshwaran01/lyricy)"}
        try:
            r = requests.get(
                search_link + quote_plus(song_name), headers=headers, timeout=10
            )
            if r.status_code == 200:
                data = r.json()
                for index, item in enumerate(data):
                    lyrics_content = (
                        item.get("syncedLyrics") or item.get("plainLyrics") or ""
                    )

                    sample = ""
                    if lyrics_content:
                        clean_lines = [
                            re.sub(r"\[\d+:\d+\.\d+\]", "", line).strip()
                            for line in lyrics_content.split("\n")
                        ]
                        clean_lines = [line for line in clean_lines if line]
                        sample = " | ".join(clean_lines[:3])

                    title = f"{item.get('trackName')} - {item.get('artistName')}"
                    if item.get("albumName"):
                        title += f" ({item.get('albumName')})"

                    results.append(
                        BaseLyrics(
                            title=title,
                            link=f"lrclib:{item.get('id')}",
                            sample_lyrics=sample,
                            index=str(index + 1),
                        )
                    )
        except Exception:
            pass

        if len(results) == 0:
            return [
                BaseLyrics(
                    title="No result found", link="", sample_lyrics="", index="1"
                )
            ]
        return results

    @staticmethod
    def get_lyrics(link: str) -> str:
        """Get lyrics from LrcLib ID"""
        if link.startswith("lrclib:"):
            id_val = link.split(":")[1]
            headers = {"User-Agent": "lyricy (https://github.com/yogeshwaran01/lyricy)"}
            try:
                r = requests.get(
                    f"https://lrclib.net/api/get/{id_val}", headers=headers, timeout=10
                )
                if r.status_code == 200:
                    item = r.json()
                    return item.get("syncedLyrics") or item.get("plainLyrics") or ""
            except Exception:
                pass
        return ""


class BetterLyrics:
    """BetterLyrics provider (https://lyrics-api.boidu.dev)"""

    @staticmethod
    def search_lyrics(
        song_name: str, artist_name: str = "", duration: int = -1, album_name: str = ""
    ) -> List[BaseLyrics]:
        """
        Since BetterLyrics is a direct lookup API, we call getLyrics with metadata.
        """
        title = song_name
        artist = artist_name
        if not artist and " - " in song_name:
            parts = song_name.split(" - ", 1)
            artist = parts[0].strip()
            title = parts[1].strip()

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        }

        api_key = os.environ.get("BETTER_LYRICS_API_KEY")
        if api_key:
            headers["X-API-Key"] = api_key

        params = {"s": title, "a": artist}
        if duration and duration > 0:
            params["d"] = str(duration)
        if album_name:
            params["al"] = album_name

        try:
            r = requests.get(
                "https://lyrics-api.boidu.dev/getLyrics",
                headers=headers,
                params=params,
                timeout=15,
            )
            if r.status_code == 200:
                data = r.json()
                ttml = data.get("ttml")
                if ttml:
                    lrc_content = ttml_to_lrc(ttml)
                    if lrc_content:
                        import base64

                        encoded_lrc = base64.b64encode(
                            lrc_content.encode("utf-8")
                        ).decode("utf-8")
                        sample = " | ".join(
                            [
                                re.sub(r"\[\d+:\d+\.\d+\]", "", line).strip()
                                for line in lrc_content.split("\n")
                                if line
                            ][:3]
                        )

                        return [
                            BaseLyrics(
                                title=f"{title} - {artist} (BetterLyrics)",
                                link=f"betterlyrics:embed:{encoded_lrc}",
                                sample_lyrics=sample,
                                index="1",
                            )
                        ]
            elif r.status_code == 401:
                return [
                    BaseLyrics(
                        title="BetterLyrics: API key required for uncached query",
                        link="",
                        sample_lyrics="Please set BETTER_LYRICS_API_KEY environment variable.",
                        index="1",
                    )
                ]
        except Exception:
            pass

        return [
            BaseLyrics(
                title="No result found on BetterLyrics",
                link="",
                sample_lyrics="",
                index="1",
            )
        ]

    @staticmethod
    def get_lyrics(link: str) -> str:
        """Decode embedded lyrics"""
        if link.startswith("betterlyrics:embed:"):
            import base64

            encoded_lrc = link.split("betterlyrics:embed:")[1]
            return base64.b64decode(encoded_lrc.encode("utf-8")).decode("utf-8")
        return ""


class Megalobiz:
    """Search and scrape lyrics for Megalobiz site"""

    @staticmethod
    def search_lyrics(song_name: str) -> List[BaseLyrics]:
        """Search for lyrics"""
        results: List[BaseLyrics] = []
        search_link: str = "https://www.megalobiz.com/search/all?qry="
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        try:
            r = requests.get(
                search_link + quote_plus(song_name), headers=headers, timeout=10
            )
            if r.status_code != 200:
                return [
                    BaseLyrics(
                        title="No result found", link="", sample_lyrics="", index="1"
                    )
                ]

            markup: str = r.text
            soup = BeautifulSoup(markup, "html.parser")
            required_tags = soup.find_all("a", {"class": "entity_name"})

            outer_tags = soup.find_all("div", {"class": "details"})

            inner_tags = [
                outer_tags[i].find_all("span")[-1] for i in range(0, len(outer_tags), 2)
            ]

            sample_lyrics_list = [i.text for i in inner_tags]

            for index, tag in enumerate(required_tags):
                sample = (
                    sample_lyrics_list[index]
                    if index < len(sample_lyrics_list)
                    else "Click to fetch"
                )
                raw_title = tag.get("title")
                title_str = str(raw_title) if raw_title else ""
                raw_href = tag.get("href")
                link_str = (
                    "https://www.megalobiz.com" + str(raw_href) if raw_href else ""
                )

                results.append(
                    BaseLyrics(
                        title=title_str,
                        link=link_str,
                        sample_lyrics=sample,
                        index=str(index + 1),
                    )
                )
        except Exception:
            pass

        if len(results) == 0:
            return [
                BaseLyrics(
                    title="No result found", link="", sample_lyrics="", index="1"
                )
            ]

        return results

    @staticmethod
    def get_lyrics(link: str) -> str:
        """Scrape the lyrics for given track link"""
        if not link:
            return ""
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        try:
            markup: str = requests.get(link, headers=headers, timeout=10).text
            soup = BeautifulSoup(markup, "html.parser")
            details_div = soup.find("div", {"class": "lyrics_details entity_more_info"})
            if details_div is not None:
                span = details_div.find("span")
                if span is not None:
                    return span.text
            return ""
        except Exception:
            return ""


class RcLyricsBand:
    """Search and scrape lyrics for RcLyricsBand site"""

    @staticmethod
    def search_lyrics(song_name: str) -> List[BaseLyrics]:
        """Search for lyrics"""
        results: List[BaseLyrics] = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        data = {"search": song_name}
        try:
            r = requests.post(
                "https://rclyricsband.com/", headers=headers, data=data, timeout=10
            )
            if r.status_code != 200:
                return [
                    BaseLyrics(
                        title="No result found", link="", sample_lyrics="", index="1"
                    )
                ]

            soup = BeautifulSoup(r.text, "html.parser")
            search_container = soup.find("div", {"class": "search-results"})
            if not search_container:
                return [
                    BaseLyrics(
                        title="No result found", link="", sample_lyrics="", index="1"
                    )
                ]

            links = search_container.find_all("a", {"class": "song_search"})
            for index, a_tag in enumerate(links):
                raw_href = a_tag.get("href")
                if raw_href:
                    href = str(raw_href)
                    if not href.startswith("http"):
                        link = "https://rclyricsband.com/" + href
                    else:
                        link = href
                else:
                    link = ""

                results.append(
                    BaseLyrics(
                        title=a_tag.text.strip(),
                        link=link,
                        sample_lyrics="Click to fetch synchronized lyrics",
                        index=str(index + 1),
                    )
                )
        except Exception:
            pass

        if len(results) == 0:
            return [
                BaseLyrics(
                    title="No result found", link="", sample_lyrics="", index="1"
                )
            ]
        return results

    @staticmethod
    def get_lyrics(link: str) -> str:
        """Scrape the lyrics for given track link"""
        if not link:
            return ""
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        try:
            markup: str = requests.get(link, headers=headers, timeout=10).text
            soup = BeautifulSoup(markup, "html.parser")
            lrc_tag = soup.find(id="lrc_text")
            if lrc_tag:
                lyric_text = lrc_tag.text.strip()
            else:
                lrc_tag = soup.find(class_="lrc_text_format")
                if lrc_tag:
                    lyric_text = lrc_tag.text.strip()
                else:
                    lyric_tag = soup.find(id="whole_lyrics_line")
                    if lyric_tag:
                        lyric_text = lyric_tag.text.strip()
                    else:
                        return ""

            if lyric_text[-4:].lower() == ".com":
                lyric_text_lines: list[str] = lyric_text.split("\n")
                lyric_text_lines.pop()
                lyric_text = "\n".join(lyric_text_lines)
            return lyric_text
        except Exception:
            return ""
