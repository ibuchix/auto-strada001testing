
/**
 * Diagnostic viewer component for debugging
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { getDiagnostics, clearDiagnostics } from './listingButtonDiagnostics';

const DiagnosticViewer = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDiagnostics = async () => {
    setIsLoading(true);
    try {
      const diagnostics = await getDiagnostics();
      setLogs(diagnostics);
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllDiagnostics = async () => {
    if (window.confirm('Are you sure you want to clear all diagnostic logs?')) {
      try {
        await clearDiagnostics();
        setLogs([]);
      } catch (error) {
        console.error('Failed to clear diagnostics:', error);
      }
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  // Helper function to determine badge variant
  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'destructive';
      case 'WARNING':
        return 'default'; // Custom warning
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Navigation Diagnostic Logs</CardTitle>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={loadDiagnostics}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={clearAllDiagnostics}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-[70vh] overflow-auto">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="mx-auto h-12 w-12 mb-4 text-gray-300" />
            <p>No diagnostic logs found</p>
            <p className="text-sm mt-1">
              Diagnostic logging will appear here when users interact with the listing button.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{log.event}</h3>
                      <Badge variant={getBadgeVariant(log.level)}>
                        {log.level}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-3">{log.message}</p>
                  
                  {log.data && (
                    <div className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {log.diagnostic_id && (
                    <div className="mt-2 text-xs text-gray-500">
                      Diagnostic ID: {log.diagnostic_id}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiagnosticViewer;
