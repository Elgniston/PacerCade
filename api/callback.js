import cookie from "cookie";

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} = process.env;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { code, state } = req.query;
  const cookies = cookie.parse(req.headers.cookie || "");
  const storedState = cookies.spotify_auth_state;

  if (!state || state !== storedState) {
    res.status(400).json({ error: "State mismatch" });
    return;
  }

  res.setHeader(
    "Set-Cookie",
    "spotify_auth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure"
  );

  if (!code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  try {
    const basicAuth = Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      res.status(500).json({ error: "Failed to fetch token", details: errorBody });
      return;
    }

    const tokenData = await tokenResponse.json();
    const payload = {
      tokenData,
      redirectUsed: SPOTIFY_REDIRECT_URI,
    };
    const safePayload = JSON.stringify(payload).replace(/</g, "\\u003c");

    const htmlResponse = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Pacercade Spotify Login</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        padding: 32px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #050505;
        color: #f7f7f7;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        text-align: center;
      }
      .card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 32px;
        max-width: 420px;
        width: 100%;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45);
      }
      h1 {
        margin-top: 0;
        font-size: 1.5rem;
      }
      p {
        margin-bottom: 0;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Spotify sign-in complete</h1>
      <p>You can close this tab and return to Pacercade.</p>
    </div>
    <script>
      (function notifyOpener() {
        var payload = ${safePayload};
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              { source: "pacercade-playlist-service", payload: payload },
              "*"
            );
          }
        } catch (err) {
          console.error("Unable to notify opener", err);
        }
        setTimeout(function () {
          window.close();
        }, 2000);
      })();
    </script>
  </body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(htmlResponse);
  } catch (err) {
    res.status(500).json({ error: "Token exchange failed", details: err.message });
  }
}
