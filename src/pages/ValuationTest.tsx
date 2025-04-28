
import { ValuationTester } from "@/components/valuation/ValuationTester";
import { PageLayout } from "@/components/layout/PageLayout";

export default function ValuationTestPage() {
  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Valuation Function Tester</h1>
        <ValuationTester />
      </div>
    </PageLayout>
  );
}
