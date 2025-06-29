# Deployment Checklist for Snarbles Token Platform

## Environment Variables

Make sure to set these variables in Netlify's deployment settings:

### Required:
- `NEXT_PUBLIC_SOLANA_NETWORK` - Set to "devnet" for testing, "mainnet-beta" for production
- `NEXT_PUBLIC_RPC_ENDPOINT` - Solana RPC endpoint

### Optional (for advanced features):
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase public anon key

## Deployment Steps

1. **Connect to Netlify**
   - Sign in to Netlify
   - Click "New site from Git"
   - Connect to your GitHub repository
   - Select the repository with your Snarbles Token Platform code

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Make sure Node.js version is set to 18 or higher

3. **Environment Variables**
   - Add all the environment variables listed above
   - They can be added in Site settings > Build & deploy > Environment

4. **Deploy**
   - Click "Deploy site"
   - Wait for the build to complete

5. **Verify Deployment**
   - Test your deployed site
   - Verify wallet connections work
   - Test token creation
   - Check dashboard functionality

## Troubleshooting

If you encounter issues:

1. **Check Netlify Build Logs**
   - Examine build logs for any errors

2. **Verify Environment Variables**
   - Make sure all required variables are set

3. **Check for CORS issues**
   - If API calls fail, you might need to update CORS settings on your backend

4. **Next.js Specific Issues**
   - If you encounter routing issues, make sure the redirects in netlify.toml are correct

## Post-Deployment

1. **Set up Custom Domain**
   - Go to Site settings > Domain management
   - Add your custom domain and set up SSL

2. **Enable Branch Deploys**
   - For development workflow, consider enabling branch deploys