
-- Set REPLICA IDENTITY to FULL for all tables used in realtime subscriptions
-- This ensures that old record data is available for UPDATE events

ALTER TABLE cars REPLICA IDENTITY FULL;
ALTER TABLE bids REPLICA IDENTITY FULL;
ALTER TABLE auction_schedules REPLICA IDENTITY FULL;
ALTER TABLE auction_results REPLICA IDENTITY FULL;
ALTER TABLE seller_performance_metrics REPLICA IDENTITY FULL;
ALTER TABLE listing_verifications REPLICA IDENTITY FULL;
ALTER TABLE sellers REPLICA IDENTITY FULL;
ALTER TABLE proxy_bids REPLICA IDENTITY FULL;

-- Add all tables to the supabase_realtime publication
-- This makes them available for realtime subscriptions

ALTER PUBLICATION supabase_realtime ADD TABLE cars;
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
ALTER PUBLICATION supabase_realtime ADD TABLE auction_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE auction_results;
ALTER PUBLICATION supabase_realtime ADD TABLE seller_performance_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE listing_verifications;
ALTER PUBLICATION supabase_realtime ADD TABLE sellers;
ALTER PUBLICATION supabase_realtime ADD TABLE proxy_bids;
