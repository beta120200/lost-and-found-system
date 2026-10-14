window.CURRENT_PAGE = null;

renderHeader(null);
redirectIfLoggedIn();

document.getElementById("signup-form").addEventListener("submit", function(e){
  e.preventDefault();
  var name = document.getElementById("signup-name").value.trim();
  var email = document.getElementById("signup-email").value.trim();
  var pass = document.getElementById("signup-password").value;
  if(!name || !email || !pass){ toast("Please complete all fields."); return; }

  var submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  api.signup({name: name, email: email, password: pass}).then(function(res){
    sessionUser = res.user;
    toast("Account created. Welcome, " + name.split(" ")[0] + "!");
    window.location.href = "feed.html";
  }).catch(function(err){
    submitBtn.disabled = false;
    errToast(err);
  });
});
