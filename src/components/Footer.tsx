
/**
 * Footer component
 * Updated: 2025-06-14 - Removed links to deleted pages (DealerSignup, Dealers, DealerDashboard, About, Contact, Sellers, SellMyCar, Terms)
 */
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-secondary text-gray-400 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <img 
                src="/lovable-uploads/ec37d903-42de-41e2-a982-e7ae5574a837.png" 
                alt="Auto-Strada Logo" 
                className="h-14" 
              />
            </div>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">About Auto-Strada</h3>
            <ul className="space-y-2">
              {/* Deleted About Us and Contact links */}
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Selling your car</h3>
            <ul className="space-y-2">
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
              {/* Sell my car link deleted */}
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">For dealers</h3>
            <ul className="space-y-2">
              {/* Dealer signup page deleted */}
              {/* Terms and Privacy links updated */}
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm mb-4 md:mb-0">
              © Auto-Strada {new Date().getFullYear()}. All rights reserved.
            </div>
            <div className="flex space-x-4 text-sm">
              {/* Terms link deleted */}
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
