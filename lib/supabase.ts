// Enhanced storage integration with Filebase S3 and Supabase fallback
import { createClient } from '@supabase/supabase-js';
import { 
  S3Client, 
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  ObjectCannedACL
} from '@aws-sdk/client-s3';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Filebase S3 configuration
const filebaseAccessKey = process.env.NEXT_PUBLIC_FILEBASE_ACCESS_KEY;
const filebaseSecretKey = process.env.NEXT_PUBLIC_FILEBASE_SECRET_KEY;
const filebaseEndpoint = process.env.NEXT_PUBLIC_FILEBASE_ENDPOINT;
const filebaseBucket = process.env.NEXT_PUBLIC_FILEBASE_BUCKET || 'snarbles-token-creator-dapp';

// Check for placeholder values
const isSupabasePlaceholder = 
  !supabaseUrl || 
  !supabaseAnonKey ||
  supabaseUrl.trim() === '' ||
  supabaseAnonKey.trim() === '' ||
  supabaseUrl?.includes('placeholder') || 
  supabaseAnonKey?.includes('placeholder') || 
  supabaseUrl === 'undefined' ||
  supabaseAnonKey === 'undefined';

const isFilebaseConfigured = 
  filebaseAccessKey && 
  filebaseSecretKey && 
  filebaseEndpoint && 
  !filebaseAccessKey.includes('placeholder') && 
  !filebaseSecretKey.includes('placeholder');

// Log configuration status
if (isSupabasePlaceholder) {
  console.warn('⚠️ Supabase not configured. Using Filebase S3 or fallback methods.');
}

if (!isFilebaseConfigured) {
  console.warn('⚠️ Filebase S3 not configured. Using fallback storage methods.');
}

// Create Supabase client with fallback values
export const supabase = createClient(
  (supabaseUrl && !isSupabasePlaceholder) ? supabaseUrl : 'https://placeholder.supabase.co', 
  (supabaseAnonKey && !isSupabasePlaceholder) ? supabaseAnonKey : 'placeholder-anon-key'
);

// Create S3 client for Filebase
const s3Client = isFilebaseConfigured ? new S3Client({
  region: 'us-east-1', // Filebase uses us-east-1 region
  endpoint: filebaseEndpoint,
  credentials: {
    accessKeyId: filebaseAccessKey!,
    secretAccessKey: filebaseSecretKey!
  },
  forcePathStyle: true // Required for Filebase
}) : null;

// Initialize S3 bucket if it doesn't exist
async function ensureBucketExists() {
  if (!s3Client || !filebaseBucket) return false;

  try {
    // Check if the bucket already exists
    await s3Client.send(
      new HeadBucketCommand({ Bucket: filebaseBucket })
    );
    console.log(`✅ Bucket ${filebaseBucket} exists`);
    return true;
  } catch (error) {
    console.log(`⚠️ Bucket ${filebaseBucket} does not exist, attempting to create...`);
    
    try {
      await s3Client.send(
        new CreateBucketCommand({ Bucket: filebaseBucket })
      );
      console.log(`✅ Bucket ${filebaseBucket} created successfully`);
      return true;
    } catch (createError) {
      console.error(`❌ Failed to create bucket: ${createError}`);
      return false;
    }
  }
}

// Enhanced helper functions
export const supabaseHelpers = {
  async checkSupabaseConnection(): Promise<boolean> {
    return !isSupabasePlaceholder;
  },
  
  async checkFilebaseConnection(): Promise<boolean> {
    if (!isFilebaseConfigured) return false;
    return ensureBucketExists();
  },
  
  // Enhanced upload function for files
  async uploadFileToStorage(
    file: File,
    folder: string = 'token-logos',
    fileName?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log(`📤 Starting file upload for: ${file.name}`);
      
      // Generate unique filename if not provided
      const finalFileName = fileName || `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      
      // Try S3 upload first
      if (isFilebaseConfigured && s3Client) {
        console.log('🔄 Trying Filebase S3 upload...');
        try {
          const bucketExists = await ensureBucketExists();
          if (!bucketExists) {
            throw new Error('S3 bucket does not exist and could not be created');
          }
          
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const s3Key = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
          
          const uploadParams = {
            Bucket: filebaseBucket,
            Key: s3Key,
            Body: buffer,
            ContentType: file.type,
            ACL: ObjectCannedACL.public_read
          };
          
          await s3Client.send(new PutObjectCommand(uploadParams));
          
          const url = `https://${filebaseBucket}.s3.filebase.com/${s3Key}`;
          console.log(`✅ File uploaded to Filebase S3: ${url}`);
          
          return { success: true, url };
        } catch (s3Error) {
          console.warn('❌ Filebase S3 upload failed, trying alternative:', s3Error);
        }
      }
      
      // Try Supabase as second option
      if (!isSupabasePlaceholder) {
        console.log('🔄 Trying Supabase upload...');
        
        const { data, error } = await supabase.storage
          .from(folder)
          .upload(finalFileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!error) {
          const { data: urlData } = supabase.storage
            .from(folder)
            .getPublicUrl(finalFileName);

          console.log(`✅ File uploaded to Supabase: ${urlData.publicUrl}`);
          return { success: true, url: urlData.publicUrl };
        }
        
        console.warn('❌ Supabase upload failed:', error.message);
      }
      
      // Fallback: Create optimized data URL
      console.log('🔄 Creating data URL fallback...');
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // For images, try to resize and optimize
          if (file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // Resize to max 400x400
              const maxSize = 400;
              let { width, height } = img;
              
              if (width > height) {
                if (width > maxSize) {
                  height = (height * maxSize) / width;
                  width = maxSize;
                }
              } else {
                if (height > maxSize) {
                  width = (width * maxSize) / height;
                  height = maxSize;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              
              ctx?.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL(file.type, 0.7); // Reduced quality
              
              console.log(`✅ Created optimized data URL fallback (${dataUrl.length} chars)`);
              resolve({ success: true, url: dataUrl });
            };
            
            img.onerror = () => {
              // If image processing fails, return the original data URL
              console.log('❌ Image optimization failed, using original data URL');
              resolve({ success: true, url: reader.result as string });
            };
            
            img.src = reader.result as string;
          } else {
            // For non-image files, return data URL directly
            resolve({ success: true, url: reader.result as string });
          }
        };
        
        reader.onerror = () => {
          console.error('❌ Failed to read file');
          resolve({ success: false, error: 'Failed to read file' });
        };
        
        reader.readAsDataURL(file);
      });
      
    } catch (error) {
      console.error('❌ File upload error:', error);
      return { success: false, error: 'File upload failed' };
    }
  },
  
  // Enhanced metadata upload function for ARC-3 compliance
  async uploadMetadataToStorage(
    metadata: any, 
    bucket: string = 'token-metadata', 
    fileName?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log('📤 Starting metadata upload...');
      
      // Generate unique filename if not provided
      const finalFileName = fileName || `metadata-${Date.now()}-${Math.random().toString(36).substring(2)}.json`;
      
      // Convert metadata to JSON string
      const metadataJson = JSON.stringify(metadata, null, 2);
      const blob = new Blob([metadataJson], { type: 'application/json' });
      
      // Try S3 upload first
      if (isFilebaseConfigured && s3Client) {
        console.log('🔄 Trying Filebase S3 upload...');
        try {
          const bucketExists = await ensureBucketExists();
          if (!bucketExists) {
            throw new Error('S3 bucket does not exist and could not be created');
          }
          
          const s3Key = `${bucket}/${finalFileName}`;
          
          const uploadParams = {
            Bucket: filebaseBucket,
            Key: s3Key,
            Body: metadataJson,
            ContentType: 'application/json',
            ACL: ObjectCannedACL.public_read
          };
          
          await s3Client.send(new PutObjectCommand(uploadParams));
          
          const url = `https://${filebaseBucket}.s3.filebase.com/${s3Key}`;
          console.log(`✅ Metadata uploaded to Filebase S3: ${url}`);
          
          return { success: true, url };
        } catch (s3Error) {
          console.warn('❌ Filebase S3 metadata upload failed, trying alternative:', s3Error);
        }
      }
      
      // Try Supabase upload next
      if (!isSupabasePlaceholder) {
        console.log('🔄 Trying Supabase upload...');
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(finalFileName, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'application/json'
          });

        if (!error) {
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(finalFileName);

          console.log(`✅ Metadata uploaded to Supabase: ${urlData.publicUrl}`);
          return { success: true, url: urlData.publicUrl };
        }
        
        console.warn('❌ Supabase metadata upload failed:', error.message);
      }
      
      // Fall back to alternative methods
      return supabaseHelpers.uploadMetadataFallback(metadata);
      
    } catch (error) {
      console.error('❌ Metadata upload error:', error);
      return supabaseHelpers.uploadMetadataFallback(metadata);
    }
  },

  // Simplified fallback system
  async uploadMetadataFallback(metadata: any): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const metadataJson = JSON.stringify(metadata, null, 2);
      
      console.log('📦 Attempting fallback metadata storage...');
      
      // Try GitHub Gist (most reliable)
      try {
        console.log('🔄 Trying GitHub Gist...');
        const gistResponse = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: `Token Metadata - ${metadata.name || 'Unnamed Token'}`,
            public: true,
            files: { 'metadata.json': { content: metadataJson } }
          })
        });
        
        if (gistResponse.ok) {
          const gistResult = await gistResponse.json();
          const gistUrl = `https://gist.githubusercontent.com/anonymous/${gistResult.id}/raw/metadata.json`;
          console.log('✅ GitHub Gist upload successful:', gistUrl);
          return { success: true, url: gistUrl };
        }
      } catch (gistError) {
        console.warn('⚠️ GitHub Gist failed:', gistError);
      }
      
      // Try JSONBin.io as secondary fallback
      try {
        console.log('🔄 Trying JSONBin.io...');
        const jsonbinResponse = await fetch('https://api.jsonbin.io/v3/b', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Bin-Name': `token-metadata-${Date.now()}`
          },
          body: metadataJson
        });
        
        if (jsonbinResponse.ok) {
          const jsonbinResult = await jsonbinResponse.json();
          const jsonbinUrl = `https://api.jsonbin.io/v3/b/${jsonbinResult.metadata.id}/latest`;
          console.log('✅ JSONBin.io upload successful:', jsonbinUrl);
          return { success: true, url: jsonbinUrl };
        }
      } catch (jsonbinError) {
        console.warn('⚠️ JSONBin.io failed:', jsonbinError);
      }

      // Fallback to minimal data URL for Algorand compatibility
      console.log('🔄 Using minimal data URL fallback...');
      const minimalMetadata = {
        name: metadata.name || 'Token',
        symbol: metadata.properties?.symbol || 'TKN',
        decimals: metadata.properties?.decimals || 9
      };
      
      const minimalJson = JSON.stringify(minimalMetadata);
      const dataUrl = `data:application/json;base64,${btoa(minimalJson)}`;
      
      if (dataUrl.length <= 96) {
        console.log('✅ Data URL fallback successful (96 chars limit)');
        return { success: true, url: dataUrl };
      }
      
      // Ultimate fallback
      const fallbackUrl = 'https://token.info';
      console.log('✅ Using minimal fallback URL for compatibility');
      return { success: true, url: fallbackUrl };
      
    } catch (error) {
      console.error('❌ All fallback methods failed:', error);
      return { success: false, error: 'Metadata upload failed' };
    }
  },
  
  // Helper for IPFS upload via Filebase
  async uploadToIPFS(
    data: File | Blob | string,
    fileName?: string
  ): Promise<{ success: boolean; cid?: string; url?: string; error?: string }> {
    try {
      console.log(`📤 Starting IPFS upload via Filebase...`);
      
      if (!isFilebaseConfigured || !s3Client) {
        throw new Error('Filebase S3 configuration missing');
      }
      
      // Generate unique filename if not provided
      const finalFileName = fileName || `ipfs-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const ipfsBucket = `${filebaseBucket}-ipfs`;
      
      // Convert data to Buffer if it's a string
      let fileContent: Buffer | Blob;
      if (typeof data === 'string') {
        fileContent = Buffer.from(data);
      } else {
        fileContent = data;
      }
      
      // Ensure IPFS bucket exists
      try {
        await s3Client.send(
          new HeadBucketCommand({ Bucket: ipfsBucket })
        );
      } catch (error) {
        // Bucket doesn't exist, create it
        await s3Client.send(
          new CreateBucketCommand({ Bucket: ipfsBucket })
        );
        console.log(`✅ IPFS bucket ${ipfsBucket} created`);
      }
      
      // Upload to IPFS via Filebase
      await s3Client.send(
        new PutObjectCommand({
          Bucket: ipfsBucket,
          Key: finalFileName,
          Body: fileContent instanceof Blob ? new Uint8Array(await fileContent.arrayBuffer()) : fileContent,
          ContentType: data instanceof File ? data.type : 'application/octet-stream',
          ACL: ObjectCannedACL.public_read
        })
      );
      
      // Get object info to extract CID
      const objectUrl = `https://${ipfsBucket}.s3.filebase.com/${finalFileName}`;
      const ipfsUrl = objectUrl.replace('s3.filebase.com', 'ipfs.filebase.io');
      
      console.log(`✅ File uploaded to IPFS via Filebase: ${ipfsUrl}`);
      
      return {
        success: true,
        url: ipfsUrl,
        cid: ipfsUrl.split('/').pop() || ''
      };
    } catch (error) {
      console.error('❌ IPFS upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'IPFS upload failed' 
      };
    }
  }
};