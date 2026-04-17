import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Route for sending emails
  app.post("/api/send-salary-slip", async (req, res) => {
    const { email, employeeName, month, smtpConfig, pdfBase64 } = req.body;

    console.log(`Received email request for ${employeeName} (${email}) for month ${month}`);

    if (!email || !employeeName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // SMTP configuration: Use provided config or fallback to environment variables
      const host = smtpConfig?.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com";
      const port = parseInt(smtpConfig?.smtpPort || process.env.SMTP_PORT || "587");
      const user = smtpConfig?.smtpUser || process.env.SMTP_USER;
      const pass = smtpConfig?.smtpPass || process.env.SMTP_PASS;

      console.log(`Attempting to send email via ${host}:${port} as ${user}`);

      if (!user || !pass) {
        throw new Error("SMTP credentials (user/pass) are missing. Please configure them in Settings.");
      }

      const transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: port === 465, // true for 465, false for 587
        auth: {
          user: user,
          pass: pass,
        },
        tls: {
          rejectUnauthorized: false // Helps with some self-signed cert issues
        }
      });

      const fromEmail = smtpConfig?.fromEmail || user;
      const mailOptions: any = {
        from: `"HR Department" <${fromEmail}>`,
        to: email,
        subject: `${month} Salary Slip - ${employeeName}`,
        text: `Dear ${employeeName},\n\nPlease find your salary slip for the month of ${month} attached to this email in PDF format.\n\nIf you have any questions regarding your pay, please contact the HR department.\n\nBest Regards,\nHR Department\n\nThis is an automated email. Please do not reply directly to this message.`,
      };

      if (pdfBase64) {
        console.log("Attaching PDF...");
        const base64Data = pdfBase64.includes("base64,") 
          ? pdfBase64.split("base64,")[1] 
          : pdfBase64;
          
        mailOptions.attachments = [
          {
            filename: `SalarySlip_${employeeName.replace(/\s+/g, '_')}_${month.replace(/\s+/g, '_')}.pdf`,
            content: base64Data,
            encoding: "base64",
          },
        ];
      }

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Email error detail:", error);
      let errorMessage = "Failed to send email. Please check your SMTP settings.";
      
      if (error.code === 'EAUTH') {
        errorMessage = "Authentication failed. Please check your SMTP username and App Password.";
      } else if (error.code === 'ESOCKET') {
        errorMessage = "Connection failed. Please check your SMTP host and port.";
      } else if (error.message.includes('oklch')) {
        errorMessage = "PDF generation error: Unsupported color format. Please contact support.";
      } else if (error.message.includes('credentials')) {
        errorMessage = error.message;
      }
      
      res.status(500).json({ error: errorMessage, details: error.message });
    }
  });

  // API Route for testing SMTP connection
  app.post("/api/test-smtp", async (req, res) => {
    const { smtpConfig } = req.body;

    if (!smtpConfig?.smtpUser || !smtpConfig?.smtpPass) {
      return res.status(400).json({ error: "SMTP credentials (user/pass) are missing." });
    }

    try {
      const host = smtpConfig.smtpHost || "smtp.gmail.com";
      const port = parseInt(smtpConfig.smtpPort || "587");
      const user = smtpConfig.smtpUser;
      const pass = smtpConfig.smtpPass;

      console.log(`Testing SMTP connection for ${user} via ${host}:${port}`);

      const transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: port === 465,
        auth: {
          user: user,
          pass: pass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.verify();
      
      // Also try to send a test email to the user themselves
      const fromEmail = smtpConfig.fromEmail || user;
      await transporter.sendMail({
        from: `"Payroll System Test" <${fromEmail}>`,
        to: user,
        subject: "SMTP Connection Test Successful",
        text: "Congratulations! Your SMTP settings are configured correctly and the payroll system can now send emails.",
      });

      res.json({ success: true, message: "SMTP connection verified and test email sent!" });
    } catch (error: any) {
      console.error("SMTP Test error:", error);
      let errorMessage = "SMTP connection failed.";
      
      if (error.code === 'EAUTH') {
        errorMessage = "Authentication failed. Check your username and App Password.";
      } else if (error.code === 'ESOCKET') {
        errorMessage = "Connection failed. Check host and port.";
      }
      
      res.status(500).json({ error: errorMessage, details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
        base: "/",
      });
      app.use(vite.middlewares);
      console.log("Vite development middleware integrated successfully.");
    } catch (error) {
      console.error("Failed to initialize Vite development server:", error);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files from the base path for GitHub Pages compatibility
    app.use("/Pay-Manage/", express.static(distPath));
    // Also serve from root just in case (for Vercel/Netlify)
    app.use(express.static(distPath));
    
    app.get("/Pay-Manage/*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
