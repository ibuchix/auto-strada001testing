// We're not actually modifying this file.
// This is a temporary placeholder to include the SQL changes to be run on Supabase.
// The user needs to run the following SQL in the Supabase SQL editor:
//
// -- Enable replication identity for cars table to get old records in change events
// ALTER TABLE cars REPLICA IDENTITY FULL;
// -- Make sure the cars table is in the realtime publication
// ALTER PUBLICATION supabase_realtime ADD TABLE cars;
//
// This allows Supabase to send complete old records in the real-time updates
// which we need to compare changes between states.
