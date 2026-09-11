CREATE TABLE ingestion_run (
  id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('kiwoom', 'krx', 'csv')),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  attempt INTEGER NOT NULL CHECK (attempt > 0),
  failure_reason TEXT
);

CREATE INDEX ingestion_run_request_key_idx ON ingestion_run (request_key);

CREATE TABLE raw_snapshot (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT NOT NULL REFERENCES ingestion_run (id),
  source TEXT NOT NULL CHECK (source IN ('kiwoom', 'krx', 'csv')),
  endpoint TEXT NOT NULL,
  as_of DATE NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  payload_hash TEXT NOT NULL,
  payload JSONB NOT NULL,
  UNIQUE (source, endpoint, as_of, payload_hash)
);

CREATE TABLE etf_master (
  instrument_id TEXT NOT NULL,
  ticker CHAR(6) NOT NULL,
  name TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market = 'KR'),
  source TEXT NOT NULL CHECK (source IN ('kiwoom', 'krx', 'csv')),
  as_of DATE NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL,
  snapshot_id TEXT NOT NULL REFERENCES raw_snapshot (id),
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (instrument_id, as_of)
);

CREATE TABLE daily_quote (
  id TEXT PRIMARY KEY,
  instrument_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('kiwoom', 'krx', 'csv')),
  as_of DATE NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL,
  close NUMERIC,
  volume NUMERIC,
  nav NUMERIC,
  snapshot_id TEXT NOT NULL REFERENCES raw_snapshot (id),
  quality_status TEXT NOT NULL CHECK (quality_status IN ('passed', 'warning', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (instrument_id, source, as_of),
  CHECK (close IS NULL OR close >= 0),
  CHECK (volume IS NULL OR volume >= 0),
  CHECK (nav IS NULL OR nav >= 0)
);

CREATE TABLE quality_event (
  id TEXT PRIMARY KEY,
  daily_quote_id TEXT NOT NULL REFERENCES daily_quote (id),
  rule_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'error')),
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL
);

CREATE TABLE universe_filter_decision (
  instrument_id TEXT NOT NULL,
  ticker CHAR(6) NOT NULL,
  as_of DATE NOT NULL,
  filter_version TEXT NOT NULL,
  accepted BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  PRIMARY KEY (instrument_id, as_of, filter_version)
);

CREATE TABLE daily_collection_run (
  id TEXT PRIMARY KEY,
  as_of DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'partial', 'failed'))
);

CREATE TABLE daily_quality_flag (
  id TEXT PRIMARY KEY,
  ticker CHAR(6) NOT NULL,
  as_of DATE NOT NULL,
  rule_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'error')),
  reason TEXT NOT NULL,
  UNIQUE (ticker, as_of, rule_id)
);
