CREATE TABLE strategy_scorecard (
  ticker CHAR(6) NOT NULL,
  as_of DATE NOT NULL,
  valuation_currency TEXT NOT NULL CHECK (valuation_currency = 'KRW'),
  strategy TEXT NOT NULL CHECK (strategy IN ('momentum', 'oversold')),
  strategy_version TEXT NOT NULL,
  universe_filter_version TEXT NOT NULL,
  score NUMERIC NOT NULL,
  percentile NUMERIC NOT NULL CHECK (percentile >= 0 AND percentile <= 100),
  top_five_percent BOOLEAN NOT NULL,
  components JSONB NOT NULL,
  PRIMARY KEY (ticker, as_of, strategy, strategy_version)
);

CREATE TABLE candidate_gate_result (
  ticker CHAR(6) NOT NULL,
  as_of DATE NOT NULL,
  strategy TEXT NOT NULL CHECK (strategy IN ('momentum', 'oversold')),
  strategy_version TEXT NOT NULL,
  gate TEXT NOT NULL CHECK (gate IN ('G0', 'G1', 'G2', 'G3', 'G4')),
  passed BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  PRIMARY KEY (ticker, as_of, strategy, strategy_version, gate)
);
