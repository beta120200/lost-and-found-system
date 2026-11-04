let REALTIME_PORT = 8081;

let realtimeSocket = null;
let realtimeRetryDelay = 1000;

function connectRealtime(){
  let url = "ws://" + window.location.hostname + ":" + REALTIME_PORT;
  try{
    realtimeSocket = new WebSocket(url);
  }catch(e){
    scheduleRealtimeRetry();
    return;
  }

  realtimeSocket.onopen = function(){
    realtimeRetryDelay = 1000;
  };

  realtimeSocket.onmessage = function(evt){
    if(evt.data === "pong") return;
    let msg;
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
  realtimeRetryDelay = Math.min(realtimeRetryDelay * 1.5, 15000);
}

connectRealtime();
