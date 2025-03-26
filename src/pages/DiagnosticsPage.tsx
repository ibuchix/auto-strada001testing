
/**
 * Changes made:
 * - 2027-07-23: Created diagnostics page for troubleshooting navigation issues
 */

import { DiagnosticViewer } from "@/diagnostics/DiagnosticViewer";
import { PageLayout } from "@/components/layout/PageLayout";

const DiagnosticsPage = () => {
  return (
    <PageLayout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-4">Navigation Diagnostics</h1>
        <p className="mb-8">
          This page displays diagnostic logs to help troubleshoot navigation issues with the "List This Car" button.
          Try clicking the button and then check this page to see what happened.
        </p>
        <DiagnosticViewer />
      </div>
    </PageLayout>
  );
};

export default DiagnosticsPage;
