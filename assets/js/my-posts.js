/* ---------------------------------------------------------
   My Posts page. Loaded after api.js, common.js, modals.js.
   No realtime.js here — only the owner can change their own posts,
   so there's nothing for this page to live-update against.
--------------------------------------------------------- */
window.CURRENT_PAGE = "myposts";

  function renderMyPosts(){
    var main = document.getElementById("main");
    main.innerHTML =
      '<div class="view-head"><div><h2 class="display">My Posts</h2><p>Reports you&rsquo;ve created, and their current status.</p></div>' +
      '<button class="btn" style="width:auto;" data-action="new-post">+ New Post</button></div>' +
      '<div id="myposts-grid"><div class="empty-state"><h3>Loading…</h3></div></div>';

    api.listPosts({mine: 1, limit: 100}).then(function(res){
      renderMyPostsGrid(res.posts || []);
    }).catch(function(err){
      errToast(err);
      renderMyPostsGrid([]);
    });
  }

  function renderMyPostsGrid(mine){
    var grid = document.getElementById("myposts-grid");
    if(!grid) return;
    if(mine.length === 0){
      grid.innerHTML = '<div class="empty-state"><h3>You haven&rsquo;t posted anything yet</h3><p>Create a lost or found report to get it in front of the community.</p></div>';
      return;
    }
    grid.innerHTML = '<div class="grid">' + mine.map(renderMyCard).join("") + '</div>';
    grid.querySelectorAll(".tag-card").forEach(function(card){
      var p = mine.filter(function(x){ return String(x.id) === card.getAttribute("data-id"); })[0];
      card.addEventListener("click", function(e){
        if(e.target.closest(".tag-foot button")) return;
        window.location.href = "post-details.html?id=" + p.id;
      });
    });
    grid.querySelectorAll('[data-action="mp-edit"]').forEach(function(b){
      b.addEventListener("click", function(e){
        e.stopPropagation();
        window.location.href = "create-post.html?edit=" + b.getAttribute("data-id");
      });
    });
    grid.querySelectorAll('[data-action="mp-found"]').forEach(function(b){
      b.addEventListener("click", function(e){ e.stopPropagation(); openResolveConfirm(b.getAttribute("data-id")); });
    });
    grid.querySelectorAll('[data-action="mp-delete"]').forEach(function(b){
      b.addEventListener("click", function(e){ e.stopPropagation(); confirmDeletePost(b.getAttribute("data-id")); });
    });
  }

  function renderMyCard(p){
    return (
      '<div class="tag-card" data-id="'+p.id+'">' +
        '<div class="tag-stub '+p.type+'">' +
          '<span class="tag-type '+p.type+'">'+typeLabel(p.type)+'</span>' +
          '<span class="tag-num mono">#'+String(p.id).padStart(4,"0")+'</span>' +
        '</div>' +
        '<div class="tag-perf"></div>' +
        '<div class="tag-icon">'+postThumb(p)+'</div>' +
        '<div class="tag-body">' +
          '<h3>'+esc(p.item_name)+'</h3>' +
          '<div class="tag-meta"><span>📍 '+esc(p.location)+'</span><span>🗓 '+fmtDate(p.date_lost_found)+'</span></div>' +
          '<div class="tag-foot" style="gap:6px;">' +
            '<button class="btn ghost small" data-action="mp-edit" data-id="'+p.id+'">Edit</button>' +
            '<button class="btn success small" data-action="mp-found" data-id="'+p.id+'">Found</button>' +
            '<button class="btn danger small" data-action="mp-delete" data-id="'+p.id+'">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }


/* ---------------------------------------------------------
   Page bootstrap
--------------------------------------------------------- */
requireSession(["user"]).then(function(){
  renderHeader("myposts");
  renderMyPosts();
  window.onPostsMutated = renderMyPosts;
});
