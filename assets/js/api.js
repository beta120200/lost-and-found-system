/* ---------------------------------------------------------
   API client — talks to the PHP backend under /api
   Loaded first on every page; everything below is plain global
   functions/vars, the same way the previous single-file app.js
   worked internally — just split into files now, one per page.
--------------------------------------------------------- */
var API_BASE = "api"; // relative, so this works under any folder name in htdocs

function buildUrl(path, params){
  var url = API_BASE + path;
  if(params){
    var qs = Object.keys(params)
      .filter(function(k){ return params[k] !== undefined && params[k] !== null && params[k] !== ""; })
      .map(function(k){ return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); })
      .join("&");
    if(qs) url += "?" + qs;
  }
  return url;
}

/** Core request helper. Throws an Error with a user-facing message on failure. */
function request(method, path, options){
  options = options || {};
  var fetchOpts = { method: method, credentials: "same-origin" };

  if(options.form){
    fetchOpts.body = options.form; // FormData — browser sets the multipart boundary itself
  } else if(options.json !== undefined){
    fetchOpts.headers = { "Content-Type": "application/json" };
    fetchOpts.body = JSON.stringify(options.json);
  }

  return fetch(buildUrl(path, options.params), fetchOpts)
    .catch(function(){
      throw new Error("Can't reach the server. Make sure Apache and MySQL are running in XAMPP.");
    })
    .then(function(res){
      return res.json().catch(function(){ return {}; }).then(function(data){
        if(!res.ok || data.ok === false){
          throw new Error(data.message || ("Request failed (" + res.status + ")."));
        }
        return data;
      });
    });
}

var api = {
  me:      function(){ return request("GET", "/auth/me"); },
  signup:  function(d){ return request("POST", "/auth/signup", {json: d}); },
  login:   function(d){ return request("POST", "/auth/login", {json: d}); },
  logout:  function(){ return request("POST", "/auth/logout"); },

  listPosts:  function(params){ return request("GET", "/posts", {params: params}); },
  getPost:    function(id){ return request("GET", "/posts/" + id); },
  createPost: function(formData){ return request("POST", "/posts", {form: formData}); },
  updatePost: function(id, d){ return request("PUT", "/posts/" + id, {json: d}); },
  deletePost: function(id){ return request("DELETE", "/posts/" + id); },
  reportPost: function(id, d){ return request("POST", "/posts/" + id + "/report", {json: d}); },
  resolvePost:function(id, confirmed){ return request("PATCH", "/posts/" + id + "/resolve", {json: {confirmed: confirmed}}); },

  adminDashboard: function(){ return request("GET", "/admin/dashboard"); },
  adminUsers:     function(){ return request("GET", "/admin/users"); },
  adminToggleUser:function(id){ return request("PATCH", "/admin/users/" + id); },
  adminPosts:     function(){ return request("GET", "/admin/posts"); },
  adminReports:   function(){ return request("GET", "/admin/reports"); },
  adminDismissReport:   function(id){ return request("PATCH", "/admin/reports/" + id + "/dismiss"); },
  adminRemoveReportPost:function(id){ return request("PATCH", "/admin/reports/" + id + "/remove-post"); }
};
