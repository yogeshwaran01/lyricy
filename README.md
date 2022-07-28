# 🎼 lyricy

A command line lyrics utility tool which search and add lyrics to your offline songs.

## Why lyricy ?

We can use [spotDL/spotify-downloader](https://github.com/spotDL/spotify-downloader) to download our spotify playlist and songs along with album art and metadata. But it does not add the lyrics of the songs in song metadata. lyricy search for the lyrics of the song add to song metadata.

you can use [Retro music player](https://github.com/RetroMusicPlayer/RetroMusicPlayer) for andriod to listen the offlice local songs with synced lyrics.

## Installation

Using pip

```bash
pip install lyricy
```

## Features

- Easy to add lyrics to your offline songs
- Preview of lyrics
- Synced lyrics with lrc time tags
- Lyrics without lrc tags
- Save lyrics as lrc file
- Add your own lyrics or downloaed lyrics to songs

## Usage

![demo](https://github.com/yogeshwaran01/lyricy/blob/master/demo/demo_lyricy.gif?raw=true)

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

- [Searching for lyrics using your queries](#searching-for-lyrics-using-your-queries)
- [Searching for lyrics for your track](#searching-for-lyrics-for-your-track)
- [Adding lyrics](#adding-lyrics)
- [Remove lyrics](#remove-lyrics)
- [Show lyrics](#show-lyrics)
- [Downloading lrc file](#downloading-lrc-file)
- [Add lrc file to song](#add-lrc-file-to-song)

### Searching for lyrics using your queries

```txt
Usage: python -m lyricy search [OPTIONS]

  Search for lyrics for given track or query

Options:
  -t, --track PATH       file path of track
  -d, --disable-preview  Disable the preview
  -l, --only-lyrics      Show Lyrics Only (without LRC tag)
  -s, --save TEXT        Save file as .lrc
  -q, --query TEXT       search query of track name
  --help                 Show this message and exit
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
Usage: python -m lyricy add [OPTIONS] TRACK

  Search and add lyrics to given TRACK.

  TRACK is the filepath of track.

Options:
  -q, --query TEXT       search for this query instead of track name
  -d, --disable-preview  Disable the preview
  --show                 Print the lyrics and ask for confirmation
  --lrc PATH             Lyrics file to add on track
  --help                 Show this message and exit.
```

```bash
lyricy add 'Imagine Dragons - Believer.mp3'
```

select the prefferd lyrics for the song to add it

If track does not have metadata `title` or any other unrevelant name, use can use `--query` option to override this.

```bash
lyricy add 'some-track.mp3' --query "vikram title track"
```

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

### Downloading lrc file

```bash
lyricy search --query "new york" --save "new_york"
```

This search and ask for the prompt, select any song it will download and save as `lrc` file

### Add lrc file to song

```bash
lyricy add track.mp3 --lrc track.lrc
```

It will add the lyrics to song metadata

## Source of lyrics

All lyrics are scraped from [https://www.megalobiz.com/](https://www.megalobiz.com/)

## Contributions

Contributions are Welcome. Feel free to report bugs in issue and fix some bugs by creating pull requests. Comments, Suggestions, Improvements and Enhancements are always welcome.
