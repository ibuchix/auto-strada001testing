import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "How does Auto-Strada work?",
      answer: "Auto-Strada connects car sellers with verified dealers who compete to give you the best price for your vehicle. Simply enter your registration, receive instant valuation, and get offers from our network of trusted dealers."
    },
    {
      question: "Is the service free to use?",
      answer: "Yes, our service is completely free for sellers. We make our money by charging a small commission to dealers when they successfully purchase a vehicle."
    },
    {
      question: "How long does the process take?",
      answer: "The initial valuation is instant. Once your car is listed, you typically receive offers within 24-48 hours. The entire process from listing to sale usually takes 3-5 days."
    },
    {
      question: "Are the dealers verified?",
      answer: "Yes, all dealers on our platform are thoroughly vetted and must maintain high standards of service to continue using our platform."
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-20 mt-20">
        <h1 className="text-5xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h1>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;