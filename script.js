const slider = document.getElementById("intervalSlider");
const valueSpan = document.getElementById("intervalValue");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

let timerId = null;
const beep = new Audio("beep.mp3");

// update text when slider moves
function updateLabel() {
  const seconds = parseFloat(slider.value).toFixed(2);
  valueSpan.textContent = seconds;
}

slider.addEventListener("input", () => {
  updateLabel();
  // if you want, you could also change the running timer on the fly later
});

function playBeep() {
  beep.currentTime = 0; // rewind to start
  beep.play();
}

function startBeats() {
  stopBeats(); // clear any old timer

  const intervalSeconds = parseFloat(slider.value);
  const intervalMs = intervalSeconds * 1000;

  // play immediately
  playBeep();

  // then set up repeating timer
  timerId = setInterval(playBeep, intervalMs);
}

function stopBeats() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

startBtn.addEventListener("click", startBeats);
stopBtn.addEventListener("click", stopBeats);

// initialize label text
updateLabel();
