/* ---------------------------------------------------------
   Post Details page (Section 6). A real page now, reached from
   ?id=<post id> — feed.html, my-posts.html, and admin.html all just
   link here instead of opening a modal. Report/resolve/delete stay as
   quick-confirm modals (from modals.js); those aren't listed as their
   own pages in Section 6, so a page for each would be overkill.
--------------------------------------------------------- */
window.CURRENT_PAGE = null; // not one of the main nav destinations

function renderPostDetails(p){
  var main = document.getElementById("main");
  var u = currentUser();
  var isOwner = u.id === p.user_id;
  var isAdmin = u.role === "admin";

  var actions = "";
  if(isOwner){
    actions += '<a class="btn ghost small" href="create-post.html?edit='+p.id+'">Edit</a>';
    actions += '<button class="btn danger small" id="pd-delete">Delete</button>';
    actions += '<button class="btn success small" id="pd-found">Mark as Found</button>';
  } else if(isAdmin){
    actions += '<button class="btn danger small" id="pd-delete">Remove Post</button>';
  } else {
    actions += '<button class="btn ghost small" id="pd-report">Report This Post</button>';
  }

  var photoBlock = p.image_url
    ? '<img src="'+esc(p.image_url)+'" alt="" class="detail-photo">'
    : '<div style="text-align:center;font-size:3.2rem;margin-bottom:14px;">'+esc(p.icon||"🏷️")+'</div>';

  var backHref = isOwner ? "my-posts.html" : (isAdmin ? "admin.html" : "feed.html");

  main.innerHTML =
    '<a href="'+backHref+'" class="page-back">&larr; Back</a>' +
    '<div class="page-card">' +
      '<div class="page-card-head"><h2 class="display">'+esc(p.item_name)+'</h2>' +
        '<span class="tag-type '+p.type+'" style="border-radius:9px;">'+typeLabel(p.type)+'</span>' +
      '</div>' +
      photoBlock +
      '<div class="detail-row"><span class="k">Ticket</span><span class="mono">#'+String(p.id).padStart(4,"0")+'</span></div>' +
      '<div class="detail-row"><span class="k">Location</span><span>'+esc(p.location)+'</span></div>' +
      '<div class="detail-row"><span class="k">Date</span><span>'+fmtDate(p.date_lost_found)+'</span></div>' +
      '<div class="detail-row"><span class="k">Reported by</span><span>'+esc(p.owner_name||"Unknown")+'</span></div>' +
      '<div class="detail-row"><span class="k">Description</span><span>'+esc(p.description)+'</span></div>' +
      '<div class="page-card-actions">'+actions+'</div>' +
    '</div>';

  var del = document.getElementById("pd-delete");
  if(del) del.addEventListener("click", function(){
    confirmDeletePost(p.id);
    window.onPostsMutated = function(){ window.location.href = backHref; };
  });
  var found = document.getElementById("pd-found");
  if(found) found.addEventListener("click", function(){
    openResolveConfirm(p.id);
    window.onPostsMutated = function(){ window.location.href = backHref; };
  });
  var rep = document.getElementById("pd-report");
  if(rep) rep.addEventListener("click", function(){ openReportForm(p.id); });
}

function renderNotFound(){
  document.getElementById("main").innerHTML =
    '<div class="page-card" style="text-align:center;">' +
      '<h2 class="display" style="margin-bottom:8px;">Post not found</h2>' +
      '<p style="color:var(--ink-soft); margin-bottom:18px;">It may have already been resolved or removed.</p>' +
      '<a class="btn" style="width:auto;display:inline-flex;" href="feed.html">Back to the Feed</a>' +
    '</div>';
}

/* ---------------------------------------------------------
   Page bootstrap
--------------------------------------------------------- */
requireSession(null).then(function(u){
  renderHeader(null);
  var id = getQueryParam("id");
  if(!id){ renderNotFound(); return; }

  api.getPost(id).then(function(res){
    renderPostDetails(res.post);
  }).catch(function(){
    renderNotFound();
  });
});
