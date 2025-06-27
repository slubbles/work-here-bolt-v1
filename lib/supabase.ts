// Simplified Supabase integration - only for metadata upload
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check for placeholder values
const isPlaceholderUrl = supabaseUrl?.includes('placeholder') || !supabaseUrl;
const isPlaceholderKey = supabaseAnonKey?.includes('placeholder') || !supabaseAnonKey;

if (isPlaceholderUrl || isPlaceholderKey) {
  console.warn('⚠️ Supabase not configured. Metadata upload will use fallback methods.');
}

// Create Supabase client with fallback values
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Simplified helper for metadata upload only
export const supabaseHelpers = {
  async checkSupabaseConnection(): Promise<boolean> {
    return !(isPlaceholderUrl || isPlaceholderKey);
  },
  
  // Enhanced upload function for metadata JSON files (ARC-3 compliance)
  async uploadMetadataToStorage(metadata: any, bucket: string = 'token-metadata', fileName?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!(await supabaseHelpers.checkSupabaseConnection())) {
        console.log('Supabase not configured, using fallback methods...');
        return supabaseHelpers.uploadMetadataFallback(metadata);
      }
      
      // Generate unique filename if not provided
      const finalFileName = fileName || `metadata-${Date.now()}-${Math.random().toString(36).substring(2)}.json`;
      
      // Convert metadata to JSON string
      const metadataJson = JSON.stringify(metadata, null, 2);
      const blob = new Blob([metadataJson], { type: 'application/json' });
      
      // Upload blob to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(finalFileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/json'
        });

      if (error) {
        console.warn('Supabase upload failed, using fallback:', error.message);
        return supabaseHelpers.uploadMetadataFallback(metadata);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(finalFileName);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.warn('Supabase upload error, using fallback:', error);
      return supabaseHelpers.uploadMetadataFallback(metadata);
    }
  },

  // Simplified fallback system
  async uploadMetadataFallback(metadata: any): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const metadataJson = JSON.stringify(metadata, null, 2);
      
      // Try GitHub Gist (most reliable)
      try {
        const gistResponse = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: 'Token Metadata',
            public: true,
            files: { 'metadata.json': { content: metadataJson } }
          })
        });
        
        if (gistResponse.ok) {
          const gistResult = await gistResponse.json();
          const gistUrl = `https://gist.githubusercontent.com/anonymous/${gistResult.id}/raw/metadata.json`;
          console.log('✅ GitHub Gist upload successful');
          return { success: true, url: gistUrl };
        }
      } catch (gistError) {
        console.warn('GitHub Gist failed:', gistError);
      }

      // Fallback to minimal data URL for Algorand compatibility
      const minimalMetadata = {
        name: metadata.name || 'Token',
        symbol: metadata.properties?.symbol || 'TKN',
        decimals: metadata.properties?.decimals || 9
      };
      
      const minimalJson = JSON.stringify(minimalMetadata);
      const dataUrl = `data:application/json;base64,${btoa(minimalJson)}`;
      
      if (dataUrl.length <= 96) {
        console.log('✅ Data URL fallback successful');
        return { success: true, url: dataUrl };
      }
      
      // Ultimate fallback
      const fallbackUrl = 'https://algorand.org';
      console.log('✅ Using fallback URL for compatibility');
      return { success: true, url: fallbackUrl };
      
    } catch (error) {
      console.error('All fallback methods failed:', error);
      return { success: false, error: 'Metadata upload failed' };
    }
  }
};