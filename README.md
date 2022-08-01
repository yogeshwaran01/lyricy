<!-- headings -->

<h1 align="center"> 🎼 lyricy </h1>

<p align="center">A command line lyrics utility tool which search and add lyrics to your offline songs.</p>

<!-- Badges -->

<p align="center">
    <a href="https://pypi.org/project/lyricy/">
    <img alt="PyPi" src="https://img.shields.io/pypi/v/lyricy.svg"/>
    </a>
    <a href="https://pepy.tech/project/lyricy">
    <img alt="Downloads" src="https://pepy.tech/badge/lyricy"/>
    </a>
    <a href="https://github.com/yogeshwaran01/lyricy/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/yogeshwaran01/lyricy"></a>
    <a href="https://github.com/yogeshwaran01/lyricy/network">
    <img alt="GitHub forks" src="https://img.shields.io/github/forks/yogeshwaran01/lyricy"></a>
    <a href="https://github.com/yogeshwaran01/lyricy/blob/master/LICENSE.txt">
    <img alt="GitHub license" src="https://img.shields.io/github/license/yogeshwaran01/lyricy?color=blue"/>
    </a>
    <a href="https://github.com/psf/black">
    <img alt="Code style" src="https://img.shields.io/badge/codestyle-Black-blue"/>
    </a>
    <img alt="GitHub Repo size" src="https://img.shields.io/github/repo-size/yogeshwaran01/lyricy"/>
    <a href="https://github.com/yogeshwaran01/lyricy/actions/workflows/python-publish.yml">
    <img alt="Upload lyricy to pypi" src="https://github.com/yogeshwaran01/lyricy/actions/workflows/python-publish.yml/badge.svg"/>
    </a>
    <a href="https://github.com/yogeshwaran01/lyricy/actions/workflows/python-package.yml">
    <img alt="Python package" src="https://github.com/yogeshwaran01/lyricy/actions/workflows/python-package.yml/badge.svg"/>
    </a>
</p>

</hr>

## Why lyricy ?

We can use [spotDL/spotify-downloader](https://github.com/spotDL/spotify-downloader) to download our spotify playlist and songs along with album art and metadata. But it does not add the lyrics of the songs in song metadata. lyricy search for the lyrics of the song add to song metadata.

you can use [Retro music player](https://github.com/RetroMusicPlayer/RetroMusicPlayer) for android to listen the offline local songs with synced lyrics.

## Features

- Used as a Python package, Desktop application and mobile application (PWA)
- Easy to add lyrics to your offline songs
- Preview of lyrics
- Synced lyrics with lrc time tags
- Lyrics without lrc tags
- Save lyrics as lrc file
- Add your own lyrics or downloaded lyrics to songs

## Usage

- [Using as GUI tool](#gui)
- [Using as a CLI tool](#cli)
- [Using as a python package](#python-package)

### GUI

GUI is built with [flet](https://flet.dev/)

![demo](https://raw.githubusercontent.com/yogeshwaran01/lyricy/master/demo/dem_lyricy_gui.gif)

- [Web Application](https://lyricy.yogeshwaran01.repl.co/#/)
- [Desktop Application for Linux](https://github.com/yogeshwaran01/lyricy/releases/download/1.2/lyricy-gui-linux.tar.gz)
- [Desktop Application for Windows](https://github.com/yogeshwaran01/lyricy/releases/download/1.2/lyricy-gui-windows.zip)
- Use PWA to install in android

### CLI

#### Installation

Using pip

```bash
pip install lyricy
```

Windows user download this [executable file](https://github.com/yogeshwaran01/lyricy/releases/download/1.2/lyricy.exe)

![demo](https://github.com/yogeshwaran01/lyricy/blob/master/demo/demo_lyricy.gif?raw=true)

```txt
Usage: python -m lyricy [OPTIONS] COMMAND [ARGS]...

  A command line lyrics utility tool which search and add lyrics to your
  offline songs.

Options:
  --help  Show this message and exit.

Commands:
  add     Search and add lyrics to given TRACK.
  remove  Remove lyrics from given TRACK.
  search  Search for lyrics for given track or query
  show    Show the lyrics of TRACK if available.
```

- [Searching for lyrics using your queries](#searching-for-lyrics-using-your-queries)
- [Searching for lyrics for your track](#searching-for-lyrics-for-your-track)
- [Adding lyrics](#adding-lyrics)
- [Remove lyrics](#remove-lyrics)
- [Changing lyrics provider](#changing-lyrics-provider)
- [Show lyrics](#show-lyrics)
- [Downloading lrc file](#downloading-lrc-file)
- [Add lrc file to song](#add-lrc-file-to-song)

#### Searching for lyrics using your queries

```txt
Usage: python -m lyricy search [OPTIONS]

  Search for lyrics for given track or query

Options:
  -t, --track PATH       file path of track
  -d, --disable-preview  Disable the preview
  -l, --only-lyrics      Show Lyrics Only (without LRC tag)
  -s, --save TEXT        Save file as .lrc
  -q, --query TEXT       search query of track name
  -p, --provider TEXT    Lyrics provider name [rc] or [mo]
  --help                 Show this message and exit.
```

```bash
lyricy search --query "jolly yo gymkanna"
```

#### Searching for lyrics for your track

Track must have album metadata `title`

```bash
lyricy search --track 'Imagine Dragons - Believer.mp3'
```

After searching it print list of lyrics, enter the index number lyrics to get the full lyrics

#### Adding lyrics

Adding lyrics to track metadata to get synced lyrics

```txt
Usage: python -m lyricy add [OPTIONS] TRACK

  Search and add lyrics to given TRACK.

  TRACK is the filepath of track.

Options:
  -q, --query TEXT       search for this query instead of track name
  -d, --disable-preview  Disable the preview
  --show                 Print the lyrics and ask for confirmation
  --lrc PATH             Lyrics file to add on track
  -p, --provider TEXT    Lyrics provider name [rc] or [mo]
  --help                 Show this message and exit.
```

```bash
lyricy add 'Imagine Dragons - Believer.mp3'
```

select the preferred lyrics for the song to add it

If track does not have metadata `title` or any other irrelevant name, use can use `--query` option to override this.

```bash
lyricy add 'some-track.mp3' --query "vikram title track"
```

#### Changing lyrics provider

By default the lyrics provider is is megalobiz, but you can use other provider is rclyricsband

- `rc` for [https://rclyricsband.com/](https://rclyricsband.com/)
- `mo` for [https://www.megalobiz.com/](https://www.megalobiz.com/)

```bash
lyricy add 'some-track.mp3' --query "vikram title track" --provider rc
```

```bash
lyricy search --query "karka kark" --provider mo
```

#### Remove lyrics

```txt
Usage: lyricy remove [OPTIONS] TRACK

  Remove lyrics from given TRACK.

  TRACK is the filepath of track.

Options:
  --help  Show this message and exit.
```

```bash
lyricy remove 'Imagine Dragons - Believer.mp3'
```

#### Show lyrics

```txt
Usage: lyricy show [OPTIONS] TRACK

  Show the lyrics of TRACK if available.

  TRACK is the filepath of track.

Options:
  -l, --only-lyrics  Show Lyrics Only (without LRC tag)
  --help             Show this message and exit.
```

```bash
lyricy show 'Imagine Dragons - Believer.mp31
```

#### Downloading lrc file

```bash
lyricy search --query "new york" --save "new_york"
```

This search and ask for the prompt, select any song it will download and save as `lrc` file

#### Add lrc file to song

```bash
lyricy add track.mp3 --lrc track.lrc
```

It will add the lyrics to song metadata

### Python Package

#### Install

Using pip

```bash
pip install lyricy
```

#### Simple Usage

```python
>>> from lyricy import Lyricy

>>> l = Lyricy()
>>> results = l.search("karka karka")
>>> selected_lyrics = results[0]
>>> selected_lyrics.fetch()

>>> selected_lyrics.lyrics
>>> selected_lyrics.lyrics_without_lrc_tags

```

#### Saving and adding lyrics to track

```python
>>> selected_lyrics.save("lyrics.lrc")
>>> selected_lyrics.add_to_track("path_to_track.mp3")
```

#### Using Other Providers

Default provider is [https://www.megalobiz.com/](https://www.megalobiz.com/), but you can use other provider is [https://rclyricsband.com/](https://rclyricsband.com/).

```python
>>> from lyricy import Lyricy, Providers

>>> l = Lyricy()
>>> results = l.search("vikram", provider=Providers.RCLYRICSBAND)
>>> selected_lyrics = results[0]
>>> selected_lyrics.fetch()

>>> selected_lyrics.lyrics
>>> selected_lyrics.lyrics_without_lrc_tags
```

## Lyrics Providers

- [https://www.megalobiz.com/](https://www.megalobiz.com/)
- [https://rclyricsband.com/](https://rclyricsband.com/)

## Contributions

Contributions are Welcome. Feel free to report bugs in issue and fix some bugs by creating pull requests. Comments, Suggestions, Improvements and Enhancements are always welcome.
