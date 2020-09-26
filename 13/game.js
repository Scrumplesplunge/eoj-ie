var Config = {
  targetLag: 75,       // Lag (in milliseconds) to test for.
  rounds: 20,          // Number of trials to run.
  significance: 0.01,  // Hypothesis test significance.
};

// Put the actual lag number from the config into the page.
for (var tag of document.querySelectorAll(".ms")) {
  tag.innerText = Config.targetLag + "ms";
}

var hasLag = Math.random() < 0.5;
var correct = 0;
var done = 0;

function guess(userPerceivesLag) {
  if (hasLag === userPerceivesLag) {
    console.log("Yup");
    correct++;
  } else {
    console.log("Nope");
  }
  hasLag = Math.random() < 0.5;
  done++;
  progress.style.width = Math.round(200 * done / Config.rounds) + "px";
  if (done == Config.rounds) finish();
}

function product(a, b) {
  var total = 1;
  for (var i = a; i <= b; i++) total *= i;
  return total;
}

function choose(n, k) { return product(n - k + 1, n) / product(1, k) }

// P(X = k) where X ~ Binomial(n, 0.5)
function pmf(n, k) { return Math.pow(0.5, n) * choose(n, k) }

// P(X <= k) where X ~ Binomial(n, 0.5)
function cdf(n, k) {
  var total = 0;
  for (var i = 0; i <= k; i++) total += pmf(n, i);
  return total;
}

function finish() {
  // Null hypothesis: the user can't tell the difference between lag and no lag.
  // In this case, the user's guesses are a binomial distribution. We'll compute
  // the probability that such a distribution would guess at least as many as
  // the user did correctly and compare this against our confidence requirement.
  // P(X >= correct) = 1 - P(X < correct) = 1 - P(X <= correct - 1)
  var p = 1 - cdf(Config.rounds, correct - 1);
  verdict.className = p < Config.significance ? "yup" : "nope";
  verdict.innerText = p < Config.significance ? "YUP" : "NOPE";
  confidence.innerText = "P(X >= " + correct + ") = " + p.toFixed(5);
  summary.style.display = "table";
}

function reset() {
  hasLag = Math.random() < 0.5;
  correct = 0;
  done = 0;
  summary.style.display = "none";
}

function toggle() {
  preview.className = preview.className == "a" ? "b" : "a";
}

preview.addEventListener("mouseover", event => preview.focus());
preview.addEventListener("mouseout", event => preview.blur());
preview.addEventListener("mousedown", event => {
  if (event.button != 0) return;
  if (hasLag) {
    setTimeout(toggle, Config.targetLag);
  } else {
    toggle();
  }
  event.preventDefault();
});
lag.addEventListener("mousedown", event => {
  guess(true);
  event.preventDefault();
});
nolag.addEventListener("mousedown", event => {
  guess(false);
  event.preventDefault();
});
summary.addEventListener("click", event => {
  reset();
  event.preventDefault();
});
