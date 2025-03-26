
/**
 * Changes made:
 * - 2028-06-01: Created a debug panel component for transaction monitoring and troubleshooting
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Bug, X, RefreshCw, Download, AlertTriangle,
  Info, Terminal, ChevronUp, ChevronDown 
} from "lucide-react";
import { getDiagnostics, clearDiagnostics, formatDiagnosticReport } from "@/diagnostics/listingButtonDiagnostics";
import { TransactionStatus } from "@/services/supabase/transactionService";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface TransactionDebugPanelProps {
  transactionId?: string;
  transactionStatus?: TransactionStatus;
  formData?: any;
}

export const TransactionDebugPanel = ({ 
  transactionId,
  transactionStatus,
  formData
}: TransactionDebugPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("diagnostics");
  const [showPanel, setShowPanel] = useLocalStorage('showDebugPanel', false);
  
  if (!showPanel) return null;
  
  const diagnosticLogs = getDiagnostics(transactionId);
  
  const handleExportLogs = () => {
    const report = formatDiagnosticReport(diagnosticLogs);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-logs-${transactionId || 'all'}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  const handleClearLogs = () => {
    clearDiagnostics();
    // Force re-render
    setActiveTab("diagnostics");
  };
  
  const getStatusBadge = () => {
    if (!transactionStatus) return null;
    
    const statusMap = {
      [TransactionStatus.PENDING]: { color: "bg-blue-500", label: "Pending" },
      [TransactionStatus.SUCCESS]: { color: "bg-green-500", label: "Success" },
      [TransactionStatus.ERROR]: { color: "bg-red-500", label: "Error" }
    };
    
    const status = statusMap[transactionStatus];
    
    return (
      <Badge variant="outline" className={`ml-2 ${status.color} text-white`}>
        {status.label}
      </Badge>
    );
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 w-full md:w-1/2 xl:w-1/3">
      <Card className="border-2 border-gray-200 dark:border-gray-700">
        <div 
          className="p-2 flex justify-between items-center cursor-pointer bg-slate-100 dark:bg-slate-800"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            <Bug className="h-4 w-4 mr-2" />
            <span className="font-medium">
              Transaction Debug Panel
              {getStatusBadge()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => {
                e.stopPropagation();
                setShowPanel(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </div>
        </div>
        
        {expanded && (
          <div className="p-3">
            <Tabs defaultValue="diagnostics" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-2">
                <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                <TabsTrigger value="localStorage">Local Storage</TabsTrigger>
                <TabsTrigger value="formData">Form Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="diagnostics">
                <div className="flex justify-between mb-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleExportLogs}
                  >
                    <Download className="h-4 w-4 mr-1" /> Export
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleClearLogs}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Clear
                  </Button>
                </div>
                
                <div className="bg-slate-900 text-slate-50 p-2 rounded text-xs font-mono h-60 overflow-y-auto">
                  {diagnosticLogs.length > 0 ? (
                    <div>
                      {diagnosticLogs.map((log, index) => (
                        <div key={log.id} className="mb-2 border-b border-slate-700 pb-1">
                          <div className="flex items-start gap-1">
                            {log.severity === 'ERROR' && <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />}
                            {log.severity === 'WARNING' && <AlertTriangle className="h-3 w-3 text-yellow-500 flex-shrink-0 mt-0.5" />}
                            {log.severity === 'INFO' && <Info className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />}
                            {log.severity === 'DEBUG' && <Terminal className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />}
                            <div>
                              <span className="text-slate-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                              <span className="text-white font-semibold">{log.event}:</span>{' '}
                              <span>{log.data?.message}</span>
                              
                              {log.data && Object.keys(log.data).length > 1 && (
                                <div className="pl-3 mt-1 text-slate-300 text-xs">
                                  {Object.entries(log.data)
                                    .filter(([key]) => key !== 'message')
                                    .map(([key, value]) => (
                                      <div key={key}>
                                        <span className="text-slate-400">{key}:</span>{' '}
                                        <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                      </div>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">No diagnostic logs available</div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="localStorage">
                <div className="bg-slate-900 text-slate-50 p-2 rounded text-xs font-mono h-60 overflow-y-auto">
                  {Object.keys(localStorage).length > 0 ? (
                    Object.keys(localStorage).map(key => {
                      const value = localStorage.getItem(key);
                      const isJson = value && (value.startsWith('{') || value.startsWith('['));
                      
                      return (
                        <div key={key} className="mb-2 border-b border-slate-700 pb-1">
                          <div className="font-semibold text-blue-300">{key}:</div>
                          <div className="pl-2 text-slate-300">
                            {isJson ? (
                              <pre>{JSON.stringify(JSON.parse(value!), null, 2)}</pre>
                            ) : (
                              <span className="break-all">{value}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-400 italic">No localStorage data available</div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="formData">
                <div className="bg-slate-900 text-slate-50 p-2 rounded text-xs font-mono h-60 overflow-y-auto">
                  {formData ? (
                    <pre>{JSON.stringify(formData, null, 2)}</pre>
                  ) : (
                    <div className="text-slate-400 italic">No form data available</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Card>
    </div>
  );
};
