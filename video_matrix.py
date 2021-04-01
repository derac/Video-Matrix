import sys, argparse, webbrowser
from search import get_file_link
from bottle import route, template, request, run, static_file


@route("/")
def main_page():
    return template(
        "index.html",
        n=int(request.query.n or 4),
        results=int(request.query.results or 30),
        hd=max(0, min(1, int(request.query.hd or 0))),
        search=request.query.search or "default",
    )


@route("/search/<query>")
def search_to_link(query):
    return get_file_link(
        query,
        hd=max(0, min(1, int(request.query.hd or 0))),
        results=int(request.query.results or 30),
    )


@route("/static/<file>")
def get_static(file):
    return static_file(file, root="./static/")


parser = argparse.ArgumentParser()
parser.add_argument(
    "-port", "-p", metavar="N", type=int, default=8080, help="Port to serve on."
)
parser.add_argument(
    "-threads",
    "-t",
    metavar="N",
    type=int,
    default=8,
    help="Threads the server will use.",
)
parser.add_argument(
    "-headless", "-hl", action="store_true", help="Don't launch browser on start."
)
parser.print_help()
print()
args = parser.parse_args()
if not args.headless:
    webbrowser.open_new_tab("http://127.0.0.1:%s" % args.port)
run(host="localhost", port=args.port, server="waitress", workers=args.threads)
