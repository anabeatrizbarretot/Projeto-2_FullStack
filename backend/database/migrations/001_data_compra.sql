
BEGIN;

ALTER TABLE lancamentos
ADD COLUMN IF NOT EXISTS data_compra DATE;

UPDATE lancamentos AS l
SET data_compra = CASE
  WHEN l.grupo_parcelamento IS NULL THEN l.data
  ELSE (
    SELECT p.data
    FROM lancamentos AS p
    WHERE p.usuario_id = l.usuario_id
      AND p.grupo_parcelamento = l.grupo_parcelamento
      AND p.parcela_atual = 1
    LIMIT 1
  )
END
WHERE l.data_compra IS NULL;

COMMIT;
