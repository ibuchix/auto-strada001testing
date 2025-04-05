
/**
 * ContactInfo Component
 * - Added 2025-04-05: Created component to display contact information in valuation results
 */

export const ContactInfo = () => {
  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
      <h3 className="text-sm font-medium mb-2">What happens next?</h3>
      <p className="text-sm text-gray-600 mb-2">
        Our platform will guide you through listing your car. 
        After submission, our team will review your listing before 
        it goes live for certified dealers to bid on.
      </p>
      <p className="text-sm text-gray-600">
        You can always call us at <span className="font-medium">+48 123 456 789</span> if you have any questions.
      </p>
    </div>
  );
};
