CREATE TABLE IF NOT EXISTS mlb_notes (
  id bigint generated always as identity primary key,
  mlb text not null,
  sku text,
  nota text not null,
  tipo_acao text default 'OBSERVACAO',
  lembrete_data timestamptz,
  criado_em timestamptz default now(),
  responsavel text default 'COMANDANTE'
);

CREATE INDEX IF NOT EXISTS idx_mlb_notes_mlb ON mlb_notes(mlb);
CREATE INDEX IF NOT EXISTS idx_mlb_notes_created ON mlb_notes(criado_em desc);
