import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="npm:@types/nodemailer@6.4.14"
import nodemailer from "npm:nodemailer@6.9.9";

const GMAIL_EMAIL = Deno.env.get('GMAIL_EMAIL');
const GMAIL_PASSWORD = Deno.env.get('GMAIL_PASSWORD');

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  attachmentBase64: string;
  attachmentFilename: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html, attachmentBase64, attachmentFilename }: EmailRequest = await req.json();

    if (!GMAIL_EMAIL || !GMAIL_PASSWORD) {
      throw new Error('GMAIL_EMAIL or GMAIL_PASSWORD is not set');
    }

    // Créer le transporteur nodemailer
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true pour 465, false pour les autres ports
      auth: {
        user: GMAIL_EMAIL,
        pass: GMAIL_PASSWORD,
      },
    });

    // Envoyer l'email avec pièce jointe
    const info = await transporter.sendMail({
      from: GMAIL_EMAIL,
      to: to,
      subject: subject,
      html: html,
      attachments: [
        {
          filename: attachmentFilename,
          content: attachmentBase64,
          encoding: "base64",
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    });

    console.log('Email envoyé:', info.messageId);

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
