
/**
 * A testing interface for the get-vehicle-valuation edge function
 * Created: 2025-04-28
 * Updated: 2025-04-29 - Added gearbox parameter to fix 400 Bad Request error
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
      
      // Use the raw fetch API to get more details on errors
      const functionUrl = `${supabase.functions.url}/get-vehicle-valuation`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token || ''}`,
        },
        body: JSON.stringify({ 
          vin, 
          mileage: Number(mileage), 
          gearbox
        })
      });
      
      // Log raw response information before processing
      console.log('🚦 Response status:', response.status);
      console.log('🚦 Response status text:', response.statusText);
      
      const responseText = await response.text();
      console.log('📦 Raw response body:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('📦 Parsed response data:', responseData);
      } catch (parseError) {
        console.error('📦 Failed to parse response as JSON:', parseError);
        setErrorDetails(`Failed to parse response: ${responseText}`);
        throw new Error('Invalid JSON response from server');
      }
      
      // Check for error in the response
      if (!response.ok) {
        console.error('🚫 Error response:', responseData);
        const errorMessage = responseData?.error || response.statusText || 'Unknown error';
        setErrorDetails(JSON.stringify(responseData, null, 2));
        throw new Error(errorMessage);
      }
      
      // Success path
      setResult(responseData);
      toast.success('Valuation retrieved successfully');
      
    } catch (err: any) {
      console.error('❌ Error testing valuation:', err);
      toast.error('Valuation Error', {
        description: err.message || 'Failed to get valuation'
      });
      
      if (!errorDetails && err.message) {
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
