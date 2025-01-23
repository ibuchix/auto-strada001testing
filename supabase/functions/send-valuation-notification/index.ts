import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValuationEmailRequest {
  userEmail: string;
  vehicleDetails: {
    make: string;
    model: string;
    year: number;
    vin: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, vehicleDetails }: ValuationEmailRequest = await req.json();

    // Send confirmation email to user
    const userEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Auto-Strada <admin@auto-strada.pl>",
        to: [userEmail],
        subject: "Your Vehicle Valuation Request - Auto-Strada",
        html: `
          <h1>Thank You for Your Valuation Request</h1>
          <p>We've received your request for a valuation of your ${vehicleDetails.year} ${vehicleDetails.make} ${vehicleDetails.model}.</p>
          <p>Our expert team will carefully review your submission and provide a detailed valuation within 24-48 hours.</p>
          <h2>Vehicle Details:</h2>
          <ul>
            <li>Make: ${vehicleDetails.make}</li>
            <li>Model: ${vehicleDetails.model}</li>
            <li>Year: ${vehicleDetails.year}</li>
            <li>VIN: ${vehicleDetails.vin}</li>
          </ul>
          <p>If you have any questions in the meantime, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Auto-Strada Team</p>
        `,
      }),
    });

    // Send notification to valuation team
    const teamEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Auto-Strada System <admin@auto-strada.pl>",
        to: ["valuations@auto-strada.pl"], // Replace with your team's email
        subject: "New Manual Valuation Request",
        html: `
          <h1>New Manual Valuation Request Received</h1>
          <p>A new manual valuation request has been submitted.</p>
          <h2>Vehicle Details:</h2>
          <ul>
            <li>Make: ${vehicleDetails.make}</li>
            <li>Model: ${vehicleDetails.model}</li>
            <li>Year: ${vehicleDetails.year}</li>
            <li>VIN: ${vehicleDetails.vin}</li>
          </ul>
          <p>Customer Email: ${userEmail}</p>
          <p>Please review and process this request within the next 24-48 hours.</p>
        `,
      }),
    });

    if (!userEmailResponse.ok || !teamEmailResponse.ok) {
      throw new Error("Failed to send one or more emails");
    }

    return new Response(
      JSON.stringify({ message: "Notification emails sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-valuation-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send notifications" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);