# Supabase Setup Guide for Snarbles Token Platform

## 🚀 Quick Setup Steps

### 1. Environment Variables Setup

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
   ```

### 2. Database Schema Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire content from `supabase/migrations/001_initial_schema.sql`
4. Click **Run** to create all tables and policies

### 3. Verify Setup

After running the migration, you should see these tables in your Supabase dashboard:

- `user_profiles` - Stores user account information and credits
- `token_creation_history` - Tracks all tokens created by users  
- `credit_transactions` - Records all credit top-ups and usage

## 📋 Database Schema Overview

### User Profiles Table
```sql
user_profiles (
  user_id: uuid (primary key)
  email: text
  created_at: timestamp
  credits_balance: numeric (default: 10)
  subscription_tier: text (default: 'free')
)
```

### Token Creation History Table
```sql
token_creation_history (
  id: uuid (primary key)
  user_id: uuid (foreign key)
  token_name: text
  token_symbol: text
  network: text
  contract_address: text
  created_at: timestamp
  ... (additional metadata fields)
)
```

### Credit Transactions Table
```sql
credit_transactions (
  id: uuid (primary key)
  user_id: uuid (foreign key)
  type: text ('top_up' | 'usage' | 'refund' | 'bonus')
  amount: numeric
  timestamp: timestamp
  description: text
)
```

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Automatic user profile creation on signup
- Secure authentication with Supabase Auth

## 📦 Usage in Your Application

### Authentication Hook
```typescript
import { useSupabaseAuth } from '@/hooks/useSupabase';

const { user, userProfile, signIn, signUp, signOut, isAuthenticated } = useSupabaseAuth();
```

### Token History Hook
```typescript
import { useTokenHistory } from '@/hooks/useSupabase';

const { tokens, saveToken, fetchTokenHistory } = useTokenHistory();
```

### Credits Management Hook
```typescript
import { useCredits } from '@/hooks/useSupabase';

const { creditBalance, useCredits, addCredits, hasCredits } = useCredits();
```

## 🎯 Integration Points

### Token Creation
When a user creates a token, automatically save it to their history:

```typescript
const result = await saveToken({
  token_name: 'My Token',
  token_symbol: 'MTK',
  network: 'solana-devnet',
  contract_address: '7xKXtg...',
  // ... other token details
});
```

### Credit System
Deduct credits for advanced features:

```typescript
const result = await useCredits(5, 'Advanced token analytics');
if (result.success) {
  // Proceed with premium feature
} else {
  // Show upgrade prompt
}
```

## 🚀 Next Steps

1. **Authentication UI**: Add sign-in/sign-up components to your app
2. **Credit System**: Integrate credit checks before advanced features
3. **Token Tracking**: Save token creation data automatically
4. **Analytics Dashboard**: Use token history data for user analytics
5. **RevenueCat Integration**: Connect for subscription management

## 🛠️ Troubleshooting

### Common Issues

1. **Environment Variables**: Make sure `.env.local` is not in `.gitignore`
2. **RLS Policies**: If you get permission errors, check that RLS policies are correctly set
3. **Migration Errors**: Run migrations one section at a time if you encounter issues

### Testing the Setup

Use the Supabase dashboard to:
1. Check if tables were created correctly
2. Verify RLS policies are active
3. Test authentication flow
4. Insert test data to verify permissions

---

Your Supabase integration is now ready! The platform can now track user tokens, manage credits, and provide advanced features based on subscription tiers.