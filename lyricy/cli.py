"""cli script for download lyrics"""

import sys

import click
import music_tag
import pylrc
from rich import print
from rich.columns import Columns
from rich.console import Console
from rich.panel import Panel

from .classes import BaseLyrics
from .providers import Megalobiz, RcLyricsBand
from . import __version__, __package__

console = Console()


def format_table(lyrics: BaseLyrics, disable_preview: bool) -> str:
    """render the table format for given lyrics"""
    title = lyrics.title
    sample_lyrics = lyrics.sample_lyrics
    index = lyrics.index
    if disable_preview:
        return f"[b]({index}){title}[/b]"
    return f"[b]({index}){title}[/b]\n[yellow]{sample_lyrics}"


def print_help_msg(command: callable):
    """Function print the help message on the console"""
    with click.Context(command) as ctx:
        click.echo(command.get_help(ctx))


def lyrics_without_tags(lyrics_with_lrc_tags: str) -> str:
    """Show Lyrics Only (without LRC tag)"""
    parsed_text = pylrc.parse(lyrics_with_lrc_tags)
    return "\n".join([line.text for line in parsed_text])


@click.group()
@click.version_option(__version__, package_name=__package__)
def cli():
    """
    A command line lyrics utility tool which search and add lyrics to your offline songs.

    Web: https://lyricy.yogeshwaran01.repl.co/#/ 
    
    GitHub: https://github.com/yogeshwaran01/lyricy
    """


@click.command()
@click.option("-t", "--track", type=click.Path(exists=True), help="file path of track")
@click.option("--disable-preview", "-d", is_flag=True, help="Disable the preview")
@click.option(
    "--only-lyrics", "-l", is_flag=True, help="Show Lyrics Only (without LRC tag)"
)
@click.option("-s", "--save", help="Save file as .lrc")
@click.option("-q", "--query", type=str, help="search query of track name")
@click.option("-p", "--provider", type=str, help="Lyrics provider name [rc] or [mo]")
def search(
    track: str,
    query: str,
    disable_preview: bool,
    only_lyrics: bool,
    save: str,
    provider: str,
):
    """Search for lyrics for given track or query"""
    if track:
        f = music_tag.load_file(track)
        title = str(f["title"])
    elif query:
        title = query

    else:
        print_help_msg(search)
        sys.exit()

    with console.status(f"[bold green]Searching lyrics for {title}") as _:
        if provider == "rc":
            results = RcLyricsBand.search_lyrics(title)
        else:
            results = Megalobiz.search_lyrics(title)

    songs_lyrics_renderables = [
        Panel(format_table(result, disable_preview), expand=True) for result in results
    ]
    console.print(Columns(songs_lyrics_renderables))

    selected_lyrics_index = str(
        click.prompt("Enter the index of lyrics", type=int, default=1) - 1
    )

    selected_lyrics = results[int(selected_lyrics_index)]

    with console.status("[bold green]Fetching Lyrics") as _:
        if provider == "rc":
            lyric = RcLyricsBand.get_lyrics(selected_lyrics.link)
        else:
            lyric = Megalobiz.get_lyrics(selected_lyrics.link)

    if only_lyrics:
        if save:
            with open(f"{save}.lrc", "w") as file:
                file.write(lyrics_without_tags(lyric))
        print(lyrics_without_tags(lyric))
    else:
        if save:
            with open(f"{save}.lrc", "w") as file:
                file.write(lyric)
        print(lyric)


@click.command()
@click.argument("track", type=click.Path(exists=True))
@click.option("--query", "-q", help="search for this query instead of track name")
@click.option("--disable-preview", "-d", is_flag=True, help="Disable the preview")
@click.option("--show", is_flag=True, help="Print the lyrics and ask for confirmation")
@click.option("--lrc", type=click.Path(exists=True), help="Lyrics file to add on track")
@click.option("-p", "--provider", type=str, help="Lyrics provider name [rc] or [mo]")
def add(
    track: str, show: bool, disable_preview: bool, lrc: str, query: str, provider: str
):
    """Search and add lyrics to given TRACK.

    TRACK is the filepath of track.
    """
    f = music_tag.load_file(track)
    if lrc:
        with open(lrc, "r") as file:
            lyric = file.read()
    else:
        if query:
            title = query
        else:
            title = str(f["title"])
        with console.status(f"[bold green]Searching lyrics for {title}") as _:
            if provider == "rc":
                results = RcLyricsBand.search_lyrics(title)
            else:
                results = Megalobiz.search_lyrics(title)
        songs_lyrics_renderables = [
            Panel(format_table(result, disable_preview), expand=True)
            for result in results
        ]
        console.print(Columns(songs_lyrics_renderables))

        selected_lyrics_index = str(
            click.prompt("Enter the index of lyrics", type=int, default=1) - 1
        )

        selected_lyrics = results[int(selected_lyrics_index)]
        with console.status("[bold green]Fetching Lyrics") as _:
            if provider == "rc":
                lyric = RcLyricsBand.get_lyrics(selected_lyrics.link)
            else:
                lyric = Megalobiz.get_lyrics(selected_lyrics.link)

    if show:
        print(lyric)

        if click.confirm("Do you want add this lyrics?", abort=True):
            with console.status("[bold green]Adding Lyrics") as _:
                f["lyrics"] = lyric
                f.save()
    with console.status("[bold green]Adding Lyrics") as _:
        f["lyrics"] = lyric
        f.save()
        click.echo("✨ Done ✨")


@click.command()
@click.argument("track", type=click.Path(exists=True))
def remove(track):
    """Remove lyrics from given TRACK.

    TRACK is the filepath of track.
    """
    f = music_tag.load_file(track)
    f["lyrics"] = ""
    f.save()
    click.echo("✨ Done ✨")


@click.command()
@click.argument("track", type=click.Path(exists=True))
@click.option(
    "--only-lyrics", "-l", is_flag=True, help="Show Lyrics Only (without LRC tag)"
)
def show(track, only_lyrics):
    """Show the lyrics of TRACK if available.

    TRACK is the filepath of track.
    """
    f = music_tag.load_file(track)
    lyric = str(f["lyrics"])
    if only_lyrics:
        print(lyrics_without_tags(lyric))
    else:
        print(lyric)


cli.add_command(search)
cli.add_command(add)
cli.add_command(remove)
cli.add_command(show)
