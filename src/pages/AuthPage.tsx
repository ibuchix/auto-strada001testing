
/**
 * Created: 2024-08-20
 * Authentication page for login and registration
 */

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useAuth } from "@/components/AuthProvider";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { session } = useAuth();

  // If already logged in, redirect to dashboard
  if (session) {
    return <Navigate to="/seller-dashboard" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#DC143C]">Autostrada</h1>
          <p className="text-muted-foreground mt-2">Seller Portal</p>
        </div>
        
        <Tabs 
          defaultValue="login" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "login" | "register")}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-4">
            <LoginForm onRegisterClick={() => setActiveTab("register")} />
          </TabsContent>
          
          <TabsContent value="register" className="mt-4">
            <RegisterForm onLoginClick={() => setActiveTab("login")} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;
