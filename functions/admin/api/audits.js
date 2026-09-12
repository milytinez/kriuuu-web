const respond = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

export async function onRequestGet({ request, env }) {
  const viewer = (request.headers.get("Cf-Access-Authenticated-User-Email") || "").toLowerCase();
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
