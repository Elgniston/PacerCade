const intervalSlider = document.getElementById("intervalSlider");
const intervalValue = document.getElementById("intervalValue");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const frequencySlider = document.getElementById("frequencySlider");
const durationSlider = document.getElementById("durationSlider");
const volumeSlider = document.getElementById("volumeSlider");
const frequencyValue = document.getElementById("frequencyValue");
const durationValue = document.getElementById("durationValue");
const volumeValue = document.getElementById("volumeValue");

let audioCtx = null;
let timerId = null;

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function wirePressVisuals(button) {
  const setPressed = (isPressed) => {
    button.classList.toggle("pressed", isPressed);
  };

  button.addEventListener("pointerdown", () => setPressed(true));
  button.addEventListener("pointerup", () => setPressed(false));
  button.addEventListener("pointerleave", () => setPressed(false));
  button.addEventListener("pointercancel", () => setPressed(false));
}

function updateIntervalLabel() {
  intervalValue.textContent = Number(intervalSlider.value).toFixed(2);
}

function updateToneDisplays() {
  frequencyValue.textContent = frequencySlider.value;
  durationValue.textContent = durationSlider.value;
  volumeValue.textContent = Number(volumeSlider.value).toFixed(2);
}

function playBeep() {
  ensureAudioContext();

  const now = audioCtx.currentTime;
  const duration = Number(durationSlider.value) / 1000;
  const frequency = Number(frequencySlider.value);
  const volume = Number(volumeSlider.value);

  const oscillator = audioCtx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);

  const envelope = audioCtx.createGain();
  envelope.gain.setValueAtTime(volume, now);
  envelope.gain.linearRampToValueAtTime(0.001, now + duration);

  oscillator.connect(envelope).connect(audioCtx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function scheduleBeats({ playImmediately } = { playImmediately: true }) {
  stopBeats();

  const intervalSeconds = Number(intervalSlider.value);
  const intervalMs = intervalSeconds * 1000;

  if (playImmediately) {
    playBeep();
  }
  timerId = setInterval(playBeep, intervalMs);
}

function stopBeats() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

intervalSlider.addEventListener("input", () => {
  updateIntervalLabel();
  if (timerId) {
    scheduleBeats({ playImmediately: false });
  }
});

[frequencySlider, durationSlider, volumeSlider].forEach((control) => {
  control.addEventListener("input", () => {
    updateToneDisplays();
  });
});

startBtn.addEventListener("click", () => scheduleBeats());
stopBtn.addEventListener("click", () => stopBeats());

wirePressVisuals(startBtn);
wirePressVisuals(stopBtn);

updateIntervalLabel();
updateToneDisplays();
