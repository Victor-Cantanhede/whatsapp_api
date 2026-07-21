const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
// Temp storage for uploaded files inside the container
const upload = multer({ dest: '/tmp/ffmpeg-api-uploads/' });

app.post('/convert', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded. Please upload a file with the key "audio".');
  }

  const inputPath = req.file.path;
  const outputPath = path.join('/tmp', `${uuidv4()}.ogg`);

  // FFmpeg command to convert to Opus OGG for WhatsApp PTT
  // -c:a libopus: codec
  // -b:a 32k: bitrate suitable for voice
  // -vbr on: variable bitrate
  // -compression_level 10: high compression quality
  // -ac 1: mono channel (CRITICAL for WhatsApp PTT)
  // -application voip: optimize for voice
  const cmd = `ffmpeg -y -i "${inputPath}" -c:a libopus -b:a 32k -vbr on -compression_level 10 -ac 1 -application voip "${outputPath}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`FFmpeg exec error: ${error.message}`);
      console.error(`FFmpeg stderr: ${stderr}`);
      // Cleanup input file on error
      fs.unlink(inputPath, () => {});
      return res.status(500).send('Error converting file.');
    }
    
    res.download(outputPath, 'audio.ogg', (err) => {
      // Cleanup files after download is complete or aborted
      fs.unlink(inputPath, () => {});
      fs.unlink(outputPath, () => {});
    });
  });
});

app.post('/convert-webp-to-jpg', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded. Please upload a file with the key "image".');
  }

  const inputPath = req.file.path;
  const outputPath = path.join('/tmp', `${uuidv4()}.jpg`);

  // FFmpeg command to convert WebP to JPG
  const cmd = `ffmpeg -y -i "${inputPath}" "${outputPath}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`FFmpeg exec error: ${error.message}`);
      console.error(`FFmpeg stderr: ${stderr}`);
      // Cleanup input file on error
      fs.unlink(inputPath, () => {});
      return res.status(500).send('Error converting file.');
    }
    
    res.download(outputPath, 'image.jpg', (err) => {
      // Cleanup files after download is complete or aborted
      fs.unlink(inputPath, () => {});
      fs.unlink(outputPath, () => {});
    });
  });
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`FFmpeg API listening on port ${PORT}`);
});
