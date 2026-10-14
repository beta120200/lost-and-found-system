/* ---------------------------------------------------------
   Live updates client. Connects to the Workerman server in
   realtime/server.php and calls window.onRealtimeEvent(event, data)
   for every broadcast it receives — each page defines that function
   with whatever refresh makes sense for it (see feed.js / admin.js).

   Only loaded on pages that want live updates (feed.html, admin.html).
   If the realtime server isn't running, this just quietly retries in
   the background — the rest of the app works fine without it, since
   every mutation already goes through the normal REST API regardless.

   Note: REALTIME_PORT here must match REALTIME_WS_PORT in .env. The
   browser has no way to read a server-side .env file directly, so if
   you change the port there, update it here too.
--------------------------------------------------------- */
var REALTIME_PORT = 8081;

var realtimeSocket = null;
var realtimeRetryDelay = 1000;

function connectRealtime(){
  var url = "ws://" + window.location.hostname + ":" + REALTIME_PORT;
  try{
    realtimeSocket = new WebSocket(url);
  }catch(e){
    scheduleRealtimeRetry();
    return;
  }

  realtimeSocket.onopen = function(){
    realtimeRetryDelay = 1000; // reset backoff once we're connected
  };

  realtimeSocket.onmessage = function(evt){
    if(evt.data === "pong") return;
    var msg;
    try{ msg = JSON.parse(evt.data); }catch(e){ return; }
    if(msg && msg.event && window.onRealtimeEvent){
      window.onRealtimeEvent(msg.event, msg.data || {});
    }
  };

  realtimeSocket.onclose = function(){ scheduleRealtimeRetry(); };
  realtimeSocket.onerror = function(){ try{ realtimeSocket.close(); }catch(e){} };
}

function scheduleRealtimeRetry(){
  setTimeout(connectRealtime, realtimeRetryDelay);
  realtimeRetryDelay = Math.min(realtimeRetryDelay * 1.5, 15000); // gentle backoff, capped at 15s
}

connectRealtime();
