import sys

import click
import music_tag
import pylrc
from rich import print
from rich.columns import Columns
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

from .classes import Lyrics
from .source import Megalobiz


console = Console()


def format_table(lyrics: Lyrics, disable_preview: bool) -> str:
    title = lyrics.title
    sample_lyrics = lyrics.sample_lyrics
    index = lyrics.index
    if disable_preview:
        return f"[b]({index}){title}[/b]"
    return f"[b]({index}){title}[/b]\n[yellow]{sample_lyrics}"


def print_help_msg(command: callable):
    with click.Context(command) as ctx:
        click.echo(command.get_help(ctx))


def lyrics_without_tags(lyrics_with_lrc_tags: str) -> str:
    """Show Lyrics Only (without LRC tag)"""
    parsed_text = pylrc.parse(lyrics_with_lrc_tags)
    return "\n".join([line.text for line in parsed_text])


@click.group()
def cli():
    """
    A CLI lyrics utility tool
    """
    pass


@click.command()
@click.option("-t", "--track", type=click.Path(exists=True), help="file path of track")
@click.option("--disable-preview", "-d", is_flag=True, help="Disable the preview")
@click.option(
    "--only-lyrics", "-l", is_flag=True, help="Show Lyrics Only (without LRC tag)"
)
@click.option("-s", "--save", help="Save file as .lrc")
@click.option("-q", "--query", type=str, help="search query of track name")
def search(track: str, query: str, disable_preview: bool, only_lyrics: bool, save: str):
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
        lyric = Megalobiz.get_lyrics(selected_lyrics.link)

    if only_lyrics:
        if save:
            with open(f"{save}.lru", "w") as file:
                file.write(lyrics_without_tags(lyric))
        print(lyrics_without_tags(lyric))
    else:
        if save:
            with open(f"{save}.lru", "w") as file:
                file.write(lyric)
        print(lyric)


@click.command()
@click.argument("track", type=click.Path(exists=True))
@click.option("--query", "-q", help="search for this query instead of track")
@click.option("--disable-preview", "-d", is_flag=True, help="Disable the preview")
@click.option("--show", is_flag=True, help="Print the lyrics and ask for confirmation")
@click.option("--lru", type=click.Path(exists=True), help="Lyrics file to add on track")
def add(track: str, show: bool, disable_preview: bool, lru: str, query: str):
    """Search and add lyrics to given TRACK.

    TRACK is the filepath of track.
    """
    f = music_tag.load_file(track)
    if lru:
        with open(lru, "r") as file:
            lyric = file.read()
    else:
        if query:
            title = query
        else:
            title = str(f["title"])
        with console.status(f"[bold green]Searching lyrics for {title}") as _:
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
