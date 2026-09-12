CREATE TABLE IF NOT EXISTS audit_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  profile_json TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  category_scores_json TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_submissions_created_at ON audit_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_submissions_email ON audit_submissions(email);
