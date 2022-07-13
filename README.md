# lyricy

A command line lyrics utitly tool which search and add lyrics to your offline songs.

## Why lyricy ?

We can use [spotDL/spotify-downloader](https://github.com/spotDL/spotify-downloader) to download our spotify playlist and songs along with album art and metadata. But it does not add the lyrics of the songs in song metadata. lyricy search for the lyrics of the song add to song metadata.

you can use [Retro music player](https://github.com/RetroMusicPlayer/RetroMusicPlayer) for andriod to listen the offlice local songs with synced lyrics.

## Installation

Direct installation using pip

```bash
pip install lyricy
```

## Features

- Easy to add lyrics to your offline songs
- Preview of lyrics
- Synced lyrics with lru time tags
- Lyrics lru without tags

## Usage

```txt
Usage: lyricy [OPTIONS] COMMAND [ARGS]...

  A CLI lyrics utility tool

Options:
  --help  Show this message and exit.

Commands:
  add     Search and add lyrics to given TRACK.
  remove  Remove lyrics from given TRACK.
  search  Search for lyrics for given track or query
  show    Show the lyrics of TRACK if available.
```

### Searching for lyrics using your queries

```txt
Usage:  [OPTIONS]

  Search for lyrics for given track or query

Options:
  -t, --track PATH       file path of track
  -d, --disable-preview  Disable the preview
  -l, --only-lyrics      Show Lyrics Only (without LRC tag)
  -q, --query TEXT       search query of track name
  --help                 Show this message and exit.
```

```bash
lyricy search --query "jolly yo gymkanna"
```

### Searching for lyrics for your track

Track must have ablum metameta `title`

```bash
lyricy search --track 'Imagine Dragons - Believer.mp3'
```

After searching it print list of lyrics, enter the index number lyrics to get the full lyrics

### Adding lyrics

Adding lyrics to track metadata to get synced lyrics

```txt
Usage: lyricy add [OPTIONS] TRACK

  Search and add lyrics to given TRACK.

  TRACK is the filepath of track.

Options:
  -d, --disable-preview  Disable the preview
  --show                 Print the lyrics and ask for confirmation
  --help                 Show this message and exit.
```

Track must have ablum metameta `title`

```bash
lyricy add 'Imagine Dragons - Believer.mp3'
```

select the prefferd lyrics for the song to add it

### Remove lyrics

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

### Show lyrics

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

## Source of lyrics

All lyrics are scraped from [https://www.megalobiz.com/](https://www.megalobiz.com/)

## Contributions

Contributions are Welcome. Feel free to report bugs in issue and fix some bugs by creating pull requests. Comments, Suggestions, Improvements and Enhancements are always welcome.
