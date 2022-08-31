from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()
with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = fh.read()

setup(
    name="lyricy",
    version="1.3",
    author="Yogeshwaran R",
    author_email="yogeshin247@gmail.com",
    description="A command line lyrics utility tool which \
    search and add lyrics to your offline songs.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    license="MIT",
    url="https://github.com/yogeshwaran01/lyricy",
    download_url="https://github.com/yogeshwaran01/lyricy/archive/master.zip",
    packages=find_packages(),
    entry_points={"console_scripts": ["lyricy=lyricy.cli:cli"]},
    classifiers=(
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ),
    keywords="python package lyrics lrc yogeshwaran01 songs",
    install_requires=requirements,
)
