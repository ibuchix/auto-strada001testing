
/**
 * Storage Diagnostic Component
 * Created: 2025-05-25
 * 
 * A debug component to help troubleshoot storage-related issues
 * Shows localStorage contents and bucket information
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_BUCKET, LOCAL_STORAGE_KEYS, clearStaleLocalStorage } from "@/config/storage";

export const StorageDiagnostic = () => {
  const [localStorageItems, setLocalStorageItems] = useState<{key: string, hasIncorrectBucket: boolean, size: number}[]>([]);
  const [bucketInfo, setBucketInfo] = useState<{exists: boolean, message: string}>({
    exists: false,
    message: "Checking..."
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Get local storage info
  const refreshLocalStorageInfo = () => {
    try {
      const items: {key: string, hasIncorrectBucket: boolean, size: number}[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || "";
          const hasIncorrectBucket = value.includes('car-photos');
          items.push({
            key,
            hasIncorrectBucket,
            size: (value.length * 2) / 1024 // Approximate size in KB
          });
        }
      }
      
      setLocalStorageItems(items);
    } catch (error) {
      console.error("Error reading localStorage:", error);
    }
  };
  
  // Check bucket existence
  const checkBucketExists = async () => {
    try {
      setIsLoading(true);
      
      const { data: buckets, error } = await supabase
        .storage
        .listBuckets();
      
      if (error) {
        setBucketInfo({
          exists: false,
          message: `Error checking buckets: ${error.message}`
        });
        return;
      }
      
      const bucket = buckets?.find(b => b.name === STORAGE_BUCKET);
      
      setBucketInfo({
        exists: !!bucket,
        message: bucket 
          ? `Bucket "${STORAGE_BUCKET}" exists and is ${bucket.public ? 'public' : 'private'}`
          : `Bucket "${STORAGE_BUCKET}" not found. Available buckets: ${buckets?.map(b => b.name).join(', ') || 'none'}`
      });
    } catch (error) {
      console.error("Error checking bucket:", error);
      setBucketInfo({
        exists: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear problematic localStorage items
  const clearProblematicItems = () => {
    const problematicItems = localStorageItems.filter(item => item.hasIncorrectBucket);
    problematicItems.forEach(item => {
      localStorage.removeItem(item.key);
    });
    
    clearStaleLocalStorage();
    refreshLocalStorageInfo();
  };
  
  // Initialize on component mount
  useEffect(() => {
    refreshLocalStorageInfo();
    checkBucketExists();
  }, []);
  
  return (
    <Card className="mb-8">
      <CardHeader className="bg-amber-50">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          Storage Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Local Storage ({localStorageItems.length} items)</h3>
            <div className="space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={refreshLocalStorageInfo}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={clearProblematicItems}
                disabled={!localStorageItems.some(item => item.hasIncorrectBucket)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Problematic Items
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size (KB)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {localStorageItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                      No localStorage items found
                    </td>
                  </tr>
                ) : (
                  localStorageItems.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-sm">{item.key}</td>
                      <td className="px-4 py-2 text-sm">{item.size.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        {item.hasIncorrectBucket ? (
                          <Badge variant="destructive">Incorrect Bucket</Badge>
                        ) : (
                          <Badge variant="outline">OK</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Storage Bucket Check</h3>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={checkBucketExists} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check
                </>
              )}
            </Button>
          </div>
          
          <div className={`border rounded-md p-4 ${bucketInfo.exists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={bucketInfo.exists ? 'text-green-700' : 'text-red-700'}>
              {bucketInfo.message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
