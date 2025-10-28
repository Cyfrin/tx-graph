CREATE TABLE fn_selectors (
    selector CHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    inputs JSONB,
    outputs JSONB
);
