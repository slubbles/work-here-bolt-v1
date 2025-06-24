# Supabase Storage Setup Instructions

## Issue
The current Supabase project has Row Level Security (RLS) enabled which prevents anonymous users from creating storage buckets or uploading files.

## Quick Fix Options

### Option 1: Create Storage Policies (Recommended)
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run these SQL commands:

```sql
-- Allow anonymous users to create buckets
CREATE POLICY "Allow anonymous bucket creation" ON storage.buckets
FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous users to upload files
CREATE POLICY "Allow anonymous file uploads" ON storage.objects
FOR INSERT TO anon WITH CHECK (true);

-- Allow public read access to files
CREATE POLICY "Allow public file access" ON storage.objects
FOR SELECT TO anon USING (true);

-- Allow public bucket listing
CREATE POLICY "Allow public bucket listing" ON storage.buckets
FOR SELECT TO anon USING (true);
```

### Option 2: Create Pre-configured Buckets
1. Go to **Storage** in your Supabase dashboard
2. Manually create these buckets:
   - `token-metadata` (public)
   - `token-assets` (public)
3. Set them to **Public** access

### Option 3: Disable RLS for Storage (Quick Fix)
1. Go to **SQL Editor** in your Supabase dashboard
2. Run this command:

```sql
-- Temporarily disable RLS for storage buckets and objects
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning**: This removes security restrictions. Only use for testing.

## Current Workaround
The app now has multiple fallback options that ensure metadata upload never fails:

### Fallback System
1. **Primary**: Supabase Storage (when properly configured)
2. **Fallback 1**: JSONBin.io (anonymous JSON hosting)
3. **Fallback 2**: GitHub Gist (reliable, permanent hosting)  
4. **Fallback 3**: Pastebin (simple text hosting)
5. **Fallback 4**: Data URL (always works, never fails)
6. **Emergency**: Minimal metadata fallback (last resort)

### Expected Console Output for Successful Fallback:
```
🚀 Creating Algorand token on algorand-mainnet
📤 Uploading metadata to storage...
Creating storage bucket: token-metadata
Could not create bucket token-metadata: new row violates row-level security policy
Error uploading metadata to Supabase: [error]
Attempting fallback metadata upload to JSONBin.io...
JSONBin.io failed with status: 401
Attempting fallback metadata upload to GitHub Gist...
✅ GitHub Gist fallback successful: https://gist.githubusercontent.com/...
✅ Token created successfully on algorand-mainnet!
```

## Recommended Solution
For production use, implement **Option 1** (Create Storage Policies) as it maintains security while allowing necessary operations.

## Testing
After implementing any option above:
1. Try creating an Algorand MainNet token
2. Check console logs to see which upload method succeeded
3. Verify the token appears on AlgoExplorer with proper metadata

## Troubleshooting

### If Supabase storage still fails:
- Check that your `.env.local` has the correct Supabase credentials
- Verify the storage policies were created successfully
- Ensure buckets are set to public access

### If all upload methods fail:
- The emergency data URL fallback will always work
- Tokens will still be created successfully
- Metadata will be embedded directly in the transaction

## Security Notes
- The fallback URLs (GitHub Gist, Pastebin) are public by nature
- Consider implementing authentication for production use
- Monitor usage to prevent abuse of fallback services