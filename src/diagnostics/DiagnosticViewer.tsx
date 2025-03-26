
/**
 * Component for viewing diagnostic logs
 */

import { useState, useEffect } from 'react';
import { getDiagnostics } from './listingButtonDiagnostics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DiagnosticViewer = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<string | null>(null);
  const [diagnosticIds, setDiagnosticIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    refreshLogs();
  }, []);

  const refreshLogs = () => {
    const allLogs = getDiagnostics();
    setLogs(allLogs);
    
    // Extract unique diagnostic IDs
    const uniqueIds = Array.from(new Set(allLogs.map(log => log.id.split('-')[0])));
    setDiagnosticIds(uniqueIds);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'orange';
      case 'debug':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredLogs = selectedDiagnosticId
    ? logs.filter(log => log.id.startsWith(selectedDiagnosticId))
    : logs;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Diagnostic Logs</h2>
        <Button onClick={refreshLogs}>Refresh</Button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          variant={selectedDiagnosticId === null ? "default" : "outline"} 
          onClick={() => setSelectedDiagnosticId(null)}
        >
          All Sessions
        </Button>
        {diagnosticIds.map(id => (
          <Button 
            key={id} 
            variant={selectedDiagnosticId === id ? "default" : "outline"}
            onClick={() => setSelectedDiagnosticId(id)}
          >
            Session {id.substring(0, 8)}
          </Button>
        ))}
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({filteredLogs.length})</TabsTrigger>
          <TabsTrigger value="errors">Errors ({filteredLogs.filter(log => log.severity === 'ERROR').length})</TabsTrigger>
          <TabsTrigger value="warnings">Warnings ({filteredLogs.filter(log => log.severity === 'WARNING').length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <LogList logs={filteredLogs} />
        </TabsContent>
        
        <TabsContent value="errors" className="mt-4">
          <LogList logs={filteredLogs.filter(log => log.severity === 'ERROR')} />
        </TabsContent>
        
        <TabsContent value="warnings" className="mt-4">
          <LogList logs={filteredLogs.filter(log => log.severity === 'WARNING')} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const LogList = ({ logs }: { logs: any[] }) => {
  if (logs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No logs found</div>;
  }

  return (
    <div className="space-y-4">
      {logs.map(log => (
        <Card key={log.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{log.type}</CardTitle>
              <Badge variant={log.severity === 'ERROR' ? 'destructive' : (log.severity === 'WARNING' ? 'default' : 'secondary')}>
                {log.severity}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(log.timestamp).toLocaleString()}
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2">{log.message}</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DiagnosticViewer;
