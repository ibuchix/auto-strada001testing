
-- Adds unique constraint to sellers.user_id, enabling FK references
-- 2025-06-15: Allow seller_bid_decisions to reference sellers(user_id)

ALTER TABLE public.sellers
  ADD CONSTRAINT sellers_user_id_unique UNIQUE (user_id);

