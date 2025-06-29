import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSupabaseStatus, initializeStorageBuckets } from '@/lib/supabase-client';
import { Database, ShieldCheck, Shield as ShieldX, Server, File, Cog, RefreshCw, AlertTriangle, AlertCircle, Check } from 'lucide-react';

export function SupabaseStatus({ showDetailedInfo = false }: { showDetailedInfo?: boolean }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const status = await getSupabaseStatus();
    setStatus(status);
    setLoading(false);
  };

  const initializeBuckets = async () => {
    setInitializing(true);
    try {
      const result = await initializeStorageBuckets();
      if (result.success) {
        await checkStatus();
      }
    } catch (error) {
      console.error('Error initializing buckets:', error);
    } finally {
      setInitializing(false);
    }
  };

  if (!showDetailedInfo) {
    // Minimal status indicator for production
    if (!status?.isConfigured) {
      return null;
    }
    
    return (
      <div className="flex items-center space-x-1.5">
        <div className={`w-2 h-2 rounded-full ${status?.error ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
        <span className="text-xs text-muted-foreground">Supabase</span>
      </div>
    );
  }

  return (
    <Card className="w-full border-blue-500/20 bg-blue-500/5">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle>Supabase Status</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={checkStatus} disabled={loading} className="h-8 w-8 p-0">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Configuration and connection status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Connection</span>
              <Badge 
                variant={status?.isConfigured ? 'default' : 'destructive'}
                className={status?.isConfigured ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
              >
                {status?.isConfigured ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
            
            {status?.error && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-700">Connection Error</p>
                    <p className="text-yellow-600">{status.error}</p>
                  </div>
                </div>
              </div>
            )}

            {status?.isConfigured && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">URL</span>
                  <span className="text-sm text-muted-foreground font-mono truncate max-w-[200px]">{status.url}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Auth</span>
                  <Badge 
                    variant={status.auth?.enabled ? 'default' : 'secondary'}
                    className={status.auth?.enabled ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
                  >
                    {status.auth?.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Storage</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{status.buckets?.length || 0} buckets</span>
                    {status.buckets?.length === 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={initializeBuckets} 
                        disabled={initializing}
                        className="h-8 text-xs"
                      >
                        {initializing ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Initializing
                          </>
                        ) : (
                          <>
                            <Cog className="h-3 w-3 mr-1" />
                            Initialize
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {status.buckets?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium">Available Buckets:</p>
                    <div className="flex flex-wrap gap-2">
                      {status.buckets.map((bucket: any) => (
                        <Badge 
                          key={bucket.id} 
                          variant="outline"
                          className="bg-blue-500/10 border-blue-500/30 text-blue-500"
                        >
                          <File className="h-3 w-3 mr-1" />
                          {bucket.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!status?.isConfigured && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-blue-700">Setup Required</p>
                    <p className="text-blue-600">Supabase integration requires configuration.</p>
                    <div className="bg-blue-500/5 p-3 rounded border border-blue-500/10 font-mono text-xs">
                      <p>1. Create a .env.local file with:</p>
                      <p className="mt-1 text-blue-800">NEXT_PUBLIC_SUPABASE_URL=your-project-url</p>
                      <p className="text-blue-800">NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {status?.isConfigured && (
        <CardFooter className="pt-0 border-t flex justify-between">
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${status.error ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span>{status.error ? 'Connection issues' : 'Connected'}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8"
          >
            <span className="flex items-center space-x-1">
              {status.auth?.currentUser ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Authenticated</span>
                </>
              ) : (
                <>
                  <ShieldX className="h-3 w-3" />
                  <span>Not Authenticated</span>
                </>
              )}
            </span>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}