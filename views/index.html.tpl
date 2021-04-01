<!DOCTYPE html>
<html>
<head>
<title>Video Matrix</title>
<link rel="shortcut icon" href="/static/favicon.ico">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
<link rel="stylesheet" href="/static/main.css">
<style id="touch_style"></style><style id="touch_style_fullscreen"></style>
</head>
<body>
<div id="help">
    <pre>

   Interface

        1-9   = search and load video 1-9
                or click the top right button    
        R     = reload/search all videos
        + -   = add/remove videos
        enter = open the search box
                reload video to search  
        
        M     = mute
        ↑ ↓   = change volume
        ← →   = forward/reverse
        P     = pause
        B E   = beginning/end  

        C     = mouse controls
        H     = help

   Controls effect all windows. Try phone. 
    </pre>
</div>

<div div id="search">
    <div id="button_container">
        <div class="button-group">
            <button id="hd"><i class="material-icons" style="color:#40453a">hd</i></button><input type="text" id="results" placeholder="results" maxlength="3"><button id="file_download"><i class="material-icons">file_download</i></button>
        </div>
        <div class="button-group">
            <button id="remove"><i class="material-icons">exposure_minus_1</i></button><button id="add"><i class="material-icons">exposure_plus_1</i></button>
        </div>
    </div>
    <div></div>
    <input type="text" id="search_box" placeholder="search">
</div>

<div id="controls">
    <div id="main_buttons">
        <button id="toggle_mute"><i class="material-icons">volume_off</i></button>
        <button id="toggle_pause"><i class="material-icons">pause</i></button>
        <button id="reverse"><i class="material-icons">fast_rewind</i></button>
        <button id="forward"><i class="material-icons">fast_forward</i></button>
        <button id="beginning"><i class="material-icons">skip_previous</i></button>
        <button id="end"><i class="material-icons">skip_next</i></button>
        <button id="reload_all"><i class="material-icons">loop</i></button>
        <button id="toggle_search"><i class="material-icons">search</i></button>
        <button id="toggle_fullscreen"><i class="material-icons">fullscreen</i></button>
    </div>
    <div id="sliders">
        <input type="range" min="0" max="1" value="1" step=".01" class="slider" id="volume">
    </div>
</div>

<div id="videos">
    <div class="vid_container">
        <video controls muted autoplay loop poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></video>
        <button class="reload" id="0" onclick="load_video(this.id)"><i class="material-icons">replay</i></button>
    </div>
</div>

</body> <!-- Set these to allow user to save settings in url -->
<script> let vid_count = {{n}}, results = {{results}}, hd = {{hd}}, search = "{{search}}"; </script>
<script src="/static/client.js"></script>
</html>