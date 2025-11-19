const intervalSlider = document.getElementById("intervalSlider");
const intervalValue = document.getElementById("intervalValue");
const bpmValue = document.getElementById("bpmValue");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const playlistBtn = document.getElementById("playlistBtn");
const frequencySlider = document.getElementById("frequencySlider");
const durationSlider = document.getElementById("durationSlider");
const volumeSlider = document.getElementById("volumeSlider");
const frequencyValue = document.getElementById("frequencyValue");
const durationValue = document.getElementById("durationValue");
const volumeValue = document.getElementById("volumeValue");
const playlistStatus = document.getElementById("playlistStatus");

const PLAYLIST_SERVICE_BASE_URL =
  "https://pacercade-playlist-service.vercel.app";
let spotifyAccessToken = null;
let spotifyTokenExpiresAt = 0;
let pendingBpmRequest = null;
let authPopup = null;

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
  const bpm = Math.round(60 / Number(intervalSlider.value));
  bpmValue.textContent = bpm;
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

function handleIntervalInput() {
  updateIntervalLabel();
  if (timerId) {
    scheduleBeats({ playImmediately: false });
  }
}

function setPlaylistStatus(message, state = "idle") {
  if (!playlistStatus) return;
  playlistStatus.innerHTML = message;
  playlistStatus.className = `playlist-status ${state}`;
}

function getCurrentBpm() {
  return Math.round(60 / Number(intervalSlider.value));
}

function hasValidSpotifyToken() {
  if (!spotifyAccessToken || !spotifyTokenExpiresAt) {
    return false;
  }
  const expiresInMs = spotifyTokenExpiresAt - Date.now();
  return expiresInMs > 60 * 1000;
}

function openSpotifyLoginWindow() {
  const loginUrl = new URL(`${PLAYLIST_SERVICE_BASE_URL}/api/login`);
  loginUrl.searchParams.set("ts", Date.now().toString());

  authPopup = window.open(
    loginUrl.toString(),
    "pacercadeSpotifyLogin",
    "width=480,height=720"
  );

  if (!authPopup) {
    setPlaylistStatus(
      "Please allow pop-ups to sign in with Spotify.",
      "error"
    );
    pendingBpmRequest = null;
    return;
  }

  setPlaylistStatus(
    "Sign in with Spotify in the newly opened tab…",
    "loading"
  );
}

async function createPlaylist(bpm) {
  if (!hasValidSpotifyToken()) {
    pendingBpmRequest = bpm;
    openSpotifyLoginWindow();
    return;
  }

  playlistBtn.disabled = true;
  setPlaylistStatus(`Building your ${bpm} BPM playlist…`, "loading");

  try {
    const response = await fetch(
      `${PLAYLIST_SERVICE_BASE_URL}/api/generate-playlist`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${spotifyAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bpm }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Unexpected Spotify error");
    }

    const playlistLink = result.playlistUrl
      ? `<a href="${result.playlistUrl}" target="_blank" rel="noopener noreferrer">Open playlist in Spotify</a>`
      : "Open Spotify to see your new Pacercade playlist.";

    setPlaylistStatus(
      `${result.trackCount} tracks added at ${result.targetBpm} BPM. ${playlistLink}`,
      "success"
    );
  } catch (err) {
    setPlaylistStatus(`Unable to create playlist: ${err.message}`, "error");
  } finally {
    playlistBtn.disabled = false;
  }
}

function handleSpotifyAuthMessage(event) {
  if (event.origin !== PLAYLIST_SERVICE_BASE_URL) {
    return;
  }

  const { source, payload } = event.data || {};
  if (source !== "pacercade-playlist-service") {
    return;
  }

  const tokenData = payload?.tokenData;
  if (!tokenData?.access_token) {
    setPlaylistStatus("Spotify sign-in failed. Please try again.", "error");
    pendingBpmRequest = null;
    return;
  }

  spotifyAccessToken = tokenData.access_token;
  spotifyTokenExpiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;

  if (authPopup && !authPopup.closed) {
    authPopup.close();
  }

  if (pendingBpmRequest) {
    const bpmToCreate = pendingBpmRequest;
    pendingBpmRequest = null;
    createPlaylist(bpmToCreate);
    return;
  }

  setPlaylistStatus(
    "Spotify connected. Pick a BPM and tap the playlist button again.",
    "success"
  );
}

intervalSlider.addEventListener("input", handleIntervalInput);
intervalSlider.addEventListener("change", handleIntervalInput);

[frequencySlider, durationSlider, volumeSlider].forEach((control) => {
  control.addEventListener("input", () => {
    updateToneDisplays();
  });
});

startBtn.addEventListener("click", () => scheduleBeats());
stopBtn.addEventListener("click", () => stopBeats());

wirePressVisuals(startBtn);
wirePressVisuals(stopBtn);

playlistBtn.addEventListener("click", () => {
  const bpm = getCurrentBpm();
  createPlaylist(bpm);
});

updateIntervalLabel();
updateToneDisplays();
setPlaylistStatus("Connect Spotify to build a playlist for your cadence.");
window.addEventListener("message", handleSpotifyAuthMessage);
