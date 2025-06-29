import { supabase, isSupabaseAvailable } from './supabase-client';
import { getCurrentUser } from './supabase-client';

/**
 * Tracks a user event in Supabase analytics_events table
 */
export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>,
  userId?: string
) {
  if (!isSupabaseAvailable()) {
    return { success: false, message: 'Supabase not configured' };
  }
  
  try {
    // Get current user if not provided
    let userIdToUse = userId;
    
    if (!userIdToUse) {
      const { user } = await getCurrentUser();
      userIdToUse = user?.id;
    }
    
    // Insert event into analytics_events table
    const { data, error } = await supabase
      .from('analytics_events')
      .insert([{
        user_id: userIdToUse, // Can be null for anonymous events
        event_name: eventName,
        event_properties: properties || {},
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    return { success: true };
    
  } catch (error) {
    console.error('Error tracking event:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error tracking event'
    };
  }
}

/**
 * Track token creation events
 */
export function trackTokenCreation(
  properties: {
    tokenName: string;
    tokenSymbol: string;
    network: string;
    successful: boolean;
    error?: string;
  },
  userId?: string
) {
  return trackEvent(
    'token_creation',
    properties,
    userId
  );
}

/**
 * Track wallet connection events
 */
export function trackWalletConnection(
  properties: {
    walletType: string;
    network: string;
    successful: boolean;
    error?: string;
  },
  userId?: string
) {
  return trackEvent(
    'wallet_connection',
    properties,
    userId
  );
}

/**
 * Track page views
 */
export function trackPageView(
  pageName: string,
  properties?: Record<string, any>,
  userId?: string
) {
  return trackEvent(
    'page_view',
    { page: pageName, ...properties },
    userId
  );
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(
  featureName: string,
  properties?: Record<string, any>,
  userId?: string
) {
  return trackEvent(
    'feature_usage',
    { feature: featureName, ...properties },
    userId
  );
}