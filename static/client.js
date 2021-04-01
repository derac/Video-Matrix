// -----------------  INITIALIZATION  -----------------
const bc = new BroadcastChannel("videomatrix_bc"); // multi-window support
search_list = (() => {
    let req = new XMLHttpRequest();
    req.open('GET', 'static/search_terms.txt', false);
    req.send(null);
    return [...req.responseText.split('\n')]; })();
direct_urls = []; // keep a cache of direct urls for reloading after layout changes
let vid_els = [...document.getElementsByClassName("vid_container")]; // keep a list of video_container divs
let vids = [...document.getElementsByTagName("video")]; // and direct video elements
let is_wide = window.innerWidth > window.innerHeight; // variable for video layout

[...document.getElementsByTagName("*")].forEach((t) => { t.onfocus = (e) => { e.target.blur(); } }); // prevent focus on all elements except
["search_box", "volume", "results"].forEach((n) => { document.getElementById(n).onfocus = () => {} }) // these

if (is_touchscreen()) { // change styling and other settings to improve touch handling
    document.getElementById("touch_style").innerHTML = `.material-icons { font-size: 8vmin; } .button-group input, .button-group button { width: 16vmin; height: 16vmin; }
.button-group input { font-size: 6vmin; } .button-group i { margin-top: .6vmin; } #sliders { height: 8vmin; } #volume { width: 30vmin; height: 1vmin; } #top { font-size: 4vmin; }
#volume::-webkit-slider-thumb { width: 4vmin; height: 4vmin; } #volume::-moz-range-thumb { width: 4vmin; height: 4vmin; } button { width: 8vmin; height: 8vmin; }
#search_box { font-size: 12vmin; padding: 1vmax; padding-left: 2vmax; }`;
    document.getElementById("help").style.display = "none";
    vids[0].onfocus = () => {};
    if (localStorage.controls_on === undefined) { localStorage.controls_on = true; } } // if we're on a touch device, show controls
else if (localStorage.controls_on === undefined) { localStorage.controls_on = false; } // if not, hide them by default
if (localStorage.help_on === undefined) { localStorage.help_on = true; } // help on by default
let is_paused = false
let search_on = false;
localStorage.is_muted = true;
if (hd == 1) { set_hd(); } // more control state defaults

if (!JSON.parse(localStorage.controls_on)) { toggle_controls(true); }
update_url(); // set controls to proper state and update url
if (!JSON.parse(localStorage.help_on)) { toggle_help(true); } // set help to proper state
if (vid_count < 1) {
    vid_count = 1;
    update_url(); }
else {
    let m = vid_count;
    vid_count = 1;
    for (i = 1; i < m; i++) { add_video(); } }
load_video(0);
update_grid(); // set up the initial grid
set_volume(.5);
document.getElementById("volume").value = .5; // set initial volume to half

// ----------------- FUNCTIONS  -----------------
function update_url() {
    history.pushState({}, "Video Matrix", `?n=${vid_count}&results=${results}&hd=${hd}&search=${search}`); }; // keep the url in sync with the state

function is_touchscreen() { // handle touch devices
    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) { return true; }
    return window.matchMedia(['(', ' -webkit- -moz- -o- -ms- '.split(' ').join('touch-enabled),('), 'heartz', ')'].join('')).matches; }

function get_stretch_grid(n) { // utility function to get a list of [x,y,w,h] for sub elements in percentages, swap x/y w/h if is_wide is true
    cols = Math.floor(Math.sqrt(Math.ceil((n + 1) / (1 + !is_wide)))), w = 100 / cols, Grid = [];
    for (c = 0; c < cols; c++) {
        x = c * w;
        rows = cols + Math.floor(n / cols - cols);
        if (c == cols - 1) {
            rows += n - cols * rows; };
        h = 100 / rows;
        for (r = 0; r < rows; r++) {
            y = r * h;
            if (is_wide) { Grid.push([y, x, h, w]); }
            else { Grid.push([x, y, w, h]); } } }
    return Grid; }

function load_video(i) {
    update_url(); // retrieve a direct video link from the search endpoint and load it in the container specified
    fetch("/search/" + (search == "default" ? search_list[Math.floor(Math.random() * search_list.length)] : search) + "?results=" + results + "&hd=" + hd)
        .then((response) => { return response.text() })
        .then((data) => {
            let v = vids[i];
            v.src = data;
            direct_urls[i] = data;
            v.play().then(() => { v.currentTime = Math.max(v.duration / 3, 600); }); })
        .catch((error) => { console.error(error) }); }

function add_video() {
    vid_count++; update_url()
    if (vid_count > vids.length) {
        let new_vidc = vid_els[0].cloneNode(true)
        new_vid = new_vidc.getElementsByTagName("video")[0]
        new_vid.removeAttribute("src")
        button = new_vidc.getElementsByTagName("button")[0]
        button.setAttribute("id", vid_count-1)
        document.getElementById("videos").appendChild(new_vidc)
        vid_els.push(new_vidc)
        vids.push(new_vid)
        load_video(vid_count-1)
        new_vidc.getElementsByTagName("button")[0].onfocus = (e) => { e.target.blur() } // prevent focus
        if (!is_touchscreen()) { new_vid.onfocus = (e) => { e.target.blur(); } } }
    else { // else if vidc is already added, put the url we've cached in it, then show the ones we need
        new_vid = vid_els[vid_count-1].getElementsByTagName("video")[0];
        new_vid.src = direct_urls[vid_count-1]
        new_vid.play().then(() => { new_vid.currentTime = Math.max(new_vid.duration / 3, 600); }); };
    update_grid(); } 

function remove_video() {
    if (vid_count > 1) {
        vid_count--;
        update_url();
        v = vid_els[vid_count].getElementsByTagName("video")[0];
        if (v.src) { direct_urls[vid_count] = v.src }
        v.removeAttribute("src");
        v.load();
        vid_els[vid_count].style = `display:none;`;
        update_grid(); } }

function update_grid() {
    get_stretch_grid(vid_count).forEach((P, i) => {
        vid_els[i].style = `left:${P[0]}%;top:${P[1]}%;width:${P[2]}%;height:${P[3]}%;display:block;`; }); }

function reload_all() { for (i=0;i<vid_count;i++) { load_video(i); } }

function change_volume(change) {
    document.getElementById("volume").value = value = parseFloat(document.getElementById("volume").value) + change;
    set_volume(value);
    bc.postMessage(["set_volume", value]); }

function set_volume(volume) {
    vids.forEach((v) => {
        v.volume = volume; }); }

function reverse() {
    vids.forEach((v) => {
        v.currentTime = Math.max(v.currentTime - 10, 0) }) }

function forward() {
    vids.forEach((v) => {
        if (!isNaN(v.duration)) {
            v.currentTime = Math.min(v.currentTime + 10, v.duration) } }) }

function beginning() {
    vids.forEach((v) => { v.currentTime = 0; }) }

function end() {
    vids.forEach((v) => { if (!isNaN(v.duration)) { v.currentTime = v.duration - 10; } }) }

function set_hd() {
    document.getElementById("hd").innerHTML = hd ? '<i class="material-icons">hd</i>' : '<i class="material-icons" style="color:#40453a">hd</i>'; }

function toggle_controls(old_state) {
    document.getElementById("controls").style.display = old_state ? "none" : "table";
    localStorage.controls_on = !old_state; }

function toggle_help(old_state) {
    document.getElementById("help").style.display = old_state ? "none" : "block";
    localStorage.help_on = !old_state; }

function toggle_mute(old_state) {
    vids.forEach((v) => { v.muted = !old_state; });
    localStorage.is_muted = !old_state;
    document.getElementById("toggle_mute").innerHTML = old_state ? '<i class="material-icons">volume_up</i>' : '<i class="material-icons">volume_off</i>'; }

function toggle_pause(old_state) {
    vids.forEach((v) => { old_state ? v.play() : v.pause(); });
    is_paused = !is_paused;
    document.getElementById("toggle_pause").innerHTML = old_state ? '<i class="material-icons">pause</i>' : '<i class="material-icons">play_arrow</i>'; }

function toggle_search() {
    search_on = !search_on;
    document.getElementById("search").style.display = search_on ? "block" : "none";
    if (search_on) { document.getElementById("search_box").focus(); }
    else { update_url(); }; }

function toggle_fullscreen() {
    var doc = window.document, docEl = doc.documentElement;
    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        (docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen).call(docEl); }
    else { (doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen).call(doc); } }

// ----------------- EVENTS  -----------------
document.getElementById("search_box").oninput = (e) => {
    let a = e.target.value;
    search = a ? a : "default"; };
document.getElementById("results").oninput = (e) => {
    let a = parseInt(e.target.value);
    results = !isNaN(a) ? Math.max(Math.min(a, 105), 1) : 30; };

document.getElementById("add").onclick = () => { add_video(); }
document.getElementById("remove").onclick = () => { remove_video(); }
document.getElementById("reload_all").onclick = () => {
    reload_all();
    bc.postMessage("reload"); }

document.getElementById("volume").oninput = (e) => {
    set_volume(e.target.value);
    bc.postMessage(["set_volume", e.target.value]); }
document.getElementById("reverse").onclick = () => {
    reverse();
    bc.postMessage("reverse"); }
document.getElementById("forward").onclick = () => {
    forward();
    bc.postMessage("forward"); }
document.getElementById("beginning").onclick = () => {
    beginning();
    bc.postMessage("beginning"); }
document.getElementById("end").onclick = () => {
    end();
    bc.postMessage("end"); }

document.getElementById("hd").onclick = (e) => {
    hd = +!hd;
    set_hd(); }
document.getElementById("toggle_mute").onclick = () => {
    s = JSON.parse(localStorage.is_muted);
    bc.postMessage(["toggle_mute", s]);
    toggle_mute(s); }
document.getElementById("toggle_pause").onclick = () => {
    bc.postMessage(["toggle_pause", is_paused]);
    toggle_pause(is_paused); }
document.getElementById("toggle_search").onclick = () => {
    toggle_search(); }
document.getElementById("toggle_fullscreen").onclick = () => {
    toggle_fullscreen(); }

window.onpopstate = () => { if (search_on) { toggle_search(); } } // remove search on back
window.onresize = () => {
    if (window.innerWidth > window.innerHeight != is_wide) {
        is_wide = !is_wide;
        update_grid(); } // update the grid and toggle_fullscreen button onresize
    document.getElementById("toggle_fullscreen").innerHTML = '<i class="material-icons">' + (window.innerHeight == screen.height ? 'fullscreen_exit' : 'fullscreen') + '</i>';
    if (is_touchscreen()) { document.getElementById("touch_style_fullscreen").innerHTML = (window.innerHeight == screen.height ? '#search {top: 25%;}' : '') } }


document.onkeydown = (e) => {
    k = e.key.toLowerCase(); // keyboard
    if (!e.repeat) { 
        if (!search_on) {
            if (!isNaN(e.key)) {
                key = parseInt(e.key);
                if (key <= vids.length) { load_video(key-1); } }
            else if (k == "b") { beginning(); bc.postMessage("beginning"); }
            else if (k == "e") { end(); bc.postMessage("end"); }
            else if (k == "=" || k == "+") { add_video(); }
            else if (k == "-" || k == "_") { remove_video(); }
            else if (k == "r") { reload_all(); bc.postMessage("reload"); }
            else if (k == "m") { s = JSON.parse(localStorage.is_muted); bc.postMessage(["toggle_mute", s]); toggle_mute(s); }
            else if (k == "c") { s = JSON.parse(localStorage.controls_on); bc.postMessage(["toggle_controls", s]); toggle_controls(s); }
            else if (k == "h") { s = JSON.parse(localStorage.help_on); bc.postMessage(["toggle_help", s]); toggle_help(s); }
            else if (k == "p") { bc.postMessage(["toggle_pause", is_paused]); toggle_pause(is_paused); } }
        if (k == "enter") { toggle_search(); } }
    if (!search_on) {
        if (k == "arrowleft") { reverse(); bc.postMessage("reverse"); }
        else if (k == "arrowright") { forward(); bc.postMessage("forward"); } }
    if (k == "arrowdown") { change_volume(-.03); }
    else if (k == "arrowup") { change_volume(.03); } }

bc.onmessage = (e) => { d = e.data; // broadcasting/multi-window support
    if (d == "reload") { reload_all(); }
    else if (d == "forward") { forward(); }
    else if (d == "reverse") { reverse(); }
    else if (d == "pause") { pause(); }
    else if (d == "beginning") { beginning(); }
    else if (d == "end") { end(); }
    else if (d[0] == "toggle_pause") { toggle_pause(d[1]); }
    else if (d[0] == "toggle_mute") { toggle_mute(d[1]); }
    else if (d[0] == "toggle_controls") { toggle_controls(d[1]); }
    else if (d[0] == "toggle_help") { toggle_help(d[1]); }
    else if (d[0] == "set_volume") { document.getElementById("volume").value = d[1]; set_volume(d[1]); } }