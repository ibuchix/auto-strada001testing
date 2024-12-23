import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <h1 className="text-5xl font-bold text-center mb-12">
          Privacy Policy
        </h1>
        <div className="prose prose-lg max-w-4xl mx-auto">
          <h2>1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, including personal information such as your name, email address, and vehicle details.
          </p>
          
          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide and improve our services, communicate with you, and ensure a secure platform.
          </p>
          
          <h2>3. Information Sharing</h2>
          <p>
            We share your information with dealers only when necessary to provide our services and with your consent.
          </p>
          
          <h2>4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;