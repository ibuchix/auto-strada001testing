
/**
 * A testing interface for the get-vehicle-valuation edge function
 * Created: 2025-04-28
 * Updated: 2025-04-29 - Added gearbox parameter to fix 400 Bad Request error
 * Updated: 2025-04-30 - Enhanced error handling to display detailed API errors
 * Updated: 2025-05-01 - Fixed FunctionsHttpError handling to use context.json()
 * Updated: 2025-05-02 - Fixed TypeScript error by using 'code' property instead of 'status'
 * Updated: 2025-05-03 - Added display of reserve price calculation details
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FunctionsHttpError } from '@supabase/supabase-js';

export function ValuationTester() {
  const [vin, setVin] = useState('WAUZZZ8K79A090954');
  const [mileage, setMileage] = useState('80000');
  const [gearbox, setGearbox] = useState('manual');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const testValuation = async () => {
    if (!vin || vin.length !== 17) {
      toast.error('Invalid VIN', {
        description: 'VIN must be exactly 17 characters'
      });
      return;
    }

    if (!mileage || Number(mileage) <= 0) {
      toast.error('Invalid mileage', {
        description: 'Mileage must be a positive number'
      });
      return;
    }

    setLoading(true);
    setErrorDetails(null);
    
    try {
      // Make the request
      console.log('📤 Sending valuation request:', { 
        vin, 
        mileage: Number(mileage), 
        gearbox,
        timestamp: new Date().toISOString()
      });
      
      const { data, error } = await supabase.functions.invoke(
        'get-vehicle-valuation',
        {
          body: { 
            vin, 
            mileage: Number(mileage), 
            gearbox,
            debug: true // Enable detailed response
          }
        }
      );
      
      if (error) {
        throw error;
      }
      
      console.log('📦 Response data:', data);
      
      // Success path
      setResult(data);
      toast.success('Valuation retrieved successfully');
      
    } catch (err: any) {
      console.error('❌ Error testing valuation:', err);
      
      // Handle FunctionsHttpError specifically to get the response body
      if (err instanceof FunctionsHttpError) {
        try {
          // Use context.json() to get the error details
          const errorJson = await err.context.json();
          console.error(`🛑 Edge function error (${err.message}):`, errorJson);
          
          setErrorDetails(JSON.stringify(errorJson, null, 2));
          toast.error('Valuation Error', {
            description: errorJson.error || 'Failed to get valuation'
          });
        } catch (parseError) {
          // Fallback if JSON parsing fails
          console.error('Error parsing JSON from FunctionsHttpError:', parseError);
          setErrorDetails(`Error parsing response: ${parseError.message}`);
          
          toast.error('Valuation Error', {
            description: 'Failed to get valuation'
          });
        }
      } else {
        // Handle other types of errors
        toast.error('Valuation Error', {
          description: err.message || 'Failed to get valuation'
        });
        
        setErrorDetails(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate which price tier was used
  const getPriceTier = (basePrice: number) => {
    if (!basePrice) return null;
    
    if (basePrice <= 15000) return { range: '0 - 15,000 PLN', percentage: '65%' };
    else if (basePrice <= 20000) return { range: '15,001 - 20,000 PLN', percentage: '46%' };
    else if (basePrice <= 30000) return { range: '20,001 - 30,000 PLN', percentage: '37%' };
    else if (basePrice <= 50000) return { range: '30,001 - 50,000 PLN', percentage: '27%' };
    else if (basePrice <= 60000) return { range: '50,001 - 60,000 PLN', percentage: '27%' };
    else if (basePrice <= 70000) return { range: '60,001 - 70,000 PLN', percentage: '22%' };
    else if (basePrice <= 80000) return { range: '70,001 - 80,000 PLN', percentage: '23%' };
    else if (basePrice <= 100000) return { range: '80,001 - 100,000 PLN', percentage: '24%' };
    else if (basePrice <= 130000) return { range: '100,001 - 130,000 PLN', percentage: '20%' };
    else if (basePrice <= 160000) return { range: '130,001 - 160,000 PLN', percentage: '18.5%' };
    else if (basePrice <= 200000) return { range: '160,001 - 200,000 PLN', percentage: '22%' };
    else if (basePrice <= 250000) return { range: '200,001 - 250,000 PLN', percentage: '17%' };
    else if (basePrice <= 300000) return { range: '250,001 - 300,000 PLN', percentage: '18%' };
    else if (basePrice <= 400000) return { range: '300,001 - 400,000 PLN', percentage: '18%' };
    else if (basePrice <= 500000) return { range: '400,001 - 500,000 PLN', percentage: '16%' };
    else return { range: '500,001+ PLN', percentage: '14.5%' };
  };

  // Calculate the expected reserve price for display purposes
  const calculateExpectedReservePrice = (basePrice: number) => {
    if (!basePrice) return null;
    
    const tier = getPriceTier(basePrice);
    if (!tier) return null;
    
    const percentageValue = parseFloat(tier.percentage.replace('%', '')) / 100;
    return Math.round(basePrice - (basePrice * percentageValue));
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">VIN</label>
          <Input 
            value={vin} 
            onChange={(e) => setVin(e.target.value.toUpperCase())} 
            placeholder="Enter VIN (17 characters)"
            maxLength={17}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Example: WAUZZZ8K79A090954
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Mileage (km)</label>
          <Input 
            value={mileage} 
            onChange={(e) => setMileage(e.target.value)} 
            placeholder="Enter mileage" 
            type="number" 
            min="0"
          />
        </div>
        
        <div>
          <Label className="block text-sm font-medium mb-1">Gearbox Type</Label>
          <Select 
            value={gearbox} 
            onValueChange={setGearbox}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select gearbox type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="automatic">Automatic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={testValuation} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Get Valuation'}
        </Button>
      </div>

      {errorDetails && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Details:</h3>
          <div className="bg-red-50 border border-red-200 p-4 rounded-md">
            <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-sm text-red-800">
              {errorDetails}
            </pre>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Vehicle Information:</h3>
          <div className="bg-muted p-4 rounded-md mb-4">
            <dl className="space-y-2">
              <div className="grid grid-cols-2">
                <dt className="font-medium">Make:</dt>
                <dd>{result.make}</dd>
              </div>
              <div className="grid grid-cols-2">
                <dt className="font-medium">Model:</dt>
                <dd>{result.model}</dd>
              </div>
              <div className="grid grid-cols-2">
                <dt className="font-medium">Year:</dt>
                <dd>{result.year}</dd>
              </div>
              <div className="grid grid-cols-2">
                <dt className="font-medium">Mileage:</dt>
                <dd>{result.mileage} km</dd>
              </div>
            </dl>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Valuation Details:</h3>
          <div className="bg-muted p-4 rounded-md mb-4">
            <dl className="space-y-2">
              <div className="grid grid-cols-2">
                <dt className="font-medium">Market Value:</dt>
                <dd>{result.valuation?.toLocaleString()} PLN</dd>
              </div>
              <div className="grid grid-cols-2">
                <dt className="font-medium">Base Price:</dt>
                <dd>{result.basePrice?.toLocaleString()} PLN</dd>
              </div>
              <div className="grid grid-cols-2">
                <dt className="font-medium">Price Tier:</dt>
                <dd>{getPriceTier(result.basePrice)?.range}</dd>
              </div>
              <div className="grid grid-cols-2">
                <dt className="font-medium">Discount Rate:</dt>
                <dd>{getPriceTier(result.basePrice)?.percentage}</dd>
              </div>
              <div className="grid grid-cols-2 text-primary">
                <dt className="font-medium">Reserve Price:</dt>
                <dd className="font-bold">{result.reservePrice?.toLocaleString()} PLN</dd>
              </div>
              
              {result.basePrice && result.reservePrice && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm">
                    <span className="font-medium">Reserve Price Calculation:</span><br />
                    BasePrice - (BasePrice × DiscountRate)<br />
                    {result.basePrice?.toLocaleString()} - ({result.basePrice?.toLocaleString()} × {getPriceTier(result.basePrice)?.percentage}) = {result.reservePrice?.toLocaleString()} PLN
                  </p>
                </div>
              )}
            </dl>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Raw Response:</h3>
          <div className="bg-muted p-4 rounded-md">
            <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </Card>
  );
}
