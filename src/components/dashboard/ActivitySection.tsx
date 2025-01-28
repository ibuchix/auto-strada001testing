import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export const ActivitySection = () => {
  return (
    <Card className="bg-white shadow-md animate-fade-in [animation-delay:1000ms]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-dark">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">No recent activity</h3>
          <p className="text-subtitle">
            Your recent listing and bid activity will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};