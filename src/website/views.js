// HTML pages and the branding banner for the registration gateway

// Escape user/config text before putting it into HTML
function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Shared page styling (dark AF-REVIVAL theme)
function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background: radial-gradient(circle at top, #1b2440, #0b0e18 70%);
    color: #e8ecf5; padding: 24px;
  }
  .card {
    width: 100%; max-width: 520px; background: #141a2b; border: 1px solid #263050;
    border-radius: 16px; padding: 32px; box-shadow: 0 18px 50px rgba(0,0,0,.5); text-align: center;
  }
  h1 { margin: 0 0 8px; font-size: 26px; letter-spacing: .5px; }
  .tag { color: #8ea2c9; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
  p { color: #c2ccdf; line-height: 1.6; }
  .btn {
    display: inline-block; margin-top: 20px; padding: 12px 22px; border-radius: 10px;
    background: #5865f2; color: #fff; text-decoration: none; font-weight: 600;
  }
  .btn:hover { background: #4752c4; }
  .muted { color: #7d8aa6; font-size: 13px; margin-top: 20px; }
  .image { max-width: 100%; border-radius: 12px; margin: 16px 0; }
</style>
</head>
<body>
  <div class="card">${body}</div>
</body>
</html>`;
}

// Landing page shown to visitors who are not logged in
function landingPage() {
  return layout(
    "AF-REVIVAL Registration",
    `<div class="tag">AF-REVIVAL</div>
     <h1>Registration Access</h1>
     <p>Registration is limited to members of the official AF-REVIVAL Discord server who have completed the whitelist process.</p>
     <p>Log in with Discord to verify your access.</p>
     <a class="btn" href="/auth/discord">Login with Discord</a>
     <div class="muted">Access is verified on our server. Sharing this link does not grant access.</div>`,
  );
}

// Access denied page for users who fail verification
function accessDeniedPage(reason) {
  const invite = process.env.DISCORD_INVITE_URL;
  const inviteLine = invite
    ? `<p><a class="btn" href="${escapeHtml(invite)}">Join the Discord server</a></p>`
    : "";

  const imageUrl =
    process.env.REG_DENIED_IMAGE_URL || process.env.REG_PAGE_IMAGE_URL;
  return layout(
    "Access Denied - AF-REVIVAL",
    `<div class="tag">AF-EVOLUTION</div>
     <h1>Access Denied</h1>
     <p>${escapeHtml(reason || "You are not authorized to access the registration page.")}</p>
     ${imageUrl ? `<img class="image" src="${escapeHtml(imageUrl)}" alt="AF-REVIVAL">` : ""}
     <p>SULOD SAG DISCORD BOSS PAPUSIL MAN KAHA KA ANI</p>
     <p>To register, you must:</p>
     <p>1. Join the official AF-EVOLUTION Discord server.<br>
        2. Complete the whitelist process in the server.<br>
        3. Open the registration gateway and log in with Discord.</p>
     ${inviteLine}
     <div class="muted"><a href="/logout" style="color:#8ea2c9">Log out</a></div>`,
  );
}

// Friendly page shown when the game backend cannot be reached
function backendErrorPage() {
  return layout(
    "Registration Unavailable - AF-REVIVAL",
    `<div class="tag">AF-REVIVAL</div>
     <h1>Registration Unavailable</h1>
     <p>The registration service is temporarily unavailable. Please try again later.</p>`,
  );
}

// Banner injected above the real registration form
function registrationBanner() {
  const title = process.env.REG_PAGE_TITLE || "AF-REVIVAL Registration";
  const image = process.env.REG_PAGE_IMAGE_URL;
  const instructions = process.env.REG_PAGE_INSTRUCTIONS;
  const extra = process.env.REG_PAGE_EXTRA_TEXT;

  return `<div class="af-banner" style="margin:0 0 20px;padding:20px;border-radius:12px;background:#141a2b;border:1px solid #263050;font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#e8ecf5;text-align:center;">
  <h1 style="margin:0 0 8px;font-size:24px;">${escapeHtml(title)}</h1>
  ${image ? `<img src="${escapeHtml(image)}" alt="AF-REVIVAL" style="max-width:100%;border-radius:12px;margin:12px 0;">` : ""}
  ${instructions ? `<p style="color:#c2ccdf;line-height:1.6;">${escapeHtml(instructions)}</p>` : ""}
  ${extra ? `<p style="color:#c2ccdf;line-height:1.6;">${escapeHtml(extra)}</p>` : ""}
</div>`;
}

// Insert the banner just after the opening <body> tag of the backend page
function injectBanner(html) {
  const banner = registrationBanner();
  const match = html.search(/<body[^>]*>/i);
  if (match === -1) return banner + html;
  const end = html.indexOf(">", match) + 1;
  return html.slice(0, end) + banner + html.slice(end);
}

module.exports = {
  landingPage,
  accessDeniedPage,
  backendErrorPage,
  registrationBanner,
  injectBanner,
};
