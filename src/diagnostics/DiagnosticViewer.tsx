
/**
 * Changes made:
 * - 2024-08-04: Fixed import for getDiagnosticLogs
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDiagnostics } from './listingButtonDiagnostics';

const DiagnosticViewer = ({ diagnosticId }: { diagnosticId?: string }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [refreshCount, setRefreshCount] = useState(0);
  
  useEffect(() => {
    if (diagnosticId) {
      const diagnosticLogs = getDiagnostics(diagnosticId);
      setLogs(diagnosticLogs);
    }
  }, [diagnosticId, refreshCount]);
  
  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };
  
  const filteredLogs = selectedTab === 'all' 
    ? logs 
    : logs.filter(log => log.level === selectedTab);
  
  if (!diagnosticId) {
    return null;
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">Diagnostic Logs</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="INFO">Info</TabsTrigger>
            <TabsTrigger value="WARNING">Warnings</TabsTrigger>
            <TabsTrigger value="ERROR">Errors</TabsTrigger>
            <TabsTrigger value="DEBUG">Debug</TabsTrigger>
          </TabsList>
          <TabsContent value={selectedTab}>
            <ScrollArea className="h-[300px]">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-6">
                  No logs found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-2 text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">{log.event}</span>
                        <Badge 
                          variant={
                            log.level === 'ERROR' ? 'destructive' : 
                            log.level === 'WARNING' ? 'warning' : 
                            'outline'
                          }
                        >
                          {log.level}
                        </Badge>
                      </div>
                      <p className="mb-1">{log.message}</p>
                      <div className="text-muted-foreground text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      {log.details && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-muted-foreground">Details</summary>
                          <pre className="text-[10px] mt-1 bg-muted p-1 rounded">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DiagnosticViewer;
