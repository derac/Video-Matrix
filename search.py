"""This module contains the searching and parsing mechanisms"""

import re
import json
import pickle

from time import time
from os import path, makedirs
from random import randint, choice

import youtube_dl

from bs4 import BeautifulSoup
from requests import post

# initialization
BLACKLIST = " AND NOT (%s) " % " OR ".join(
    "site:" + s.rstrip() for s in open("static/BLACKLIST.txt")
)  # create blacklist site query
ydl = youtube_dl.YoutubeDL(
    {
        "format": "([protocol=https]/[protocol=http])[ext=mp4]",
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "socket_timeout": 5,
    }
)  # initialize ydl
if not path.exists("cache"):
    makedirs("cache")  # make cache dir if it doesn't exist
with open("static/search_terms.txt") as f:
    search_terms = [
        l.rstrip() for l in f
    ]  # generate search term list for use with retry and testing


def get_file_link(search, hd_toggle=0, results=30):
    """Scrapes Bing and uses youtube_dl to return direct video link"""
    run_id, start = randint(1000, 9999), time()
    log(run_id, start, "SEARCH:", search)  # Logging and profiling
    search_cache, links = (
        "cache/%s_%s.pkl"
        % (hd_toggle, re.sub(r"[^A-Za-z0-9_]+", "", search.replace(" ", "_").lower())),
        [],
    )
    if path.exists(search_cache):
        with open(search_cache, "rb") as search_cache_file:
            links = pickle.load(search_cache_file)
    else:  # if path exists, load it. otherwise, parse the search url
        try:
            links = scrape_bing(search, hd_toggle)
            with open(search_cache, "wb") as search_cache_file:
                pickle.dump(links, search_cache_file)  # write to cache if successful
        except Exception as exception:
            log(run_id, start, " ERROR:", exception)
    if not links:
        return retry(search, hd_toggle, results)  # retry if no links were returned
    log(run_id, start, " LINKS:", len(links))

    choices, file_link = links[:results], None  # limit results
    while not file_link:  # Use youtube_dl to get a direct video link
        link = choice(choices)
        log(run_id, start, "TRYING:", link)  # get next potential link and log it
        try:
            file_link = ydl.extract_info(link, download=False).get(
                "url", None
            )  # try youtube_dling it
        except Exception as _:
            links.remove(link)
            choices = links[:results]
            with open(search_cache, "wb") as search_cache_file:
                pickle.dump(links, search_cache_file)  # update cache
        if not choices and not file_link:
            return retry(
                search, hd_toggle, results
            )  # retry if out of choices and no direct link found
    log(run_id, start, "$$$$$$:", file_link)
    return file_link  # log and return the direct link


def url_to_links(url, soup_to_links, cookies):
    """Scrape links from """
    try:
        soup = BeautifulSoup(
            post(url, cookies=cookies).content, "html.parser"
        )  # post request to search page and parse
    except Exception as exception:
        raise exception from Exception("Error during url scrape:", exception)
    links = soup_to_links(soup)
    if not links:
        raise Exception("No links were found from the search url.")
    return links


def scrape_bing(search, hd_toggle):
    """Scrape video links from Bing"""
    page, hd_toggle = (
        "&first=0&count=105",
        "+filterui:resolution-720p" if hd_toggle else "",
    )  # The results can be paginated, max 105 per page
    search_url = (
        f"https://www.bing.com/videos/asyncv2?q="
        f"{search}{BLACKLIST}&async=content{page}{hd_toggle}"
    )
    try:
        return url_to_links(
            search_url,
            lambda soup: [
                json.loads(link["vrhm"])["pgurl"] for link in soup.select("div.vrhdata")
            ],
            cookies={},
        )
    # cookies = {'SRCHHPGUSR':'ADLT=OFF&CW=1117&CH=1771&DPR=2&UTC=-360&HV='+str(int(time()))})
    except Exception as exception:
        raise exception from exception


def retry(search, hd_toggle, results):
    """
    retry getting the file link
    expands to max results, then tries a random search term
    """
    return get_file_link(
        choice(search_terms) if results == 105 else search, hd_toggle, 105
    )


def log(run_id, start, *args):
    """logs some information with an id and time"""
    print(
        run_id, "%ss" % "{0:.2f}".format(time() - start)[:4], *args
    )  # Log with execution number and seconds get_file_link has been running


if __name__ == "__main__":
    get_file_link(choice(search_terms))  # get one link for testing
