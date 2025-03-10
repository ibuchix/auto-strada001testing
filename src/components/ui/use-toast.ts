
/**
 * Changes made:
 * - 2024-06-15: Added proper file header comment
 * - 2024-06-18: Updated to correctly expose Shadcn toast system following recommended pattern
 */

// Re-export the toast hooks from the standard location
import { useToast, toast } from "@/hooks/use-toast";

export { useToast, toast };
