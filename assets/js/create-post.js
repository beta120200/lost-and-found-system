/* ---------------------------------------------------------
   Create Post page (Section 11 flowchart / Section 6). Also handles
   editing via ?edit=<id> — the doc only lists "Create Post" as a page,
   but reusing this same form for edits (rather than inventing a
   second near-identical page) is the more sensible read of that,
   and it's exactly the field set Section 11's "Enter Item Details"
   step describes either way.
--------------------------------------------------------- */
window.CURRENT_PAGE = null;

function toggleFieldError(fieldId, isInvalid){
  var el = document.getElementById(fieldId);
  if(el) el.classList.toggle("invalid", !!isInvalid);
}

function renderForm(editing, presetType){
  var main = document.getElementById("main");
  var selectedIcon = editing ? (editing.icon || ICONS[0]) : ICONS[0];
  var selectedFile = null;
  var backHref = editing ? "my-posts.html" : "feed.html";

  var photoField = editing ? "" :
    '<div class="field">' +
      '<label>Photo (optional)</label>' +
      '<input type="file" accept="image/*" id="pf-image">' +
      '<p class="note">Uploaded to ImgBB with a 3-month expiration (Section 7.2). If no photo is attached — or no ImgBB key is configured — the icon below is used instead.</p>' +
    '</div>';

  main.innerHTML =
    '<a href="'+backHref+'" class="page-back">&larr; Cancel</a>' +
    '<div class="page-card">' +
      '<div class="page-card-head"><h2 class="display">'+(editing?"Edit Post":"New Report")+'</h2></div>' +
      '<div class="field">' +
        '<label>Type</label>' +
        '<div class="role-toggle">' +
          '<div class="role-opt" data-type="lost" id="type-lost">Lost</div>' +
          '<div class="role-opt" data-type="found" id="type-found">Found</div>' +
        '</div>' +
      '</div>' +
      '<div class="field" id="field-name"><label>Item name</label><input type="text" id="pf-name" value="'+esc(editing?editing.item_name:"")+'" placeholder="e.g. Black Leather Wallet"><div class="field-error">Please enter an item name.</div></div>' +
      '<div class="field" id="field-desc"><label>Description</label><textarea id="pf-desc" placeholder="What does it look like? Any identifying details?">'+esc(editing?editing.description:"")+'</textarea><div class="field-error">Please add a short description.</div></div>' +
      '<div class="field" id="field-loc"><label>Location</label><input type="text" id="pf-loc" value="'+esc(editing?editing.location:"")+'" placeholder="e.g. Library, Ground Floor"><div class="field-error">Please enter a location.</div></div>' +
      '<div class="field" id="field-date"><label>Date</label><input type="date" id="pf-date" value="'+(editing?editing.date_lost_found:new Date().toISOString().slice(0,10))+'"><div class="field-error">Please choose a date.</div></div>' +
      photoField +
      '<div class="field"><label>Icon'+(editing?"":" (used if no photo is attached)")+'</label><div class="icon-picker" id="icon-picker">' +
        ICONS.map(function(ic){ return '<button type="button" class="icon-opt" data-icon="'+ic+'">'+ic+'</button>'; }).join("") +
      '</div></div>' +
      '<div class="page-card-actions"><a class="btn ghost" href="'+backHref+'">Cancel</a><button class="btn" id="pf-submit">'+(editing?"Save Changes":"Create Post")+'</button></div>' +
    '</div>';

  var type = editing ? editing.type : (presetType || "lost");
  function paintType(){
    document.getElementById("type-lost").classList.toggle("selected", type==="lost");
    document.getElementById("type-found").classList.toggle("selected", type==="found");
  }
  paintType();
  document.getElementById("type-lost").addEventListener("click", function(){ type="lost"; paintType(); });
  document.getElementById("type-found").addEventListener("click", function(){ type="found"; paintType(); });

  var iconPicker = document.getElementById("icon-picker");
  function paintIcons(){
    iconPicker.querySelectorAll(".icon-opt").forEach(function(btn){
      btn.classList.toggle("selected", btn.getAttribute("data-icon") === selectedIcon);
    });
  }
  paintIcons();
  iconPicker.querySelectorAll(".icon-opt").forEach(function(btn){
    btn.addEventListener("click", function(){ selectedIcon = btn.getAttribute("data-icon"); paintIcons(); });
  });

  var fileInput = document.getElementById("pf-image");
  if(fileInput){
    fileInput.addEventListener("change", function(){
      selectedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    });
  }

  document.getElementById("pf-submit").addEventListener("click", function(){
    var name = document.getElementById("pf-name").value.trim();
    var desc = document.getElementById("pf-desc").value.trim();
    var loc = document.getElementById("pf-loc").value.trim();
    var date = document.getElementById("pf-date").value;

    var valid = true;
    toggleFieldError("field-name", !name); if(!name) valid=false;
    toggleFieldError("field-desc", !desc); if(!desc) valid=false;
    toggleFieldError("field-loc", !loc); if(!loc) valid=false;
    toggleFieldError("field-date", !date); if(!date) valid=false;
    if(!valid){ toast("Please fix the highlighted fields."); return; }

    var submitBtn = document.getElementById("pf-submit");
    submitBtn.disabled = true;

    if(editing){
      api.updatePost(editing.id, {
        type: type, item_name: name, description: desc, location: loc,
        date_lost_found: date, icon: selectedIcon
      }).then(function(){
        toast("Post updated.");
        window.location.href = "my-posts.html";
      }).catch(function(err){
        submitBtn.disabled = false;
        errToast(err);
      });
    } else {
      var fd = new FormData();
      fd.append("type", type);
      fd.append("item_name", name);
      fd.append("description", desc);
      fd.append("location", loc);
      fd.append("date_lost_found", date);
      fd.append("icon", selectedIcon);
      if(selectedFile) fd.append("image", selectedFile);

      api.createPost(fd).then(function(){
        toast("Post created and added to the feed.");
        window.location.href = "feed.html";
      }).catch(function(err){
        submitBtn.disabled = false;
        errToast(err);
      });
    }
  });
}

/* ---------------------------------------------------------
   Page bootstrap
--------------------------------------------------------- */
requireSession(["user"]).then(function(u){
  renderHeader(null);
  var editId = getQueryParam("edit");
  var presetType = getQueryParam("type");

  if(editId){
    api.getPost(editId).then(function(res){
      if(res.post.user_id !== u.id){
        toast("You can only edit your own posts.");
        window.location.href = "my-posts.html";
        return;
      }
      renderForm(res.post, null);
    }).catch(function(err){
      errToast(err);
      window.location.href = "my-posts.html";
    });
  } else {
    renderForm(null, presetType);
  }
});
