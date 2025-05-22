
/**
 * Storage Diagnostics Page
 * Created: 2025-06-22
 * 
 * A dedicated page for storage diagnostics tools
 */
import { StorageDiagnostic } from "@/components/diagnostics/StorageDiagnostic";

const DiagnosticsPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Storage Diagnostics</h1>
      <StorageDiagnostic />
    </div>
  );
};

export default DiagnosticsPage;
