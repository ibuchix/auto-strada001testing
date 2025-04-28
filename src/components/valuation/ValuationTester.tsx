
/**
 * A testing interface for the get-vehicle-valuation edge function
 * Created: 2025-04-28
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

export function ValuationTester() {
  const [vin, setVin] = useState('WAUZZZ8K79A090954');
  const [mileage, setMileage] = useState('80000');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    
    try {
      const { data, error } = await supabase.functions.invoke(
        'get-vehicle-valuation',
        {
          body: { 
            vin, 
            mileage: Number(mileage) 
          }
        }
      );
      
      if (error) throw error;
      
      setResult(data);
      toast.success('Valuation retrieved successfully');
      
    } catch (err: any) {
      console.error('Error testing valuation:', err);
      toast.error('Valuation Error', {
        description: err.message || 'Failed to get valuation'
      });
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
        
        <Button 
          onClick={testValuation} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Get Valuation'}
        </Button>
      </div>

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
