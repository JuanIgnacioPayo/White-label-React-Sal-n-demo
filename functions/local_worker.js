const { google } = require('googleapis');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const youtubedl = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config({ path: '.env.local' });

// Configuration
const PROJECT_ID = process.env.PROJECT_ID || "melishare-redirect-payo";
const RECEIVE_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/receiveMorenoSummary`;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "demo-salon-secret-key";

// Initialize services
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

async function searchLatestMorenoVideo() {
    console.log("Searching for latest Guillermo Moreno video...");
    const youtube = google.youtube({
        version: 'v3',
        auth: process.env.CALENDAR_API_KEY
    });

    try {
        const response = await youtube.search.list({
            part: 'snippet',
            q: 'Guillermo Moreno',
            type: 'video',
            maxResults: 1,
            order: 'date',
            relevanceLanguage: 'es'
        });

        if (response.data.items.length === 0) return null;
        return response.data.items[0];
    } catch (error) {
        console.error("Error searching YouTube:", error.message);
        return null;
    }
}

async function runWorker() {
    try {
        console.log("--- Starting Local Worker ---");

        // 1. Find Video
        const video = await searchLatestMorenoVideo();
        if (!video) {
            console.log("No video found.");
            return;
        }
        const videoId = video.id.videoId;
        console.log(`Found video: ${video.snippet.title} (${videoId})`);


        const ffmpegDir = path.dirname(ffmpegPath);
        // Ensure ffprobe is discoverable. 
        // We will pass the specific path if possible, but yt-dlp expects --ffmpeg-location to be a directory or exe.
        // If exe, it looks for ffprobe in same dir.
        // ffmpeg-static and ffprobe-static might be in different dirs.
        // Let's copy/symlink them to a temp bin dir to be safe.
        const binDir = path.join(os.tmpdir(), 'yt-dlp-bin');
        if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });

        const localFfmpeg = path.join(binDir, (os.platform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'));
        const localFfprobe = path.join(binDir, (os.platform() === 'win32' ? 'ffprobe.exe' : 'ffprobe'));

        const sourceFfmpeg = ffmpegPath;
        const sourceFfprobe = require('ffprobe-static').path;

        console.log(`[DEBUG] ffmpeg source: ${sourceFfmpeg}`);
        console.log(`[DEBUG] ffprobe source: ${sourceFfprobe}`);
        console.log(`[DEBUG] binDir: ${binDir}`);

        if (!fs.existsSync(localFfmpeg)) {
            console.log(`[DEBUG] Copying ffmpeg...`);
            fs.copyFileSync(sourceFfmpeg, localFfmpeg);
        }
        if (!fs.existsSync(localFfprobe)) {
            console.log(`[DEBUG] Copying ffprobe...`);
            fs.copyFileSync(sourceFfprobe, localFfprobe);
        }

        const baseOutput = path.join(os.tmpdir(), `moreno_local_${videoId}`);
        const expectedOutput = `${baseOutput}.mp3`;

        // Cleanup previous attempts
        try { fs.unlinkSync(expectedOutput); } catch (e) { }
        try { fs.unlinkSync(baseOutput + '.webm'); } catch (e) { }
        try { fs.unlinkSync(baseOutput + '.m4a'); } catch (e) { } // Common formats

        console.log(`[DEBUG] ffmpeg exists: ${fs.existsSync(localFfmpeg)} Size: ${fs.statSync(localFfmpeg).size}`);
        console.log(`[DEBUG] ffprobe exists: ${fs.existsSync(localFfprobe)} Size: ${fs.statSync(localFfprobe).size}`);

        console.log(`Downloading audio to ${expectedOutput}...`);

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        await youtubedl(videoUrl, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: baseOutput + '.%(ext)s',
            noCheckCertificates: true,
            preferFreeFormats: true,
            ffmpegLocation: localFfmpeg, // Point to executable directly
            noWarnings: true,
            extractorArgs: "youtube:player_client=default,ios"
        });

        // Verify file exists
        if (!fs.existsSync(expectedOutput)) {
            throw new Error(`Output file not found at ${expectedOutput}`);
        }
        console.log("Download complete.");

        // 3. Upload to Gemini
        console.log("Uploading to Gemini...");
        const uploadResponse = await fileManager.uploadFile(expectedOutput, {
            mimeType: "audio/mp3",
            displayName: "Local Worker Audio",
        });

        // 4. Generate Summary
        console.log("Generating summary with Gemini 2.5 Pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri
                }
            },
            { text: "Actúa como analista político. Escucha este audio de Guillermo Moreno. Resume las ideas económicas y políticas más importantes que menciona. Tono informativo. Máximo 200 palabras." }
        ]);

        const summary = result.response.text();
        console.log("\nSummary Generated:\n", summary.substring(0, 100) + "...");

        // 5. Send to Server
        console.log("Uploading summary to Firebase...");
        const response = await fetch(RECEIVE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': ADMIN_SECRET
            },
            body: JSON.stringify({
                summary: summary,
                date: new Date().toISOString().split('T')[0]
            })
        });

        if (response.ok) {
            console.log("SUCCESS: Summary saved to database.");
        } else {
            console.error("FAILED to save summary:", await response.text());
        }

        // Cleanup
        try { fs.unlinkSync(expectedOutput); } catch (e) { }
        await fileManager.deleteFile(uploadResponse.file.name);

    } catch (error) {
        console.error("Worker failed:", error);
    }
}

runWorker();
