
/**
 * Car History Timeline Component
 * Created: 2025-05-21
 * 
 * Displays a timeline of car ownership and status changes
 */

import React from 'react';
import { useCarHistory } from '@/hooks/useCarHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { 
  Timeline, 
  TimelineItem, 
  TimelineConnector, 
  TimelineContent, 
  TimelineDot, 
  TimelineSeparator 
} from '@/components/ui/timeline';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertCircle, FileHistory, User, CheckCircle2, Tag } from 'lucide-react';

interface CarHistoryTimelineProps {
  carId: string;
}

export function CarHistoryTimeline({ carId }: CarHistoryTimelineProps) {
  const { data: history, isLoading, error } = useCarHistory(carId);
  
  if (isLoading) {
    return (
      <div className="py-4">
        <h3 className="text-lg font-medium mb-4">Listing History</h3>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 mb-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-80" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load listing history. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!history || history.length === 0) {
    return (
      <Alert>
        <FileHistory className="h-4 w-4" />
        <AlertTitle>No History</AlertTitle>
        <AlertDescription>
          No history records found for this listing.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Get icon for change type
  const getIcon = (changeType: string) => {
    switch (changeType) {
      case 'published':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'status_changed':
        return <Tag className="h-4 w-4" />;
      case 'ownership_changed':
        return <User className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  // Get color for change type
  const getColor = (changeType: string) => {
    switch (changeType) {
      case 'published':
        return 'bg-green-500';
      case 'status_changed':
        return 'bg-blue-500';
      case 'ownership_changed':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Format the event description
  const getEventDescription = (event: any) => {
    switch (event.change_type) {
      case 'published':
        return 'Listing was published';
      case 'status_changed':
        return `Status changed from "${event.previous_status || 'unknown'}" to "${event.new_status || 'unknown'}"`;
      case 'ownership_changed':
        return 'Ownership was transferred';
      default:
        return 'Listing was updated';
    }
  };
  
  return (
    <div className="py-4">
      <h3 className="text-lg font-medium mb-4">Listing History</h3>
      <Timeline position="right">
        {history.map((event, index) => (
          <TimelineItem key={index}>
            <TimelineSeparator>
              <TimelineDot className={getColor(event.change_type)}>
                {getIcon(event.change_type)}
              </TimelineDot>
              {index < history.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <div className="ml-2">
                <p className="font-medium">{getEventDescription(event)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(event.change_time), { addSuffix: true })}
                </p>
                {event.is_draft !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Draft status: {event.is_draft ? 'Yes' : 'No'}
                  </p>
                )}
              </div>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  );
}
