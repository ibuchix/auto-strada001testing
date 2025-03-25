
/**
 * Changes made:
 * - 2027-07-23: Created diagnostic viewer component for troubleshooting
 */

import { useState, useEffect } from "react";
import { getDiagnosticLogs, clearDiagnostics } from "./listingButtonDiagnostics";

export const DiagnosticViewer = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const refreshLogs = () => {
    const allLogs = getDiagnosticLogs();
    setLogs(allLogs);
  };
  
  useEffect(() => {
    refreshLogs();
    
    if (autoRefresh) {
      const interval = setInterval(refreshLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);
  
  const filteredLogs = filter 
    ? logs.filter(log => 
        log.area.toLowerCase().includes(filter.toLowerCase()) || 
        log.message.toLowerCase().includes(filter.toLowerCase()) ||
        (log.data && log.data.toLowerCase().includes(filter.toLowerCase()))
      )
    : logs;
  
  const handleClearLogs = () => {
    clearDiagnostics();
    refreshLogs();
  };
  
  // Group logs by session ID
  const sessionIds = [...new Set(logs.map(log => log.sessionId))];
  
  return (
    <div className="p-4 bg-white rounded-lg shadow max-w-6xl mx-auto my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Diagnostic Logs</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Filter logs..."
            className="px-3 py-2 border rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
            />
            Auto-refresh
          </label>
          <button 
            onClick={refreshLogs}
            className="px-3 py-2 bg-blue-500 text-white rounded"
          >
            Refresh
          </button>
          <button 
            onClick={handleClearLogs}
            className="px-3 py-2 bg-red-500 text-white rounded"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold">Sessions: {sessionIds.length}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {sessionIds.map(id => (
            <div key={id} className="px-3 py-1 bg-gray-100 rounded text-sm">
              {id} ({logs.filter(log => log.sessionId === id).length} logs)
            </div>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Session</th>
              <th className="p-2 text-left">Area</th>
              <th className="p-2 text-left">Message</th>
              <th className="p-2 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <tr key={index} className="border-b">
                <td className="p-2 text-sm font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td className="p-2 text-sm font-mono">{log.sessionId.substring(0, 6)}</td>
                <td className="p-2">{log.area}</td>
                <td className="p-2">{log.message}</td>
                <td className="p-2">
                  {log.data && (
                    <details>
                      <summary>View details</summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                        {log.data}
                      </pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredLogs.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          No logs found. Try clicking the List This Car button to generate logs.
        </div>
      )}
    </div>
  );
};
