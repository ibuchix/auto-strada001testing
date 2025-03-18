
/**
 * Changes made:
 * - 2024-10-30: Updated to use formatCurrency from utils/validation
 */

import { formatCurrency } from "@/utils/validation";

export const ValuationDisplay = ({ amount }: { amount: number }) => {
  return (
    <div className="flex flex-col items-center">
      <p className="text-4xl font-bold text-center text-primary">
        {formatCurrency(amount)}
      </p>
    </div>
  );
};
