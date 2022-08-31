import os

import flet
from flet import (
    AlertDialog,
    Card,
    Column,
    Container,
    Icon,
    IconButton,
    ListTile,
    Page,
    ProgressBar,
    Row,
    Text,
    TextButton,
    Radio,
    RadioGroup,
    TextField,
    UserControl,
    colors,
    icons,
)
from lyricy import Lyrics, Lyricy, Providers


class LyricView(
    UserControl,
):
    def __init__(self, lyrics: Lyrics):
        super().__init__()
        self.lyrics = lyrics

    def build(self):
        subtext = Text(self.lyrics.sample_lyrics, selectable=True)
        self.pb = ProgressBar(
            width=600,
            color=colors.ON_SURFACE_VARIANT,
            bgcolor=colors.AMBER,
            visible=False,
        )

        def copy_to_clipboard(e):
            dlg_modal.open = False
            dlg_modal.update()
            self.page.set_clipboard(self.lyrics.lyrics)
            # self.page.show_snack_bar(SnackBar(Text(f"Copied "), open=True))

        def close_dlg(e):
            dlg_modal.open = False
            self.update()

        def show_lyrics(e):
            self.pb.visible = True
            self.pb.update()
            self.lyrics.fetch()
            self.page.dialog = dlg_modal
            dlg_modal.content = Text(self.lyrics.lyrics, selectable=True)
            dlg_modal.data = self.lyrics.lyrics
            dlg_modal.update()
            dlg_modal.open = True
            self.pb.visible = False
            self.pb.update()
            self.update()

        dlg_modal = AlertDialog(
            modal=True,
            title=Text(self.lyrics.title),
            actions=[
                TextButton("Copy", on_click=copy_to_clipboard, icon=icons.COPY),
                TextButton("Close", on_click=close_dlg, icon=icons.CLOSE),
            ],
            actions_alignment="end",
            on_dismiss=lambda e: print("Modal dialog dismissed!"),
        )

        return Column(
            controls=[
                Card(
                    content=Container(
                        content=Column(
                            [
                                ListTile(
                                    leading=Icon(icons.LYRICS),
                                    title=Text(self.lyrics.title),
                                    subtitle=subtext,
                                ),
                                self.pb,
                                Row(
                                    [
                                        TextButton(
                                            "Show full lyrics", on_click=show_lyrics
                                        )
                                    ],
                                    alignment="end",
                                ),
                                dlg_modal,
                            ]
                        ),
                        width=600,
                        padding=10,
                    )
                )
            ]
        )


class LyricyApp(UserControl):
    def build(self):

        self.pb = ProgressBar(
            width=600,
            color=colors.ON_SURFACE_VARIANT,
            bgcolor=colors.AMBER,
            visible=False,
        )

        self.search_query = TextField(
            hint_text="Search for title of the track",
            expand=True,
            autofocus=True,
            on_submit=lambda e: self.search_btn_clicked(e),
        )

        self.provider_query = RadioGroup(
            content=Row(
                [
                    Radio(value="mo", label="Provider 1"),
                    Radio(value="rc", label="Provider 2"),
                ]
            )
        )

        self.results = Column()
        self.action_btn = IconButton(icons.SEARCH, on_click=self.search_btn_clicked)

        return Column(
            expand=True,
            width=600,
            controls=[
                Row(
                    controls=[
                        self.search_query,
                        self.action_btn,
                    ]
                ),
                self.provider_query,
                self.pb,
                self.results,
            ],
        )

    def search_btn_clicked(self, e):
        self.pb.visible = True
        self.pb.update()
        self.search_query.disabled = True
        self.action_btn.disabled = True
        self.update()
        self.results.clean()
        if self.provider_query.value == "rc":
            results = Lyricy.search(
                self.search_query.value, provider=Providers.RCLYRICSBAND
            )
        else:
            results = Lyricy.search(self.search_query.value)
        for result in results:
            self.results.controls.append(LyricView(result))
        self.pb.visible = False
        self.pb.update()
        self.search_query.disabled = False
        self.action_btn.disabled = False
        self.search_query.value = ""
        self.update()


def main(page: Page):
    page.title = "Lyricy - The Lyrics search Engine"
    page.horizontal_alignment = "center"
    page.add(Text("Lyricy", style="headlineLarge"))
    page.add(
        Text(
            "https://github.com/yogeshwaran01/lyricy",
            style="titleSmall",
            selectable=True,
        )
    )
    page.scroll = "adaptive"
    page.update()
    page.add(LyricyApp())


port = int(os.environ.get("PORT", 5000))
flet.app(target=main, port=port)
