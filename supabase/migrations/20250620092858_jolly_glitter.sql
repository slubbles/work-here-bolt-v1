/*
  # Initial Schema for Snarbles Token Platform

  1. New Tables
    - `user_profiles`
      - `user_id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `created_at` (timestamp)
      - `credits_balance` (numeric, default 10)
      - `subscription_tier` (text, default 'free')
    
    - `token_creation_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `token_name` (text)
      - `token_symbol` (text)
      - `network` (text)
      - `contract_address` (text)
      - `created_at` (timestamp)
      - Various token metadata fields
    
    - `credit_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `type` (text)
      - `amount` (numeric)
      - `timestamp` (timestamp)
      - `description` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  created_at timestamptz DEFAULT now() NOT NULL,
  credits_balance numeric DEFAULT 10 NOT NULL,
  subscription_tier text DEFAULT 'free' NOT NULL CHECK (subscription_tier IN ('free', 'pro', 'premium'))
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create token_creation_history table
CREATE TABLE IF NOT EXISTS token_creation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  token_name text NOT NULL,
  token_symbol text NOT NULL,
  network text NOT NULL,
  contract_address text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  description text,
  total_supply numeric,
  decimals integer,
  logo_url text,
  website text,
  github text,
  twitter text,
  mintable boolean DEFAULT false,
  burnable boolean DEFAULT false,
  pausable boolean DEFAULT false,
  transaction_hash text
);

-- Enable Row Level Security
ALTER TABLE token_creation_history ENABLE ROW LEVEL SECURITY;

-- Policies for token_creation_history
CREATE POLICY "Users can view their own token history"
  ON token_creation_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own token history"
  ON token_creation_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('top_up', 'usage', 'refund', 'bonus')),
  amount numeric NOT NULL,
  timestamp timestamptz DEFAULT now() NOT NULL,
  description text,
  transaction_reference text
);

-- Enable Row Level Security
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for credit_transactions
CREATE POLICY "Users can view their own credit transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit transactions"
  ON credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_token_history_user_id ON token_creation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_token_history_created_at ON token_creation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_timestamp ON credit_transactions(timestamp DESC);

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, created_at, credits_balance, subscription_tier)
  VALUES (new.id, new.email, now(), 10, 'free');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();