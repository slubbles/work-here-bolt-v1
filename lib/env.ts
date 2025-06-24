// Environment validation and type-safe access
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  NEXT_PUBLIC_RPC_ENDPOINT: process.env.NEXT_PUBLIC_RPC_ENDPOINT,
} as const;

const optionalEnvVars = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_MIXPANEL_TOKEN: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
} as const;

// Validate required environment variables
function validateEnv() {
  const missing: string[] = [];
  const invalid: string[] = [];
  
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    } else if (value.includes('placeholder') || value.includes('your-')) {
      invalid.push(key);
    }
  });
  
  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (invalid.length > 0) {
    console.warn(`Invalid environment variables (using placeholder values): ${invalid.join(', ')}`);
  }
  
  return {
    isValid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}

// Get environment configuration
export function getEnvConfig() {
  const validation = validateEnv();
  
  return {
    // Required variables
    supabase: {
      url: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      isConfigured: Boolean(
        requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL && 
        requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
        !requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
      ),
    },
    solana: {
      network: requiredEnvVars.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
      rpcEndpoint: requiredEnvVars.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com',
    },
    // Optional variables
    app: {
      url: optionalEnvVars.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
      apiUrl: optionalEnvVars.NEXT_PUBLIC_API_URL,
    },
    analytics: {
      googleAnalyticsId: optionalEnvVars.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
      mixpanelToken: optionalEnvVars.NEXT_PUBLIC_MIXPANEL_TOKEN,
    },
    monitoring: {
      sentryDsn: optionalEnvVars.NEXT_PUBLIC_SENTRY_DSN,
    },
    // Development flags
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    // Validation results
    validation,
  };
}

// Export individual configs for convenience
export const env = getEnvConfig();