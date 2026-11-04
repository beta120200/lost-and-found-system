window.CURRENT_PAGE = "feed";

let FEED_PAGE_SIZE = 4;
let feedOffset = 0;
let feedHasMore = true;
let feedObserver = null;
let feedLoadingMore = false;

  function renderFeed(){
    let main = document.getElementById("main");
    main.innerHTML =
      '<div class="feed-layout">' +
        '<div class="feed-main">' +
          '<div class="mobile-feed-tools" id="mobile-feed-tools">' +
            '<div class="fb-filter">' +
              '<button class="'+(feedFilter==="all"?"active":"")+'" data-headerfilter="all">All</button>' +
              '<button class="'+(feedFilter==="lost"?"active":"")+'" data-headerfilter="lost">Lost</button>' +
              '<button class="'+(feedFilter==="found"?"active":"")+'" data-headerfilter="found">Found</button>' +
            '</div>' +
            '<div class="fb-search mobile-search">'+icon("search")+'<input type="text" id="mobile-feed-search" placeholder="Search Lost & Found" value="'+esc(feedSearch)+'"></div>' +
          '</div>' +
          '<div id="composer-card"></div>' +
          '<div id="feed-grid"></div>' +
        '</div>' +
        '<aside class="feed-sidebar" id="feed-sidebar"></aside>' +
      '</div>';

    let mSearch = document.getElementById("mobile-feed-search");
    if(mSearch){
      mSearch.addEventListener("input", function(e){
        feedSearch = e.target.value;
        renderFeedGrid();
      });
    }

    renderComposerCard();
    renderFeedGrid();
    loadSidebar();
  }

  function renderComposerCard(){
    let box = document.getElementById("composer-card");
    if(!box) return;
    let u = currentUser();
    let firstName = u.name.split(" ")[0];
    box.innerHTML =
      '<div class="composer-card">' +
        '<div class="composer-row">' +
          '<div class="composer-avatar">'+esc(initials(u.name))+'</div>' +
          '<button class="composer-input" id="composer-open">Report something lost or found, '+esc(firstName)+'?</button>' +
        '</div>' +
        '<div class="composer-divider"></div>' +
        '<div class="composer-actions">' +
          '<button class="composer-action-btn lost" id="composer-lost"><span class="composer-dot lost"></span>Report Lost</button>' +
          '<button class="composer-action-btn found" id="composer-found"><span class="composer-dot found"></span>Report Found</button>' +
        '</div>' +
      '</div>';
    document.getElementById("composer-open").addEventListener("click", function(){ window.location.href = "create-post.html"; });
    document.getElementById("composer-lost").addEventListener("click", function(){ window.location.href = "create-post.html?type=lost"; });
    document.getElementById("composer-found").addEventListener("click", function(){ window.location.href = "create-post.html?type=found"; });
  }

  function renderFeedGrid(){
    let grid = document.getElementById("feed-grid");
    if(!grid) return;

    if(feedObserver){ feedObserver.disconnect(); feedObserver = null; }
    feedOffset = 0;
    feedHasMore = true;

    grid.innerHTML =
      '<div class="feed-wrap" id="feed-wrap"></div>' +
      '<div id="feed-sentinel" class="feed-sentinel"></div>' +
      '<div id="feed-status" class="feed-status hidden"></div>';

    appendFeedBatch();
  }

  function appendFeedBatch(){
    let wrap = document.getElementById("feed-wrap");
    if(!wrap || !feedHasMore) return;

    showFeedStatus("Loading…", true);

    api.listPosts({
      type: feedFilter === "all" ? undefined : feedFilter,
      search: feedSearch,
      offset: feedOffset,
      limit: FEED_PAGE_SIZE
    }).then(function(res){
      let posts = res.posts || [];

      if(feedOffset === 0 && posts.length === 0){
        grid_setEmptyState();
        return;
      }

      wrap.insertAdjacentHTML("beforeend", posts.map(renderFeedCard).join(""));
      posts.forEach(function(p){
        let card = wrap.querySelector('.feed-card[data-id="'+p.id+'"]');
        if(card) card.addEventListener("click", function(){ window.location.href = "post-details.html?id=" + p.id; });
      });

      feedOffset += posts.length;
      feedHasMore = posts.length === FEED_PAGE_SIZE;

      if(!feedHasMore){
        showFeedStatus("You're all caught up — that's every open report.", false);
        if(feedObserver){ feedObserver.disconnect(); feedObserver = null; }
      } else {
        hideFeedStatus();
        if(!feedObserver){
          feedObserver = new IntersectionObserver(function(entries){
            if(entries[0].isIntersecting) maybeLoadMoreFeed();
          }, {rootMargin: "200px"});
          feedObserver.observe(document.getElementById("feed-sentinel"));
        }
      }
    }).catch(function(err){
      hideFeedStatus();
      errToast(err);
    });
  }

  function grid_setEmptyState(){
    let grid = document.getElementById("feed-grid");
    if(grid) grid.innerHTML = '<div class="empty-state"><h3>No matching reports</h3><p>Try a different filter or search term, or be the first to report something.</p></div>';
  }

  function maybeLoadMoreFeed(){
    if(feedLoadingMore || !feedHasMore) return;
    feedLoadingMore = true;
    showFeedStatus("Loading more reports…", true);
    setTimeout(function(){
      appendFeedBatch();
      feedLoadingMore = false;
    }, 300);
  }

  function showFeedStatus(text, isLoading){
    let el = document.getElementById("feed-status");
    if(!el) return;
    el.textContent = text;
    el.classList.remove("hidden");
    el.classList.toggle("loading", !!isLoading);
  }
  function hideFeedStatus(){
    let el = document.getElementById("feed-status");
    if(el) el.classList.add("hidden");
  }

  function renderFeedCard(p){
    return (
      '<div class="feed-card" data-id="'+p.id+'">' +
        '<div class="feed-card-head">' +
          '<div class="feed-head-text">' +
            '<div class="feed-card-title">'+esc(p.item_name)+
            '<span class="feed-badge '+p.type+'">'+typeLabel(p.type)+'</span>' +
            '</div>' +
            '<div class="feed-card-sub">' +
              '<span>📍 '+esc(p.location)+'</span>' +
              '<span>🗓 '+fmtDate(p.date_lost_found)+'</span>' +
            '</div>' +
          '</div>' +
          '<div class="feed-icon '+p.type+'">'+postThumb(p)+'</div>' +
        '</div>' +
        '<p class="feed-card-desc">'+esc(p.description)+'</p>' +
        '<div class="feed-card-foot"><span>Reported by '+esc(p.owner_name||"Unknown")+'</span><span class="mono">#'+String(p.id).padStart(4,"0")+'</span></div>' +
      '</div>'
    );
  }

  let STALE_COLLAPSED = 5;
  let sidebarExpanded = false;
  let sidebarStaleList = [];

  function loadSidebar(){
    sidebarExpanded = false;
    api.listPosts({stale: 1, limit: 20}).then(function(res){
      sidebarStaleList = res.posts || [];
      renderSidebar();
    }).catch(function(){
      sidebarStaleList = [];
      renderSidebar();
    });
  }

  function renderSidebar(){
    let box = document.getElementById("feed-sidebar");
    if(!box) return;

    let head =
      '<div class="sidebar-head">'+icon("clock","sidebar-head-icon")+'<h3>Still Not Found</h3></div>' +
      '<p class="sidebar-sub">Open for a month or more — the longest-waiting reports on the board.</p>';

    if(sidebarStaleList.length === 0){
      box.innerHTML = head + '<p class="sidebar-empty">Nothing has been pending for a month yet. Good sign.</p>';
      return;
    }

    let visibleCount = sidebarExpanded ? sidebarStaleList.length : Math.min(STALE_COLLAPSED, sidebarStaleList.length);
    let visible = sidebarStaleList.slice(0, visibleCount);
    let list = '<div class="sidebar-list">' + visible.map(renderSidebarItem).join("") + '</div>';

    let toggle = "";
    if(sidebarStaleList.length > STALE_COLLAPSED){
      toggle = sidebarExpanded
        ? '<button class="sidebar-toggle" id="sidebar-toggle">Show less</button>'
        : '<button class="sidebar-toggle" id="sidebar-toggle">Show '+(sidebarStaleList.length - STALE_COLLAPSED)+' more</button>';
    }

    box.innerHTML = head + list + toggle;

    box.querySelectorAll(".sidebar-item").forEach(function(item){
      let p = sidebarStaleList.filter(function(x){ return String(x.id) === item.getAttribute("data-id"); })[0];
      if(p) item.addEventListener("click", function(){ window.location.href = "post-details.html?id=" + p.id; });
    });
    let toggleBtn = document.getElementById("sidebar-toggle");
    if(toggleBtn){
      toggleBtn.addEventListener("click", function(){
        sidebarExpanded = !sidebarExpanded;
        renderSidebar();
      });
    }
  }

  function renderSidebarItem(p){
    return (
      '<button class="sidebar-item" data-id="'+p.id+'">' +
        '<div class="sidebar-icon '+p.type+'">'+postThumb(p)+'</div>' +
        '<div class="sidebar-text">' +
          '<div class="name">'+esc(p.item_name)+'</div>' +
          '<div class="meta">'+(p.type==="lost"?"Lost":"Found")+' · '+esc(p.location)+'</div>' +
        '</div>' +
        '<span class="sidebar-days">'+p.days_pending+'d</span>' +
      '</button>'
    );
  }

requireSession(["user"]).then(function(){
  renderHeader("feed");
  renderFeed();

  window.onPostsMutated = function(){
    renderFeedGrid();
    loadSidebar();
  };
  window.onHeaderSearchChange = function(){
    renderFeedGrid();
  };
  window.onRealtimeEvent = function(event){
    if(event === "posts_changed"){
      renderFeedGrid();
      loadSidebar();
    }
  };
});
