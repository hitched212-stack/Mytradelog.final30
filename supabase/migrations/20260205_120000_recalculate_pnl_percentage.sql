-- Recalculate pnl_percentage for all trades using the formula: (pnl_amount / (entry_price * lot_size)) * 100
UPDATE trades
SET pnl_percentage = CASE 
  WHEN entry_price > 0 AND lot_size > 0 THEN (pnl_amount / (entry_price * lot_size)) * 100
  ELSE 0
END
WHERE entry_price > 0 AND lot_size > 0;
