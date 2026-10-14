/* ---------------------------------------------------------
   Shared confirmation modals — report, resolve-confirm, delete-confirm.
   Used by post-details.html and my-posts.html, loaded after api.js and
   common.js. (Post detail and Create/Edit Post used to live here too,
   as modals — they're now real pages: post-details.html and
   create-post.html, matching Section 6 of the doc.)

   Each caller can set window.onPostsMutated() beforehand with whatever
   should happen after a successful delete/resolve — a grid refresh on
   my-posts.html, a redirect on post-details.html. These modals just
   call it, they don't know or care which page they're on.
--------------------------------------------------------- */

function confirmDeletePost(id){
  openModal(
    '<div class="modal-head"><h3>Delete post?</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
    '<div class="modal-body"><p>This removes the report from the board. This can&rsquo;t be undone.</p></div>' +
    '<div class="modal-foot"><button class="btn ghost" data-action="close-modal">Cancel</button><button class="btn danger" id="confirm-delete">Delete Post</button></div>',
    function(){
      bindModalCommon();
      document.getElementById("confirm-delete").addEventListener("click", function(btnEvt){
        var btn = document.getElementById("confirm-delete");
        btn.disabled = true;
        api.deletePost(id).then(function(){
          closeModal();
          toast("Post deleted.");
          if(window.onPostsMutated) window.onPostsMutated();
        }).catch(function(err){
          btn.disabled = false;
          errToast(err);
        });
      });
    }
  );
}

function openResolveConfirm(id){
  openModal(
    '<div class="modal-head"><h3>Mark as found</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
    '<div class="modal-body"><p>Has the owner confirmed they are back in possession of the item?</p>' +
    '<p class="note">Per the resolution flow, confirming this permanently deletes the post record. The item photo (hosted on ImgBB) expires on its own 3-month schedule regardless of this action.</p></div>' +
    '<div class="modal-foot"><button class="btn ghost" id="resolve-no">Not Yet — Keep Pending</button><button class="btn success" id="resolve-yes">Yes, Confirmed</button></div>',
    function(){
      bindModalCommon();
      document.getElementById("resolve-no").addEventListener("click", function(){
        closeModal();
        toast("Post kept as pending.");
      });
      document.getElementById("resolve-yes").addEventListener("click", function(){
        var btn = document.getElementById("resolve-yes");
        btn.disabled = true;
        api.resolvePost(id, true).then(function(){
          closeModal();
          toast("Item resolved — post removed from the board.");
          if(window.onPostsMutated) window.onPostsMutated();
        }).catch(function(err){
          btn.disabled = false;
          errToast(err);
        });
      });
    }
  );
}

function openReportForm(id){
  openModal(
    '<div class="modal-head"><h3>Report post</h3><button class="modal-close" data-action="close-modal">&times;</button></div>' +
    '<div class="modal-body">' +
      '<div class="field"><label>Reason</label>' +
        '<select id="report-reason">' +
          '<option>This item belongs to me</option>' +
          '<option>Item already claimed</option>' +
          '<option>Duplicate post</option>' +
          '<option>Inappropriate content</option>' +
          '<option>Other</option>' +
        '</select>' +
      '</div>' +
      '<div class="field"><label>Details</label><textarea id="report-details" placeholder="Add any details that will help an administrator review this."></textarea></div>' +
    '</div>' +
    '<div class="modal-foot"><button class="btn ghost" data-action="close-modal">Cancel</button><button class="btn" id="submit-report">Submit Report</button></div>',
    function(){
      bindModalCommon();
      document.getElementById("submit-report").addEventListener("click", function(){
        var reason = document.getElementById("report-reason").value;
        var details = document.getElementById("report-details").value.trim();
        var btn = document.getElementById("submit-report");
        btn.disabled = true;
        api.reportPost(id, {reason: reason + (details ? " — " + details : "")}).then(function(){
          closeModal();
          toast("Report submitted for administrator review.");
        }).catch(function(err){
          btn.disabled = false;
          errToast(err);
        });
      });
    }
  );
}
