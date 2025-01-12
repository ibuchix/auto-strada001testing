import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onClose: () => void;
  isSubmitting?: boolean;
}

export const FormActions = ({ onClose, isSubmitting }: FormActionsProps) => {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onClose}
        className="bg-white text-body hover:bg-accent"
      >
        Cancel
      </Button>
      <Button 
        type="submit"
        className="bg-primary text-white hover:bg-primary/90"
        disabled={isSubmitting}
      >
        Get Valuation
      </Button>
    </div>
  );
};