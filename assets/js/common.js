/* ---------------------------------------------------------
   Small shared helpers / session cache
--------------------------------------------------------- */
let ICONS = ["💳","🔑","⌚","💾","🎒","🎧","📘","🧴","🧥","📱","☂️","👓","🏷️"];

let sessionUser = null;       // {id, name, email, role, status} or null
let pendingReportsCount = 0;  // cached for the admin bell badge
let feedFilter = "all";       // read by common.js's header filter UI; feed.js owns the actual feed
let feedSearch = "";

function currentUser(){ return sessionUser; }

function initials(name){
  let parts = name.trim().split(/\s+/);
  let s = parts[0] ? parts[0][0] : "";
  if(parts.length>1) s += parts[parts.length-1][0];
  return s.toUpperCase();
}

function fmtDate(isoDate){
  let d = new Date(isoDate + "T00:00:00");
  if(isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {month:"short", day:"numeric", year:"numeric"});
}

function esc(s){
  return String(s==null?"":s).replace(/[&<>"']/g, function(c){
    return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];
  });
}

function typeLabel(t){ return t === "lost" ? "LOST" : "FOUND"; }

function getQueryParam(name){
  return new URLSearchParams(window.location.search).get(name);
}

function postThumb(p){
  // Full photo if one was uploaded to ImgBB, otherwise the chosen emoji icon.
  return p.image_url
    ? '<img src="'+esc(p.image_url)+'" alt="" class="post-photo">'
    : (p.icon || "🏷️");
}

/* ---------------------------------------------------------
   Toasts
--------------------------------------------------------- */
function toast(msg){
  let root = document.getElementById("toast-root");
  let el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(function(){
    el.style.transition = "opacity .2s ease";
    el.style.opacity = "0";
    setTimeout(function(){ el.remove(); }, 220);
  }, 2800);
}

function errToast(err){
  toast(err && err.message ? err.message : "Something went wrong.");
}

function openModal(html, onMount){
  let root = document.getElementById("modal-root");
  root.innerHTML =
    '<div class="modal-backdrop" id="modal-backdrop"><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>';
  let backdrop = document.getElementById("modal-backdrop");
  backdrop.addEventListener("click", function(e){
    if(e.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", escCloser);
  if(onMount) onMount(root);
}
function escCloser(e){
  if(e.key === "Escape") closeModal();
}
function closeModal(){
  document.getElementById("modal-root").innerHTML = "";
  document.removeEventListener("keydown", escCloser);
}
function bindModalCommon(){
  let closeBtn = document.querySelector('[data-action="close-modal"]');
  if(closeBtn) closeBtn.addEventListener("click", closeModal);
}

let ICON_PATHS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9"/><path d="M9.5 20v-6h5v6"/>',
  ticket: '<path d="M4 8a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 8v2a1.8 1.8 0 0 0 0 4v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16v-2a1.8 1.8 0 0 0 0-4Z"/><path d="M13 6.5v2M13 11v2M13 15.5v2"/>',
  dashboard: '<rect x="3" y="3" width="7.5" height="9" rx="1.2"/><rect x="13.5" y="3" width="7.5" height="5" rx="1.2"/><rect x="13.5" y="10" width="7.5" height="11" rx="1.2"/><rect x="3" y="14" width="7.5" height="7" rx="1.2"/>',
  bell: '<path d="M6.5 8.5a5.5 5.5 0 0 1 11 0c0 4 1.4 5.2 1.9 6H4.6c.5-.8 1.9-2 1.9-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.4-4.4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5l3.2 1.8"/>'
};
function icon(name, extraClass){
  return '<svg class="'+(extraClass||"")+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICON_PATHS[name]+'</svg>';
}

let headerDropdownOpen = false;

function renderHeader(activePage){
  let wrap = document.getElementById("header-inner");
  let u = currentUser();

  if(!u){
    wrap.innerHTML =
      '<div class="fb-left"><a href="login.html" class="brand-mark" title="Lost & Found Board"><img src="./assets/img/logo.svg" alt="LF Logo"></a></div>' +
      '<div class="fb-center"></div><div class="fb-right"></div>';
    return;
  }

  let homeHref = u.role === "admin" ? "admin.html" : "feed.html";
  let showFeedControls = (u.role !== "admin") && (activePage === "feed");
  let left =
    '<div class="fb-left">' +
      '<a href="'+homeHref+'" class="brand-mark" title="Lost & Found Board"><img src="./assets/img/logo.svg" alt="LF Logo"></a>' +
      (u.role !== "admin" ?
        '<div class="fb-search">'+icon("search")+'<input type="text" id="header-search" placeholder="Search Lost & Found" value="'+esc(feedSearch)+'"></div>'
        : '') +
      (showFeedControls ?
        '<div class="fb-filter">' +
          '<button class="'+(feedFilter==="all"?"active":"")+'" data-headerfilter="all">All</button>' +
          '<button class="'+(feedFilter==="lost"?"active":"")+'" data-headerfilter="lost">Lost</button>' +
          '<button class="'+(feedFilter==="found"?"active":"")+'" data-headerfilter="found">Found</button>' +
        '</div>'
        : '') +
    '</div>';

  let center = '<div class="fb-center">';
  if(u.role === "admin"){
    center += '<a href="admin.html" class="fb-icon-btn '+(activePage==="admin"?"active":"")+'" title="Dashboard">'+icon("dashboard")+'</a>';
  } else {
    center += '<a href="feed.html" class="fb-icon-btn '+(activePage==="feed"?"active":"")+'" title="Feed">'+icon("home")+'</a>';
    center += '<a href="my-posts.html" class="fb-icon-btn '+(activePage==="myposts"?"active":"")+'" title="My posts">'+icon("ticket")+'</a>';
  }
  center += '</div>';

  let bellBadge = u.role === "admin" ? pendingReportsCount : 0;
  let right =
    '<div class="fb-right">' +
      '<button class="fb-round-btn" id="header-bell" title="Notifications">'+icon("bell")+(bellBadge>0?'<span class="fb-badge">'+bellBadge+'</span>':'')+'</button>' +
      '<div class="fb-avatar-wrap">' +
        '<button class="fb-avatar-btn" id="header-avatar-btn" title="Account"><span>'+esc(initials(u.name))+'</span></button>' +
        (headerDropdownOpen ?
          '<div class="fb-dropdown" id="header-dropdown">' +
            '<div class="fb-dropdown-head"><strong>'+esc(u.name)+'</strong><span>'+esc(u.role)+'</span></div>' +
            '<button data-action="logout">Log out</button>' +
          '</div>'
        : '') +
      '</div>' +
    '</div>';

  wrap.innerHTML = left + center + right;

  let search = document.getElementById("header-search");
  if(search){
    search.addEventListener("input", function(e){
      feedSearch = e.target.value;
      if(window.onHeaderSearchChange) window.onHeaderSearchChange();
    });
  }
  let bell = document.getElementById("header-bell");
  if(bell){
    bell.addEventListener("click", function(){
      if(u.role === "admin" && window.focusReportsTab){ window.focusReportsTab(); }
      else if(u.role !== "admin"){ toast("You're all caught up — no new notifications."); }
    });
  }
  let avatarBtn = document.getElementById("header-avatar-btn");
  if(avatarBtn){
    avatarBtn.addEventListener("click", function(e){
      e.stopPropagation();
      headerDropdownOpen = !headerDropdownOpen;
      renderHeader(activePage);
    });
  }
}

document.addEventListener("click", function(e){
  if(headerDropdownOpen && !e.target.closest(".fb-avatar-wrap")){
    headerDropdownOpen = false;
    renderHeader(window.CURRENT_PAGE || null);
  }
});

document.addEventListener("click", function(e){
  let headerFilterBtn = e.target.closest("[data-headerfilter]");
  if(headerFilterBtn){
    feedFilter = headerFilterBtn.getAttribute("data-headerfilter");
    renderHeader(window.CURRENT_PAGE || null);
    if(window.onHeaderSearchChange) window.onHeaderSearchChange();
    return;
  }

  let newPostBtn = e.target.closest('[data-action="new-post"]');
  if(newPostBtn){ window.location.href = "create-post.html"; return; }

  let logoutBtn = e.target.closest('[data-action="logout"]');
  if(logoutBtn){ handleLogout(); return; }

  let closeBtn = e.target.closest('[data-action="close-modal"]');
  if(closeBtn){ closeModal(); return; }
});

function handleLogout(){
  api.logout().then(function(){
    sessionUser = null;
    window.location.href = "login.html";
  }).catch(errToast);
}

/* ---------------------------------------------------------
   Session guards — every protected page calls one of these before
   rendering anything, since a real page load has no client-side router
   to fall back to. Each page is a real URL now, so the guard IS the
   security/UX boundary on the frontend (the actual data access is still
   checked server-side by require_auth()/require_admin() either way).
--------------------------------------------------------- */

/** For feed.html / my-posts.html / admin.html. Redirects as needed, else resolves with the user. */
function requireSession(allowedRoles){
  return api.me().then(function(res){
    sessionUser = res.user;
    if(allowedRoles && allowedRoles.indexOf(sessionUser.role) === -1){
      window.location.href = sessionUser.role === "admin" ? "admin.html" : "feed.html";
      return Promise.reject(new Error("redirecting"));
    }
    return sessionUser;
  }).catch(function(err){
    if(!sessionUser){ window.location.href = "login.html"; }
    return Promise.reject(err);
  });
}

/** For login.html / signup.html. If already logged in, skip straight to the right home page. */
function redirectIfLoggedIn(){
  return api.me().then(function(res){
    window.location.href = res.user.role === "admin" ? "admin.html" : "feed.html";
    return true;
  }).catch(function(){
    return false;
  });
}
