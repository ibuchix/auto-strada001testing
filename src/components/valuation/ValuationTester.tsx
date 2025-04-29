
/**
 * A testing interface for the get-vehicle-valuation edge function
 * Created: 2025-04-28
 * Updated: 2025-04-29 - Added gearbox parameter to fix 400 Bad Request error
 * Updated: 2025-04-30 - Enhanced error handling to display detailed API errors
 * Updated: 2025-05-01 - Fixed FunctionsHttpError handling to use context.json()
 * Updated: 2025-05-02 - Fixed TypeScript error by using 'code' property instead of 'status'
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
            gearbox
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
          <h3 className="text-lg font-semibold mb-2">Result:</h3>
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
