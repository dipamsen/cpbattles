-- Initialisation of DB

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    sub VARCHAR(255) UNIQUE NOT NULL,
    handle VARCHAR(50) UNIQUE NOT NULL,
    avatar TEXT DEFAULT NULL,
    rating INTEGER DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS battles (
    id SERIAL PRIMARY KEY,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    title TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    duration_min INTEGER NOT NULL,
    min_rating INTEGER NOT NULL,
    max_rating INTEGER NOT NULL,
    num_problems INTEGER NOT NULL,
    join_token TEXT UNIQUE NOT NULL -- Token for joining the battle
);

CREATE TABLE IF NOT EXISTS battle_participants (
    id SERIAL PRIMARY KEY,
    battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS battle_problems (
    id SERIAL PRIMARY KEY,
    battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    contest_id INTEGER NOT NULL,
    index TEXT NOT NULL,
    rating INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    cf_id TEXT NOT NULL, -- Codeforces submission ID
    battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contest_id INTEGER NOT NULL,
    index TEXT NOT NULL,
    verdict TEXT NOT NULL, -- 'OK', 'WA', 'TLE', 'RE', etc.
    passed_tests INTEGER NOT NULL,
    
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



