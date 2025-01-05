import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, DollarSign, Users, Bell } from "lucide-react";

interface DashboardStatsProps {
  activeListings: number;
}

export const DashboardStats = ({ activeListings }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xl font-semibold text-dark">Active Listings</CardTitle>
          <Car className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-dark">{activeListings}</div>
          <p className="text-sm text-subtitle mt-1">Cars currently listed</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:200ms]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xl font-semibold text-dark">Total Bids</CardTitle>
          <DollarSign className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-dark">0</div>
          <p className="text-sm text-subtitle mt-1">Bids received</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:400ms]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xl font-semibold text-dark">Potential Buyers</CardTitle>
          <Users className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-dark">0</div>
          <p className="text-sm text-subtitle mt-1">Interested dealers</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in [animation-delay:600ms]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xl font-semibold text-dark">Updates</CardTitle>
          <Bell className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-dark">0</div>
          <p className="text-sm text-subtitle mt-1">New notifications</p>
        </CardContent>
      </Card>
    </div>
  );
};