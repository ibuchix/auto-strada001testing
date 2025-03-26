
/**
 * Created: 2025-08-26
 * Authentication page
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Autostrada</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account or create a new one</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm onRegisterClick={() => setActiveTab("register")} />
          </TabsContent>
          
          <TabsContent value="register">
            <RegisterForm onLoginClick={() => setActiveTab("login")} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
