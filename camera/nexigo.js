import NodeWebcam from "node-webcam";
import mic from "mic";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";

// ---------- Webcam Setup ----------
const Webcam = NodeWebcam.create({
  width: 1280,
  height: 720,
  quality: 100,
  device: "/dev/video0",   // Your NexiGo camera
  output: "jpeg",
  callbackReturn: "location"
});

// ---------- Mic Setup ----------
const micInstance = mic({
  rate: "16000",
  channels: "1",
  device: "hw:3,0",   // Your NexiGo mic (from arecord -l)
  debug: false
});

// ---------- Capture Function ----------
async function captureAndSend() {
  const imgFile = `capture_${Date.now()}.jpg`;
  const audioFile = `audio_${Date.now()}.wav`;

  // Capture Image
  await new Promise((resolve, reject) => {
    NodeWebcam.capture(imgFile, Webcam, (err) => {
      if (err) reject(err);
      else {
        console.log("📸 Saved image:", imgFile);
        resolve();
      }
    });
  });

  // Capture 5s Audio
  await new Promise((resolve) => {
    const micInputStream = micInstance.getAudioStream();
    const outputFileStream = fs.WriteStream(audioFile);

    micInputStream.pipe(outputFileStream);
    micInstance.start();

    console.log("🎤 Recording 5 seconds of audio...");
    setTimeout(() => {
      micInstance.stop();
      console.log("🎤 Saved audio:", audioFile);
      resolve();
    }, 5000);
  });

  // Send via POST
  const form = new FormData();
  form.append("photo", fs.createReadStream(imgFile));
  form.append("audio", fs.createReadStream(audioFile));

  const res = await fetch("https://your-backend.com/upload", {
    method: "POST",
    body: form
  });

  console.log("✅ Upload response:", await res.text());
}

// ---------- Run ----------
captureAndSend().catch(console.error);
