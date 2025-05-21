
/**
 * Car Details Section Component
 * Created: 2025-05-21
 * 
 * This component displays detailed information about a car listing,
 * including its history and ownership record.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CarHistoryTimeline } from '@/components/dashboard/CarHistoryTimeline';
import { Separator } from '@/components/ui/separator';
import { Calendar, FileText, History } from 'lucide-react';

interface CarDetailsSectionProps {
  car: any;
}

export function CarDetailsSection({ car }: CarDetailsSectionProps) {
  if (!car) return null;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Listing Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Information
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Vehicle Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Make</p>
                    <p>{car.make || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p>{car.model || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p>{car.year || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">VIN</p>
                    <p>{car.vin || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mileage</p>
                    <p>{car.mileage ? `${car.mileage.toLocaleString()} km` : 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transmission</p>
                    <p>{car.transmission || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Listing Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p>{car.status || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Is Draft</p>
                    <p>{car.is_draft ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {car.created_at ? new Date(car.created_at).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {car.updated_at ? new Date(car.updated_at).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Seller Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Seller Name</p>
                    <p>{car.seller_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile Number</p>
                    <p>{car.mobile_number || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            {car.id ? (
              <CarHistoryTimeline carId={car.id} />
            ) : (
              <p className="text-muted-foreground">No history available for this listing</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
