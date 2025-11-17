const slider = document.getElementById("intervalSlider");
const valueSpan = document.getElementById("intervalValue");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

let timerId = null;
const beep = new Audio("beep.mp3");
beep.preload = "auto";

function updateLabel() {
  const seconds = Number(slider.value).toFixed(2);
  valueSpan.textContent = seconds;
}

function playBeep() {
  // Rewind and play the audio clip so each beat uses the full sample
  try {
    beep.currentTime = 0;
  } catch (err) {
    // Some mobile browsers block setting currentTime before metadata loads
  }
  beep.play();
}

function scheduleBeats() {
  stopBeats();

  const intervalSeconds = Number(slider.value);
  const intervalMs = intervalSeconds * 1000;

  playBeep();
  timerId = setInterval(playBeep, intervalMs);
}

function stopBeats() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

slider.addEventListener("input", () => {
  updateLabel();
  if (timerId) {
    scheduleBeats(); // immediately re-sync if the timer is running
  }
});

startBtn.addEventListener("click", scheduleBeats);
stopBtn.addEventListener("click", stopBeats);

function wirePressVisuals(button) {
  const setPressed = (isPressed) => {
    button.classList.toggle("pressed", isPressed);
  };

  button.addEventListener("pointerdown", () => setPressed(true));
  button.addEventListener("pointerup", () => setPressed(false));
  button.addEventListener("pointerleave", () => setPressed(false));
  button.addEventListener("pointercancel", () => setPressed(false));
}

wirePressVisuals(startBtn);
wirePressVisuals(stopBtn);

updateLabel();
