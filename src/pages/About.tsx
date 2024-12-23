import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-12">
            About Auto-Strada
          </h1>
          <div className="prose prose-lg mx-auto">
            <p className="lead text-xl text-subtitle mb-8">
              Auto-Strada is revolutionizing the way people sell their cars by connecting sellers directly with verified dealers.
            </p>
            
            <h2>Our Mission</h2>
            <p>
              To provide a transparent, efficient, and trustworthy platform for selling cars that benefits both sellers and dealers.
            </p>
            
            <h2>Our Values</h2>
            <ul>
              <li>Transparency in all transactions</li>
              <li>Fair pricing for sellers</li>
              <li>Quality service for all users</li>
              <li>Innovation in the auto industry</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;