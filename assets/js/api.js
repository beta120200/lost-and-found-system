let API_BASE = "api";

function buildUrl(path, params){
  let url = API_BASE + path;
  if(params){
    let qs = Object.keys(params)
      .filter(function(k){ return params[k] !== undefined && params[k] !== null && params[k] !== ""; })
      .map(function(k){ return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); })
      .join("&");
    if(qs) url += "?" + qs;
  }
  return url;
}

function request(method, path, options){
  options = options || {};
  let fetchOpts = { method: method, credentials: "same-origin" };

  if(options.form){
    fetchOpts.body = options.form;
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

let api = {
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
