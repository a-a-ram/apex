import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import multer from "multer";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Configure multer to store files temporarily in the operating system's default temp directory
const upload = multer({ dest: os.tmpdir() });

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[Request Log] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// API route: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API route: Upload video directly to Google Drive using a secure Refresh Token flow
app.post("/api/upload-drive", upload.single("video"), async (req, res) => {
  let tempFilePath: string | null = null;
  try {
    const file = req.file;
    const { title, description } = req.body;

    if (!file) {
      return res.json({ success: false, status: 400, error: "No video file uploaded." });
    }

    tempFilePath = file.path;

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || process.env.YOUTUBE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return res.json({
        success: false,
        status: 412,
        error: "Google Drive credentials not fully configured.",
        configured: {
          clientId: !!clientId,
          clientSecret: !!clientSecret,
          refreshToken: !!refreshToken,
        },
        message: "To enable direct automated upload to Google Drive, you must configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in your AI Studio Settings/Environment Variables."
      });
    }

    console.log("Refreshing Google OAuth access token...");
    // Exchange the Refresh Token for a fresh Access Token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Token refresh failed:", errText);
      return res.json({ success: false, status: 400, error: "Failed to authenticate with Google Drive API.", details: errText });
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    console.log("Initializing Google Drive resumable upload session...");
    // Set up standard Google Drive file metadata
    const driveMetadata = {
      name: title ? (title.endsWith(".mp4") || title.endsWith(".mov") || title.endsWith(".webm") ? title : `${title}.mp4`) : `Apex_Ilets_Clip_${Date.now()}.mp4`,
      description: description || "Apex Ilets Warzone clutch gameplay submitted by community members.",
      mimeType: file.mimetype
    };

    // Step 1: Initialize the Resumable upload session with Google Drive APIs
    const initUploadResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": file.size.toString(),
          "X-Upload-Content-Type": file.mimetype,
        },
        body: JSON.stringify(driveMetadata),
      }
    );

    if (!initUploadResponse.ok) {
      const errText = await initUploadResponse.text();
      console.error("Google Drive Resumable initialization failed:", errText);
      return res.json({ success: false, status: initUploadResponse.status, error: "Failed to initiate Google Drive upload session.", details: errText });
    }

    // Retrieve the unique upload session URL from the response Location header
    const uploadUrl = initUploadResponse.headers.get("Location");
    if (!uploadUrl) {
      return res.json({ success: false, status: 500, error: "Failed to retrieve resumable upload URL from Google Drive API headers." });
    }

    console.log("Streaming video payload to Google Drive...");
    // Read the file as a Buffer to send safely
    const videoBuffer = fs.readFileSync(file.path);

    // Step 2: Upload the actual video binary data to the resumable session URL
    const videoUploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": file.size.toString(),
        "Content-Type": file.mimetype,
      },
      body: videoBuffer,
    });

    if (!videoUploadResponse.ok) {
      const errText = await videoUploadResponse.text();
      console.error("Video payload transmission failed:", errText);
      return res.json({ success: false, status: videoUploadResponse.status, error: "Failed to transmit video data to Google Drive.", details: errText });
    }

    const resultData = await videoUploadResponse.json() as { id: string; name: string };
    console.log("Google Drive Upload Complete! File ID:", resultData.id);

    return res.json({
      success: true,
      fileId: resultData.id,
      videoUrl: `https://drive.google.com/file/d/${resultData.id}/view`,
      message: "Tactical Clip successfully uploaded to Google Drive!"
    });

  } catch (error: any) {
    console.error("Unhandled upload error:", error);
    return res.json({ success: false, status: 500, error: "Internal server error occurred during transmission.", details: error.message });
  } finally {
    // Always cleanup the temporary file on the disk
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.warn("Failed to delete temp file:", tempFilePath, err);
      }
    }
  }
});

// Global Error Handler Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Global Server Error]", err);
  res.status(500).json({
    error: "Internal Server Error in tactical backend",
    message: err?.message || "An unexpected server error occurred.",
    details: typeof err === "object" ? JSON.stringify(err) : String(err)
  });
});

// Start the server with Vite middleware support
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
