/* ---------------------------------------------------------
   Admin Dashboard page (Section 12). Loaded after api.js, common.js,
   modals.js, realtime.js.  s
--------------------------------------------------------- */
window.CURRENT_PAGE = "admin";

var adminTab = "posts";
var adminPostsCache = [];
var adminUsersCache = [];
var adminReportsCache = [];

  function renderAdmin(){
    var main = document.getElementById("main");
    main.innerHTML =
      '<div class="view-head"><div><h2 class="display">Administrator Dashboard</h2><p>Manage user accounts, moderate posts, and review reports.</p></div></div>' +
      '<div class="summary-grid" id="admin-summary"><div class="empty-state">Loading…</div></div>' +
      '<div class="panel"><div class="panel-head"><h3>Recent Posts</h3></div><div class="table-scroll" id="admin-recent"></div></div>' +
      '<div class="admin-tabs">' +
        '<button class="filter-tab '+(adminTab==="posts"?"active":"")+'" data-atab="posts" style="border:1px solid var(--line-strong);border-radius:2px;">Manage Posts</button>' +
        '<button class="filter-tab '+(adminTab==="users"?"active":"")+'" data-atab="users" style="border:1px solid var(--line-strong);border-radius:2px;">Manage Users</button>' +
        '<button class="filter-tab '+(adminTab==="reports"?"active":"")+'" data-atab="reports" style="border:1px solid var(--line-strong);border-radius:2px;" id="admin-reports-tab">Reports</button>' +
      '</div>' +
      '<div id="admin-panel"><div class="empty-state">Loading…</div></div>';

    document.querySelectorAll("[data-atab]").forEach(function(btn){
      btn.addEventListener("click", function(){ adminTab = btn.getAttribute("data-atab"); renderAdminPanel(); });
    });

    api.adminDashboard().then(function(res){
      pendingReportsCount = res.summary.pendingReports;
      renderHeader("admin");

      var sg = document.getElementById("admin-summary");
      if(sg){
        sg.innerHTML =
          summaryCard(res.summary.totalUsers, "Total Users") +
          summaryCard(res.summary.totalPosts, "Total Posts") +
          summaryCard(res.summary.pendingReports, "Pending Reports") +
          summaryCard(res.summary.resolvedItems, "Resolved Items");
      }
      var tab = document.getElementById("admin-reports-tab");
      if(tab) tab.textContent = "Reports (" + res.summary.pendingReports + ")";

      var recentBox = document.getElementById("admin-recent");
      if(recentBox) recentBox.innerHTML = recentPostsTable(res.recentPosts || []);
    }).catch(errToast);

    renderAdminPanel();
  }

  function summaryCard(num, lbl){
    return '<div class="summary-card"><div class="num">'+num+'</div><div class="lbl">'+lbl+'</div></div>';
  }

  function recentPostsTable(recent){
    if(recent.length === 0) return '<p style="padding:16px 18px;color:var(--ink-soft);">No posts yet.</p>';
    var rows = recent.map(function(p){
      return '<tr><td>'+(p.image_url?'🖼️':esc(p.icon))+' '+esc(p.item_name)+'</td><td><span class="tag-type '+p.type+'" style="border-radius:9px;">'+typeLabel(p.type)+'</span></td><td>'+esc(p.owner_name||"—")+'</td><td>'+esc(p.location)+'</td><td>'+fmtDate(p.date_lost_found)+'</td></tr>';
    }).join("");
    return '<table><thead><tr><th>Item</th><th>Type</th><th>Reported by</th><th>Location</th><th>Date</th></tr></thead><tbody>'+rows+'</tbody></table>';
  }

  function renderAdminPanel(){
    document.querySelectorAll("[data-atab]").forEach(function(btn){
      btn.classList.toggle("active", btn.getAttribute("data-atab") === adminTab);
    });
    var panel = document.getElementById("admin-panel");
    if(!panel) return;
    panel.innerHTML = '<div class="empty-state">Loading…</div>';

    if(adminTab === "posts"){
      api.adminPosts().then(function(res){
        adminPostsCache = res.posts || [];
        panel.innerHTML = adminPostsPanel(adminPostsCache);
        bindAdminPanelEvents();
      }).catch(errToast);
    } else if(adminTab === "users"){
      api.adminUsers().then(function(res){
        adminUsersCache = res.users || [];
        panel.innerHTML = adminUsersPanel(adminUsersCache);
        bindAdminPanelEvents();
      }).catch(errToast);
    } else {
      api.adminReports().then(function(res){
        adminReportsCache = res.reports || [];
        panel.innerHTML = adminReportsPanel(adminReportsCache);
        bindAdminPanelEvents();
      }).catch(errToast);
    }
  }

  function adminPostsPanel(posts){
    if(posts.length === 0){
      return '<div class="panel"><div class="panel-head"><h3>All Posts</h3></div><div class="empty-state" style="border:none;">No posts to manage right now.</div></div>';
    }
    var rows = posts.map(function(p){
      return '<tr><td>'+(p.image_url?'🖼️':esc(p.icon))+' '+esc(p.item_name)+'</td><td>'+esc(p.owner_name||"—")+'</td><td><span class="tag-type '+p.type+'" style="border-radius:9px;">'+typeLabel(p.type)+'</span></td><td>'+esc(p.location)+'</td>' +
        '<td class="row-actions"><button class="btn ghost small" data-admin-action="view-post" data-id="'+p.id+'">View</button><button class="btn danger small" data-admin-action="remove-post" data-id="'+p.id+'">Remove</button></td></tr>';
    }).join("");
    return '<div class="panel"><div class="panel-head"><h3>All Posts</h3></div><div class="table-scroll"><table><thead><tr><th>Item</th><th>Reported by</th><th>Type</th><th>Location</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }

  function adminUsersPanel(users){
    var rows = users.map(function(u){
      var actionLabel = u.status === "active" ? "Disable" : "Enable";
      return '<tr><td>'+esc(u.name)+'</td><td>'+esc(u.email)+'</td><td>'+esc(u.role)+'</td>' +
        '<td><span class="status-badge '+(u.status==="active"?"active":"disabled")+'">'+esc(u.status)+'</span></td>' +
        '<td class="row-actions">'+(u.role!=="admin" ? '<button class="btn ghost small" data-admin-action="toggle-user" data-id="'+u.id+'">'+actionLabel+'</button>' : '<span style="color:var(--ink-soft);font-size:0.8rem;">—</span>')+'</td></tr>';
    }).join("");
    return '<div class="panel"><div class="panel-head"><h3>User Accounts</h3></div><div class="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }

  function adminReportsPanel(reports){
    if(reports.length === 0){
      return '<div class="panel"><div class="panel-head"><h3>Reports</h3></div><div class="empty-state" style="border:none;">No reports have been filed.</div></div>';
    }
    var rows = reports.map(function(r){
      var postLabel = r.post_id !== null ? esc(r.post_title) : '<em>Post removed</em>';
      var actions = r.status === "pending"
        ? '<button class="btn ghost small" data-admin-action="dismiss-report" data-id="'+r.id+'">Dismiss</button>' +
          (r.post_id !== null ? '<button class="btn danger small" data-admin-action="report-remove-post" data-id="'+r.id+'">Remove Post</button>' : "")
        : '<span class="status-badge disabled">'+esc(r.status)+'</span>';
      return '<tr><td>'+postLabel+'</td><td>'+esc(r.reporter_name||"—")+'</td><td>'+esc(r.reason)+'</td><td class="row-actions">'+actions+'</td></tr>';
    }).join("");
    return '<div class="panel"><div class="panel-head"><h3>Reports</h3></div><div class="table-scroll"><table><thead><tr><th>Post</th><th>Reported by</th><th>Reason</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }

  function bindAdminPanelEvents(){
    document.querySelectorAll('[data-admin-action="view-post"]').forEach(function(b){
      b.addEventListener("click", function(){
        window.location.href = "post-details.html?id=" + b.getAttribute("data-id");
      });
    });
    document.querySelectorAll('[data-admin-action="remove-post"]').forEach(function(b){
      b.addEventListener("click", function(){
        api.deletePost(b.getAttribute("data-id")).then(function(){
          toast("Post removed by administrator.");
          renderAdmin();
        }).catch(errToast);
      });
    });
    document.querySelectorAll('[data-admin-action="toggle-user"]').forEach(function(b){
      b.addEventListener("click", function(){
        api.adminToggleUser(b.getAttribute("data-id")).then(function(){
          toast("Account status updated.");
          renderAdminPanel();
        }).catch(errToast);
      });
    });
    document.querySelectorAll('[data-admin-action="dismiss-report"]').forEach(function(b){
      b.addEventListener("click", function(){
        api.adminDismissReport(b.getAttribute("data-id")).then(function(){
          toast("Report dismissed.");
          renderAdmin();
        }).catch(errToast);
      });
    });
    document.querySelectorAll('[data-admin-action="report-remove-post"]').forEach(function(b){
      b.addEventListener("click", function(){
        api.adminRemoveReportPost(b.getAttribute("data-id")).then(function(){
          toast("Post removed and report resolved.");
          renderAdmin();
        }).catch(errToast);
      });
    });
  }


/* ---------------------------------------------------------
   Page bootstrap
--------------------------------------------------------- */
requireSession(["admin"]).then(function(){
  renderHeader("admin");
  renderAdmin();

  window.onPostsMutated = renderAdmin;
  window.focusReportsTab = function(){
    adminTab = "reports";
    renderAdminPanel();
  };
  window.onRealtimeEvent = function(event){
    // Any change anywhere (a post, a report, a user) can move a number
    // on this dashboard, so just refresh the whole thing — cheap enough
    // for an admin-only local screen, and keeps this simple.
    if(event === "posts_changed" || event === "reports_changed" || event === "users_changed"){
      renderAdmin();
    }
  };
});
