const slider = document.getElementById("intervalSlider");
const valueSpan = document.getElementById("intervalValue");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

let timerId = null;
let audioCtx = null;

function updateLabel() {
  const seconds = Number(slider.value).toFixed(2);
  valueSpan.textContent = seconds;
}

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playBeep() {
  ensureAudioContext();

  const now = audioCtx.currentTime;
  const duration = 0.08; // seconds

  const oscillator = audioCtx.createOscillator();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(880, now);

  const envelope = audioCtx.createGain();
  envelope.gain.setValueAtTime(0.3, now);
  envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.connect(envelope).connect(audioCtx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
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
