"""cli script for download lyrics"""

import glob
import os
import re
import sys

import click
import music_tag
import pylrc
from rich import print
from rich.columns import Columns
from rich.console import Console
from rich.panel import Panel

from .classes import BaseLyrics
from . import __version__, __package__

console = Console()


def format_table(lyrics: BaseLyrics, disable_preview: bool) -> str:
    """render the table format for given lyrics"""
    title = lyrics.title
    sample_lyrics = lyrics.sample_lyrics
    index = lyrics.index
    if disable_preview:
        return f"[bold green]({index})[/bold green] [white]{title}[/white]"
    return (
        f"[bold green]({index})[/bold green] [bold white]{title}[/bold white]\n"
        f"[yellow]{sample_lyrics}[/yellow]"
    )


def print_help_msg(command: callable):  # type: ignore
    """Function print the help message on the console"""
    with click.Context(command) as ctx:
        click.echo(command.get_help(ctx))


def lyrics_without_tags(lyrics_with_lrc_tags: str) -> str:
    """Show Lyrics Only (without LRC tag)"""
    try:
        parsed_text = pylrc.parse(lyrics_with_lrc_tags)
        return "\n".join([line.text for line in parsed_text])
    except Exception:
        # Fallback if pylrc fails to parse (e.g. no timestamp tags)
        # Strip timestamp lines manually
        lines = []
        for line in lyrics_with_lrc_tags.split("\n"):
            clean_line = re.sub(r"\[\d+:\d+\.\d+\]", "", line).strip()
            if clean_line and not (
                line.startswith("[ti:")
                or line.startswith("[ar:")
                or line.startswith("[al:")
                or line.startswith("[by:")
            ):
                lines.append(clean_line)
        return "\n".join(lines)


def capitalized_lyrics(lyrics: str) -> str:
    if not lyrics:
        return ""
    lyrics_lines: list[str] = lyrics.strip().split("\n")
    lyrics_size: int = len(lyrics_lines)

    lyrics_start_index: int = 0  # skipping the lines, containing metadata tags
    for i in range(lyrics_size):
        if lyrics_lines[i] and not lyrics_lines[i][-1] == "]":
            lyrics_start_index = i
            break

    for i in range(lyrics_start_index, lyrics_size):
        try:  # for skipping blank lines
            match = re.search(r"[a-zA-Z]", lyrics_lines[i])
            if match:
                first_letter_index: int = match.start()
                lyrics_lines[i] = (
                    lyrics_lines[i][:first_letter_index]
                    + lyrics_lines[i][first_letter_index].upper()
                    + lyrics_lines[i][first_letter_index + 1 :]
                )
        except Exception:
            pass

    return "\n".join(lyrics_lines)


def get_provider_enum(provider_str: str):
    from . import Providers

    if provider_str == "lr":
        return Providers.LRCLIB
    elif provider_str == "bl":
        return Providers.BETTERLYRICS
    elif provider_str == "rc":
        return Providers.RCLYRICSBAND
    elif provider_str == "mo":
        return Providers.MEGALOBIZ
    return None  # Auto fallback mode


@click.group()
@click.version_option(__version__, package_name=__package__)
def cli():
    """
    A command line lyrics utility tool which search and add lyrics to your offline songs.

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
@click.option(
    "-p",
    "--provider",
    type=click.Choice(["lr", "bl", "rc", "mo"]),
    help="Lyrics provider name [lr] (LRCLIB), [bl] (BetterLyrics), [rc] (RcLyricsBand), [mo] (Megalobiz)",
)
def search(
    track: str,
    query: str,
    disable_preview: bool,
    only_lyrics: bool,
    save: str,
    provider: str,
):
    """Search for lyrics for given track or query"""
    title = ""
    artist = ""
    album = ""
    duration = -1

    if track:
        f = music_tag.load_file(track)
        if f is not None:
            title = str(f["title"]) if f["title"] else ""
            artist = str(f["artist"]) if f["artist"] else ""
            album = str(f["album"]) if f["album"] else ""
            try:
                duration = int(float(f["duration"]))
            except Exception:
                duration = -1

        if not title:
            # fallback to filename
            basename = os.path.splitext(os.path.basename(track))[0]
            if " - " in basename:
                parts = basename.split(" - ", 1)
                artist = parts[0].strip()
                title = parts[1].strip()
            else:
                title = basename.strip()
    elif query:
        title = query
    else:
        print_help_msg(search)
        sys.exit()

    search_query = title
    if artist and not query:
        search_query = f"{artist} - {title}"

    with console.status(f"[bold green]Searching lyrics for '{search_query}'...") as _:
        from . import Lyricy

        provider_enum = get_provider_enum(provider)
        results = Lyricy.search(
            search_query,
            provider=provider_enum,  # type: ignore
            artist_name=artist,
            duration=duration,
            album_name=album,
        )

    if not results or results[0].title in [
        "No result found",
        "No result found on BetterLyrics",
        "BetterLyrics: API key required for uncached query",
    ]:
        console.print(f"[red]❌ No lyrics found for: {search_query}[/]")
        if results and results[0].title.startswith("BetterLyrics"):
            console.print(f"[yellow]{results[0].sample_lyrics}[/]")
        sys.exit(1)

    songs_lyrics_renderables = [
        Panel(format_table(result, disable_preview), expand=True) for result in results
    ]
    console.print(Columns(songs_lyrics_renderables))

    selected_lyrics_index = (
        click.prompt("Enter the index of lyrics", type=int, default=1) - 1
    )
    if selected_lyrics_index < 0 or selected_lyrics_index >= len(results):
        console.print("[red]Invalid index selected.[/]")
        sys.exit(1)

    selected_lyrics = results[selected_lyrics_index]

    with console.status("[bold green]Fetching Lyrics...") as _:
        selected_lyrics.fetch()
        lyric = selected_lyrics.lyrics

    if only_lyrics:
        output_lyric = lyrics_without_tags(lyric)
    else:
        output_lyric = lyric

    if save:
        with open(f"{save}.lrc", "w") as file:
            file.write(output_lyric)
        console.print(f"[green]Saved lyrics to {save}.lrc[/]")
    else:
        print(output_lyric)


def process_single_track(
    track_path: str,
    show: bool,
    disable_preview: bool,
    lrc_file: str,
    query: str,
    provider: str,
    auto: bool,
):
    console.print(
        f"[bold blue]🎵 Processing track:[/] [bold yellow]{os.path.basename(track_path)}[/]"
    )
    f = music_tag.load_file(track_path)
    title = ""
    artist = ""
    album = ""
    duration = -1

    if f is not None:
        title = str(f["title"]) if f["title"] else ""
        artist = str(f["artist"]) if f["artist"] else ""
        album = str(f["album"]) if f["album"] else ""
        try:
            duration = int(float(f["duration"]))
        except Exception:
            duration = -1

    if not title:
        basename = os.path.splitext(os.path.basename(track_path))[0]
        if " - " in basename:
            parts = basename.split(" - ", 1)
            artist = parts[0].strip()
            title = parts[1].strip()
        else:
            title = basename.strip()

    if lrc_file:
        with open(lrc_file, "r") as file:
            lyric = file.read()
    else:
        search_query = query if query else title
        if artist and not query:
            search_query = f"{artist} - {title}"

        with console.status(
            f"[bold green]Searching lyrics for '{search_query}'..."
        ) as _:
            from . import Lyricy

            provider_enum = get_provider_enum(provider)
            results = Lyricy.search(
                search_query,
                provider=provider_enum,  # type: ignore
                artist_name=artist,
                duration=duration,
                album_name=album,
            )

        if not results or results[0].title in [
            "No result found",
            "No result found on BetterLyrics",
            "BetterLyrics: API key required for uncached query",
        ]:
            console.print(
                f"[red]❌ No lyrics found for track: {os.path.basename(track_path)}[/]"
            )
            if results and results[0].title.startswith("BetterLyrics"):
                console.print(f"[yellow]{results[0].sample_lyrics}[/]")
            return

        selected_lyrics = None
        if auto:
            selected_lyrics = results[0]
            console.print(
                f"[green]✓ Auto-selected lyrics: [bold]{selected_lyrics.title}[/ green][/]"
            )
        else:
            songs_lyrics_renderables = [
                Panel(format_table(result, disable_preview), expand=True)
                for result in results
            ]
            console.print(Columns(songs_lyrics_renderables))

            selected_lyrics_index = (
                click.prompt("Enter the index of lyrics", type=int, default=1) - 1
            )
            if selected_lyrics_index < 0 or selected_lyrics_index >= len(results):
                console.print("[red]Invalid index selected. Skipping...[/]")
                return
            selected_lyrics = results[selected_lyrics_index]

        with console.status("[bold green]Fetching lyrics content...") as _:
            selected_lyrics.fetch()
            lyric = selected_lyrics.lyrics  # pyright: ignore[reportOptionalSubscript]

    if not lyric:
        console.print("[red]❌ Lyrics fetched are empty. Skipping...[/]")
        return

    if show and not auto:
        print(lyric)
        if not click.confirm("Do you want to add this lyrics?", default=True):
            console.print("[yellow]Skipped.[/]")
            return

    with console.status("[bold green]Adding lyrics to track tags...") as _:
        f["lyrics"] = lyric  # pyright: ignore[reportOptionalSubscript]
        f.save()  # pyright: ignore[reportOptionalMemberAccess, reportOptionalSubscript]
        console.print(
            f"[bold green]✨ Successfully added lyrics to: {os.path.basename(track_path)}! ✨[/]\n"
        )


@click.command()
@click.argument("track", type=click.Path(exists=True))
@click.option("--query", "-q", help="search for this query instead of track name")
@click.option("--disable-preview", "-d", is_flag=True, help="Disable the preview")
@click.option("--show", is_flag=True, help="Print the lyrics and ask for confirmation")
@click.option("--lrc", type=click.Path(exists=True), help="Lyrics file to add on track")
@click.option(
    "-p",
    "--provider",
    type=click.Choice(["lr", "bl", "rc", "mo"]),
    help="Lyrics provider name [lr] (LRCLIB), [bl] (BetterLyrics), [rc] (RcLyricsBand), [mo] (Megalobiz)",
)
@click.option("--recursive", "-r", is_flag=True, help="Recursively process directories")
@click.option(
    "--auto", "-a", is_flag=True, help="Auto-match and save lyrics without prompting"
)
def add(
    track: str,
    show: bool,
    disable_preview: bool,
    lrc: str,
    query: str,
    provider: str,
    recursive: bool,
    auto: bool,
):
    """Search and add lyrics to given TRACK.

    TRACK can be an audio file path or a directory path.
    """
    audio_extensions = (".mp3", ".m4a", ".flac", ".wav", ".ogg", ".wma", ".mp4")

    if os.path.isdir(track):
        if recursive:
            search_path = os.path.join(track, "**", "*")
            files = [
                f
                for f in glob.glob(search_path, recursive=True)
                if os.path.isfile(f) and f.lower().endswith(audio_extensions)
            ]
        else:
            search_path = os.path.join(track, "*")
            files = [
                f
                for f in glob.glob(search_path)
                if os.path.isfile(f) and f.lower().endswith(audio_extensions)
            ]

        if not files:
            console.print("[yellow]No audio files found in the directory.[/]")
            return

        console.print(
            f"[bold green]📂 Found {len(files)} tracks to process in directory: {track}[/bold green]\n"
        )

        if not auto:
            auto = click.confirm(
                "Do you want to auto-match and write lyrics for all tracks without prompting?",
                default=True,
            )

        for f_path in files:
            try:
                process_single_track(
                    f_path, show, disable_preview, lrc, query, provider, auto
                )
            except Exception as e:
                console.print(
                    f"[red]Error processing {os.path.basename(f_path)}: {e}[/]\n"
                )
    else:
        process_single_track(track, show, disable_preview, lrc, query, provider, auto)


@click.command()
@click.argument("track", type=click.Path(exists=True))
def remove(track):
    """Remove lyrics from given TRACK.

    TRACK is the filepath of track.
    """
    f = music_tag.load_file(track)
    if f is not None:
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
    if f is None:
        console.print("[red]Error: Could not load track file.[/]")
        return

    lyric = str(f["lyrics"])
    if not lyric:
        console.print("[yellow]No lyrics found on this track.[/]")
        return

    if only_lyrics:
        print(lyrics_without_tags(lyric))
    else:
        print(lyric)


cli.add_command(search)
cli.add_command(add)
cli.add_command(remove)
cli.add_command(show)
