const respond = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

const accessEmail = request => {
  const emailHeader = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (emailHeader) return emailHeader.trim().toLowerCase();

  // Access always validates this token before forwarding requests on the
  // protected custom domain. Reading its email claim keeps Pages compatible
  // when the convenience email header is not forwarded to the Function.
  if (new URL(request.url).hostname !== "kriuuu.com") return "";
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion") || "";
  try {
    const encodedPayload = assertion.split(".")[1];
    if (!encodedPayload) return "";
    const normalized = encodedPayload.replaceAll("-", "+").replaceAll("_", "/");
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    return String(payload.email || "").trim().toLowerCase();
  } catch {
    return "";
  }
};

export async function onRequestGet({ request, env }) {
  const viewer = accessEmail(request);
  const allowedViewers = new Set(["mmartinez@kriuuu.com", "mmaldonado@kriuuu.com"]);
  if (!allowedViewers.has(viewer)) return respond({ error: "Unauthorized" }, 401);
  if (!env.DB) return respond({ error: "Database unavailable" }, 503);

  const url = new URL(request.url);
  const search = (url.searchParams.get("q") || "").trim().slice(0, 100);
  const like = `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const statement = search
    ? env.DB.prepare(`SELECT id, name, email, company, role, profile_json, answers_json, score, category_scores_json, consented_at, created_at
        FROM audit_submissions WHERE name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\'
        ORDER BY created_at DESC LIMIT 250`).bind(like, like, like)
    : env.DB.prepare(`SELECT id, name, email, company, role, profile_json, answers_json, score, category_scores_json, consented_at, created_at
        FROM audit_submissions ORDER BY created_at DESC LIMIT 250`);
  const { results } = await statement.all();
  return respond({ viewer, results: results.map(row => ({
    ...row,
    profile: JSON.parse(row.profile_json || "{}"),
    answers: JSON.parse(row.answers_json || "[]"),
    categoryScores: JSON.parse(row.category_scores_json || "{}"),
    profile_json: undefined, answers_json: undefined, category_scores_json: undefined
  })) });
}
