window.CURRENT_PAGE = null;

renderHeader(null);
redirectIfLoggedIn();

function capitalizeName(name) {
  if (!name) return "";
  return name.toLowerCase().replace(/\b\w/g, function (char) {
    return char.toUpperCase();
  });
}

const passInput = document.getElementById("signup-password");
const confirmPassInput = document.getElementById("signup-confirm-password");
const confirmError = document.getElementById("confirm-password-error");
const rulesContainer = document.getElementById("password-rules");

const firstNameInput = document.getElementById("signup-first-name");
const lastNameInput = document.getElementById("signup-last-name");
const emailInput = document.getElementById("signup-email");

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|ph|co|edu)(?:\.(?:com|ph|co|edu|in))?$/i;

firstNameInput.addEventListener("blur", function () {
  this.value = capitalizeName(this.value);
});

lastNameInput.addEventListener("blur", function () {
  this.value = capitalizeName(this.value);
});

emailInput.addEventListener("blur", function () {
  const emailVal = this.value.trim();
  if (emailVal.length > 0 && !emailRegex.test(emailVal)) {
    this.style.borderColor = "#ff4d4f";
  } else {
    this.style.borderColor = "";
  }
});

emailInput.addEventListener("input", function () {
  this.style.borderColor = "";
});


const rules = [
  {
    id: 'capital',
    text: 'At least 1 Capital Letter',
    test: (p) => /[A-Z]/.test(p),
    cssClass: 'rule-capital'
  },
  {
    id: 'symbol',
    text: 'At least 1 Symbol (e.g., !@#$%^&*)',
    test: (p) => /[^a-zA-Z0-9\s]/.test(p),
    cssClass: ''
  },
  {
    id: 'length',
    text: 'At least 8 characters long',
    test: (p) => p.length >= 8,
    cssClass: ''
  }
];

function updatePasswordRules() {
  const val = passInput.value;

  if (val.length === 0) {
    rulesContainer.innerHTML = '';
    return;
  }

  let html = '';
  let allPassed = true;

  rules.forEach(rule => {
    if (!rule.test(val)) {
      allPassed = false;
      html += `<div class="rule-item ${rule.cssClass}">✖ ${rule.text}</div>`;
    }
  });

  if (allPassed) {
    rulesContainer.innerHTML = `<div class="rule-item rule-success">✔ Password is strong</div>`;
  } else {
    rulesContainer.innerHTML = html;
  }
}

function checkPasswordMatch() {
  if (confirmPassInput.value.length > 0) {
    if (passInput.value !== confirmPassInput.value) {
      confirmError.style.display = "block";
      confirmPassInput.style.borderColor = "#ff4d4f";
    } else {
      confirmError.style.display = "none";
      confirmPassInput.style.borderColor = "";
    }
  } else {
    confirmError.style.display = "none";
    confirmPassInput.style.borderColor = "";
  }
}

passInput.addEventListener("input", updatePasswordRules);
passInput.addEventListener("input", checkPasswordMatch);
confirmPassInput.addEventListener("input", checkPasswordMatch);

document.getElementById("signup-form").addEventListener("submit", function (e) {
  e.preventDefault();

  let firstName = capitalizeName(firstNameInput.value.trim());
  let lastName = capitalizeName(lastNameInput.value.trim());
  let email = emailInput.value.trim();
  let pass = passInput.value;
  let confirmPass = confirmPassInput.value;

  if (!firstName || !lastName || !email || !pass || !confirmPass) {
    toast("Please complete all fields.");
    return;
  }

  if (!emailRegex.test(email)) {
    toast("Please enter a valid email (.edu, .com, .co, ph, or .in).");
    emailInput.style.borderColor = "#ff4d4f";
    emailInput.focus();
    return;
  }

  if (pass !== confirmPass) {
    toast("Passwords do not match.");
    confirmPassInput.focus();
    return;
  }

  const isCapitalValid = /[A-Z]/.test(pass);
  const isSymbolValid = /[^a-zA-Z0-9\s]/.test(pass);
  const isLengthValid = pass.length >= 8;

  if (!isCapitalValid || !isSymbolValid || !isLengthValid) {
    toast("Your password does not meet all requirements.");
    passInput.focus();
    return;
  }

  let submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  let fullName = firstName + " " + lastName;

  api.signup({ name: fullName, email: email, password: pass }).then(function (res) {
    sessionUser = res.user;
    toast("Account created. Welcome, " + firstName + "!");
    window.location.href = "feed.html";
  }).catch(function (err) {
    submitBtn.disabled = false;
    errToast(err);
  });
});