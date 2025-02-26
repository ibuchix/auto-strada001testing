/**
 * Changes made:
 * - 2024-03-19: Initial implementation of listing card component
 * - 2024-03-19: Added support for draft and active states
 * - 2024-03-19: Implemented listing activation functionality
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  status: string;
  isDraft: boolean;
  onStatusChange?: () => void;
}

export const ListingCard = ({ id, title, price, status, isDraft, onStatusChange }: ListingCardProps) => {
  const navigate = useNavigate();

  const activateListing = async () => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ 
          is_draft: false,
          status: 'available'
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Listing activated successfully!");
      if (onStatusChange) onStatusChange();
    } catch (error: any) {
      console.error('Error activating listing:', error);
      toast.error(error.message || "Failed to activate listing");
    }
  };

  return (
    <Card className="p-4 hover:bg-accent/5 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-subtitle text-sm">
            Status: <span className="capitalize">{isDraft ? 'Draft' : status}</span>
          </p>
          <p className="text-primary font-semibold mt-1">
            PLN {price?.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <Button 
              variant="default"
              size="sm"
              onClick={activateListing}
              className="bg-[#21CA6F] hover:bg-[#21CA6F]/90"
            >
              Activate Listing
            </Button>
          )}
          <Button 
            variant="outline"
            size="sm"
            onClick={() => navigate('/sell-my-car', { state: { draftId: id } })}
            className="flex items-center gap-2"
          >
            {isDraft ? 'Continue Editing' : 'View Listing'}
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
