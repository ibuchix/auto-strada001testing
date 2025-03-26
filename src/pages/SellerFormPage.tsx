/**
 * Created: 2025-08-26
 * SellerFormPage component
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { FormContent } from "@/components/forms/car-listing/FormContent";
import { FormSubmissionProvider } from "@/components/forms/car-listing/submission/FormSubmissionProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { RegistrationStatusCheck } from "@/components/auth/recovery/RegistrationStatusCheck";
import { TransactionProvider } from "@/components/transaction/TransactionProvider";

export default function SellerFormPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [diagnosticId] = useState(() => crypto.randomUUID());
  const [activeTab, setActiveTab] = useState<string>("form");
  
  useEffect(() => {
    // Set page title
    document.title = "Create Listing | Autostrada";
    
    // Log page view for analytics
    console.log("Seller form page viewed", { draftId, diagnosticId });
    
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, [draftId, diagnosticId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to create a listing
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground">
              Please sign in or create an account to continue.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate("/auth")}
                className="flex-1"
              >
                Sign In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <RegistrationStatusCheck>
      <TransactionProvider>
        <FormSubmissionProvider userId={session.user.id}>
          <div className="container mx-auto py-4 px-4 md:px-6">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                className="flex items-center gap-2"
                onClick={() => navigate("/dashboard/seller")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
                <TabsList>
                  <TabsTrigger value="form">Listing Form</TabsTrigger>
                  <TabsTrigger value="help">Help & Tips</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button
                variant="outline"
                size="sm"
                className="md:hidden"
                onClick={() => setActiveTab(activeTab === "form" ? "help" : "form")}
              >
                {activeTab === "form" ? (
                  <HelpCircle className="h-4 w-4 mr-2" />
                ) : (
                  <ArrowLeft className="h-4 w-4 mr-2" />
                )}
                {activeTab === "form" ? "Help" : "Back to Form"}
              </Button>
            </div>
            
            <div className="md:hidden mb-4">
              <h1 className="text-2xl font-bold">
                {activeTab === "form" ? "Create Your Listing" : "Help & Tips"}
              </h1>
            </div>
            
            <TabsContent value="form" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-9">
                  <Card>
                    <CardHeader className="hidden md:block">
                      <CardTitle>Create Your Listing</CardTitle>
                      <CardDescription>
                        Fill out the form below to create your car listing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormContent 
                        session={session} 
                        draftId={draftId} 
                        diagnosticId={diagnosticId}
                      />
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-3">
                  <div className="space-y-6 sticky top-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tips for Success</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          <li>Add clear, high-quality photos</li>
                          <li>Be honest about the car's condition</li>
                          <li>Include all relevant details</li>
                          <li>Set a competitive price</li>
                          <li>Respond quickly to inquiries</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Need Help?</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Our support team is available to assist you with any questions.
                        </p>
                        <Button variant="outline" className="w-full">
                          Contact Support
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="help" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Help & Tips for Creating a Great Listing</CardTitle>
                  <CardDescription>
                    Follow these guidelines to maximize your chances of selling quickly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Taking Great Photos</h3>
                    <p className="text-muted-foreground">
                      Good photos are crucial for attracting buyers. Here are some tips:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Take photos in good lighting, preferably daylight</li>
                      <li>Clean the car thoroughly before photographing</li>
                      <li>Capture all angles: front, rear, sides, interior</li>
                      <li>Include close-ups of special features</li>
                      <li>Show any damage honestly</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Writing an Effective Description</h3>
                    <p className="text-muted-foreground">
                      A good description helps buyers understand what makes your car special:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Be honest about the condition</li>
                      <li>Mention recent maintenance or upgrades</li>
                      <li>Include service history information</li>
                      <li>Describe how the car drives</li>
                      <li>Explain your reason for selling</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Pricing Your Car</h3>
                    <p className="text-muted-foreground">
                      Setting the right price is key to attracting serious buyers:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Research similar cars on the market</li>
                      <li>Consider your car's condition, mileage, and history</li>
                      <li>Be realistic about the value</li>
                      <li>Leave some room for negotiation</li>
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={() => setActiveTab("form")}
                    className="mt-4"
                  >
                    Back to Form
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </FormSubmissionProvider>
      </TransactionProvider>
    </RegistrationStatusCheck>
  );
}
