from setuptools import setup, find_packages

try:
    with open("README.md", "r", encoding="utf-8") as fh:
        long_description = fh.read()
except FileNotFoundError:
    long_description = "A command line lyrics utility tool which search and add lyrics to your offline songs."

setup(
    name="lyricy",
    version="1.5",
    author="Yogeshwaran R",
    author_email="yogeshin247@gmail.com",
    description="A command line lyrics utility tool which search and add lyrics to your offline songs.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    license="MIT",
    url="https://github.com/yogeshwaran01/lyricy",
    download_url="https://github.com/yogeshwaran01/lyricy/archive/master.zip",
    packages=find_packages(),
    entry_points={"console_scripts": ["lyricy=lyricy.cli:cli"]},
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    keywords="python package lyrics lrc yogeshwaran01 songs",
    install_requires=[
        "beautifulsoup4>=4.12.3",
        "certifi>=2024.2.2",
        "charset-normalizer>=3.3.2",
        "click>=8.1.7",
        "idna>=3.6",
        "music-tag>=0.4.3",
        "mutagen>=1.47.0",
        "Pygments>=2.17.2",
        "pylrc>=0.1.2",
        "requests>=2.31.0",
        "rich>=13.7.1",
        "soupsieve>=2.5",
        "urllib3>=2.2.1",
    ],
)
