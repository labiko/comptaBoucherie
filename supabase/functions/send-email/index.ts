import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="npm:@types/nodemailer@6.4.14"
import nodemailer from "npm:nodemailer@6.9.9";

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  // Support pour un seul attachement (rétrocompatibilité)
  attachmentBase64?: string;
  attachmentFilename?: string;
  // Support pour plusieurs attachements
  attachments?: Array<{ content: string; filename: string }>;
  // Credentials SMTP spécifiques à la boucherie (obligatoires)
  smtpEmail: string;
  smtpPassword: string;
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
    const { to, subject, html, attachmentBase64, attachmentFilename, attachments, smtpEmail, smtpPassword }: EmailRequest = await req.json();

    // Vérifier que les credentials SMTP sont fournis
    if (!smtpEmail || !smtpPassword) {
      throw new Error('Email et mot de passe SMTP de la boucherie sont obligatoires');
    }

    // Créer le transporteur nodemailer avec les credentials de la boucherie
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true pour 465, false pour les autres ports
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    // Préparer les attachements
    let emailAttachments = [];

    // Si plusieurs attachements sont fournis (nouveau format)
    if (attachments && attachments.length > 0) {
      emailAttachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: "base64",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }));
    }
    // Sinon, utiliser l'ancien format (rétrocompatibilité)
    else if (attachmentBase64 && attachmentFilename) {
      emailAttachments = [
        {
          filename: attachmentFilename,
          content: attachmentBase64,
          encoding: "base64",
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ];
    }

    // Envoyer l'email avec pièce(s) jointe(s)
    const info = await transporter.sendMail({
      from: smtpEmail,
      to: to,
      subject: subject,
      html: html,
      attachments: emailAttachments,
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
