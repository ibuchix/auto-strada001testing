import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CarListingForm } from "@/components/forms/CarListingForm";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SellMyCar = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      toast.error("Please sign in to create a listing");
      navigate("/auth");
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <h1 className="text-5xl font-bold text-center mb-12">
          List Your Car
        </h1>
        <div className="max-w-2xl mx-auto">
          <CarListingForm />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SellMyCar;