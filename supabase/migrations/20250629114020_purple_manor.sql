/*
  # Add Wallet Fields to User Profiles

  1. Table Changes
    - `user_profiles`
      - Add `solana_wallet` (text, nullable)
      - Add `algorand_wallet` (text, nullable)
      - Add `last_login` (timestamp)
      - Add `updated_at` (timestamp)

  2. Indexes
    - Create indexes for wallet addresses for faster lookups
*/

-- Add wallet fields to user_profiles table
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS solana_wallet text,
  ADD COLUMN IF NOT EXISTS algorand_wallet text,
  ADD COLUMN IF NOT EXISTS last_login timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create indexes for wallet addresses
CREATE INDEX IF NOT EXISTS idx_user_profiles_solana_wallet ON user_profiles(solana_wallet);
CREATE INDEX IF NOT EXISTS idx_user_profiles_algorand_wallet ON user_profiles(algorand_wallet);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at automatically
DROP TRIGGER IF EXISTS set_updated_at ON public.user_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add function to update last_login when user signs in
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles
  SET last_login = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update last_login on auth.users update
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_login();