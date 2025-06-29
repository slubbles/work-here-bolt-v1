/*
  # Add Analytics Events Table

  1. New Tables
    - `analytics_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles, nullable)
      - `event_name` (text, not null)
      - `event_properties` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for authenticated and public users
    - Create indexes for better performance
*/

-- Add analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE SET NULL, -- Link to user_profiles, allow null for unauthenticated events
  event_name text NOT NULL,
  event_properties jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security for analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy for analytics_events: Allow authenticated users to insert their own events
CREATE POLICY "Authenticated users can insert analytics events"
  ON analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for analytics_events: Allow anonymous users to insert events (user_id will be null)
CREATE POLICY "Anonymous users can insert analytics events"
  ON analytics_events
  FOR INSERT
  TO public
  WITH CHECK (user_id IS NULL);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);