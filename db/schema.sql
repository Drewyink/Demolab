CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  name TEXT,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS members (
  subscriber_id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  group_id TEXT,
  plan_type TEXT
);

-- Seed some mock data if table is empty
INSERT OR IGNORE INTO members VALUES ('M1001', 'John', 'Doe', 'GRP99', 'HMO');
INSERT OR IGNORE INTO members VALUES ('M1002', 'Jane', 'Smith', 'GRP99', 'PPO');
