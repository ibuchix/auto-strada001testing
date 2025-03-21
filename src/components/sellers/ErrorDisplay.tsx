
/**
 * Changes made:
 * - 2025-07-14: Created dedicated error display component for seller flows
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface ErrorDisplayProps {
  error: string;
  errorType?: 'auth' | 'data' | 'seller' | null;
  onRetryVerification?: () => void;
  isVerifying?: boolean;
}

export const ErrorDisplay = ({ 
  error, 
  errorType, 
  onRetryVerification, 
  isVerifying = false 
}: ErrorDisplayProps) => {
  const navigate = useNavigate();

  return (
    <Card className="max-w-md mx-auto p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Unable to Create Listing</h2>
      <p className="text-gray-600 mb-6">{error}</p>
      <div className="flex justify-center gap-4">
        {errorType === 'auth' && (
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        )}
        {errorType === 'data' && (
          <Button onClick={() => navigate('/')}>
            Start Valuation
          </Button>
        )}
        {errorType === 'seller' && (
          <>
            <Button 
              onClick={onRetryVerification}
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying..." : "Retry Verification"}
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Register as Seller
            </Button>
          </>
        )}
        {!errorType && (
          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>
        )}
      </div>
    </Card>
  );
};
