window.CURRENT_PAGE = null;

renderHeader(null);
redirectIfLoggedIn(); // bounces straight to feed.html/admin.html if a session already exists

document.getElementById("login-form").addEventListener("submit", function(e){
  e.preventDefault();
  var email = document.getElementById("login-email").value.trim();
  var pass = document.getElementById("login-password").value;
  if(!email || !pass){ toast("Please fill in both fields."); return; }

  var submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  api.login({email: email, password: pass}).then(function(res){
    sessionUser = res.user;
    toast("Welcome back, " + res.user.name.split(" ")[0] + ".");
    window.location.href = res.user.role === "admin" ? "admin.html" : "feed.html";
  }).catch(function(err){
    submitBtn.disabled = false;
    errToast(err);
  });
});
