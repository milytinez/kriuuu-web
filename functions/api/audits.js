const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Database unavailable" }, 503);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 30000) return json({ error: "Payload too large" }, 413);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const clean = value => typeof value === "string" ? value.trim() : "";
  const name = clean(body.name).slice(0, 100);
  const email = clean(body.email).toLowerCase().slice(0, 160);
  const company = clean(body.company).slice(0, 120);
  const role = clean(body.role).slice(0, 100);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || body.consent !== true) return json({ error: "Missing required fields" }, 400);
  if (!Array.isArray(body.answers) || body.answers.length !== 14 || body.answers.some(a => !["0", "1", "2", "na"].includes(a?.value))) return json({ error: "Invalid answers" }, 400);
  const score = Number(body.score);
  if (!Number.isInteger(score) || score < 0 || score > 100) return json({ error: "Invalid score" }, 400);

  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO audit_submissions
    (id, name, email, company, role, profile_json, answers_json, score, category_scores_json, consented_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
    .bind(id, name, email, company, role, JSON.stringify(body.profile || {}), JSON.stringify(body.answers), score, JSON.stringify(body.categoryScores || {})).run();
  return json({ ok: true, id }, 201);
}

export function onRequestGet() {
  return json({ error: "Not found" }, 404);
}
