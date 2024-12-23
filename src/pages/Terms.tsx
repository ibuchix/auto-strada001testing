import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <h1 className="text-5xl font-bold text-center mb-12">
          Terms & Conditions
        </h1>
        <div className="prose prose-lg max-w-4xl mx-auto">
          <h2>1. Introduction</h2>
          <p>
            Welcome to Auto-Strada. By using our service, you agree to these terms and conditions.
          </p>
          
          <h2>2. Services</h2>
          <p>
            Auto-Strada provides a platform connecting car sellers with verified dealers.
          </p>
          
          <h2>3. User Obligations</h2>
          <p>
            Users must provide accurate information and maintain the confidentiality of their account.
          </p>
          
          <h2>4. Privacy</h2>
          <p>
            We respect your privacy and protect your personal information as described in our Privacy Policy.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;