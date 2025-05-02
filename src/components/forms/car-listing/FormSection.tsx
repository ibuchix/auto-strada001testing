
/**
 * Form Section Component
 * Created: 2025-05-02
 * 
 * Provides consistent section styling for the car listing form
 */

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const FormSection = ({ title, subtitle, children }: FormSectionProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-oswald">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};
