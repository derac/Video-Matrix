import youtube_dl, json, pickle, re

from time import time
from os import path, makedirs
from requests import post
from bs4 import BeautifulSoup
from random import randint, choice

# initialization
blacklist = ' AND NOT (%s) ' % ' OR '.join('site:'+s.rstrip() for s in open('static/blacklist.txt')) # create blacklist site query
whitelist = ' AND (%s) ' % ' OR '.join('site:'+s.rstrip() for s in []) # put whitelist in list for testing purposes
ydl = youtube_dl.YoutubeDL({'format':'([protocol=https]/[protocol=http])[ext=mp4]','quiet':True,'no_warnings':True,
                            'noplaylist':True,'socket_timeout':5}) # initialize ydl
if not path.exists('cache'): makedirs('cache') # make cache dir if it doesn't exist
with open('static/search_terms.txt') as f: search_terms = [l.rstrip() for l in f] # generate search term list for use with retry and testing

def get_file_link(search, hd=0, results=30):
    """Scrapes Bing and uses youtube_dl to return direct video link"""
    run_id,start = randint(1000,9999),time()
    log(run_id, start, "SEARCH:", search) # Logging and profiling
    search_cache,links = 'cache/%s_%s.pkl'%(hd,re.sub(r'[^A-Za-z0-9_]+','',search.replace(' ','_').lower())),[]
    if path.exists(search_cache):
        with open(search_cache, 'rb') as f: links = pickle.load(f)
    else: # if path exists, load it. otherwise, parse the search url
        try:
            links = scrape_bing(search, hd)
            with open(search_cache, 'wb') as f: pickle.dump(links, f) # write to cache if successful
        except Exception as e: log(run_id, start, " ERROR:", e)
    if not links: return retry(search, hd, results) # retry if no links were returned
    log(run_id, start, " LINKS:", len(links))

    choices, file_link = links[:results], None # limit results
    while not file_link: # Use youtube_dl to get a direct video link
        link = choice(choices)
        log(run_id, start, "TRYING:", link) # get next potential link and log it
        try: file_link = ydl.extract_info(link, download=False).get("url", None) # try youtube_dling it
        except:
            links.remove(link)
            choices = links[:results] 
            with open(search_cache, 'wb') as f: pickle.dump(links, f) # update cache
        if not choices and not file_link: return retry(search, hd, results) # retry if out of choices and no direct link found
    log(run_id, start, "$$$$$$:", file_link)
    return file_link # log and return the direct link

def scrape_url(url, soup_to_links, cookies):
    try: soup = BeautifulSoup(post(url, cookies=cookies).content, 'html.parser') # post request to search page and parse
    except Exception as e: raise Exception('Error during url scrape:', e)
    links = soup_to_links(soup)
    if not links: raise Exception('No links were found from the search url.')
    return links

def scrape_bing(search, hd):
    """Scrape video links from Bing"""
    page,hd = '&first=0&count=105','+filterui:resolution-720p' if hd else '' # The results can be paginated, max 105 per page
    search_url = 'https://www.bing.com/videos/asyncv2?q=%s%s%s&async=content%s%s'%(search,whitelist,blacklist,page,hd)
    try: return scrape_url(search_url, lambda soup: [json.loads(link["vrhm"])["pgurl"] for link in soup.select('div.vrhdata')], cookies = {})
                          #cookies = {'SRCHHPGUSR':'ADLT=OFF&CW=1117&CH=1771&DPR=2&UTC=-360&HV='+str(int(time()))})
    except: raise

def retry(search, hd, results): return get_file_link(choice(search_terms) if results == 105 else search,hd,105) # expand to max results, then try random search term
def log(run_id, start, *args): print(run_id,'%ss' % '{0:.2f}'.format(time()-start)[:4],*args) # Log with execution number and seconds get_file_link has been running

if __name__ == "__main__": get_file_link(choice(search_terms)) # get one link for testing