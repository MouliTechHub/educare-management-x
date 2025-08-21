-- Create unified payment history view that combines payments and discounts
CREATE OR REPLACE VIEW public.v_payment_history AS
SELECT
  p.id                           AS payment_id,
  p.student_id,
  p.fee_record_id,
  COALESCE(fr.fee_type, 'Unknown') AS fee_type,
  p.amount_paid                  AS amount,
  p.payment_date,
  p.payment_method               AS method,
  p.receipt_number               AS reference_no,
  p.notes,
  'PAYMENT'::text                AS entry_type,
  p.created_at,
  p.created_by                   AS processed_by
FROM public.fee_payment_records p
LEFT JOIN public.student_fee_records fr ON fr.id = p.fee_record_id

UNION ALL

SELECT
  d.id                           AS discount_id,
  d.student_id,
  d.source_fee_id                AS fee_record_id,
  COALESCE(fr.fee_type, 'Unknown') AS fee_type,
  d.discount_amount              AS amount,
  d.applied_at::date             AS payment_date,
  'DISCOUNT'::text               AS method,
  NULL::text                     AS reference_no,
  d.reason                       AS notes,
  'DISCOUNT'::text               AS entry_type,
  d.created_at,
  d.applied_by                   AS processed_by
FROM public.discount_history d
LEFT JOIN public.student_fee_records fr ON fr.id = d.source_fee_id
WHERE d.source_fee_id IS NOT NULL;