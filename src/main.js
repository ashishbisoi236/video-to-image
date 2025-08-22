import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ytdl from '@distube/ytdl-core';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Jimp from 'jimp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const youtubeUrl = 'https://www.youtube.com/watch?v=gxJk9qmjIfY';
const outputImagePath = path.join(__dirname, 'output.png');
const outputColorsPath = path.join(__dirname, 'colors.json');

// config
const frameIntervalSec = 0.5;   // extract every 2 seconds
const outputHeight = 1080;    // fixed height (1080p)
const stripeWidth = 5;        // each frame → stripe of 5px
const colors = [];

ffmpeg.setFfmpegPath(ffmpegPath);

// const info = await ytdl.getInfo(youtubeUrl);
// console.log(info.formats.map(f => ({ itag: f.itag, quality: f.qualityLabel, mime: f.mimeType })));

// step 1: create a readable stream from YouTube
const videoStream = ytdl(youtubeUrl, {
  quality: '18',
  // filter: 'videoonly',
  requestOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  }
});

videoStream.on('error', (err) => {
  console.error('ytdl error:', err);
});

// step 2: pipe it into ffmpeg
const ffmpegProc = ffmpeg(videoStream)
  // .inputOptions([`-reconnect 1`, `-reconnect_streamed 1`, `-reconnect_delay_max 2`]) // not needed for ytdl
  .outputOptions([
    `-vf fps=1/${frameIntervalSec},scale=1:1`, // 1 pixel per frame → average color
    `-f rawvideo`,                             // raw bytes
    `-pix_fmt rgb24`                           // RGB format
  ])
  .format('rawvideo')
  .on('error', (err) => {
    console.error('FFmpeg error:', err);
  })
  .on('end', async () => {
    console.log('Video processing finished.');
    console.log(`Total frames processed: ${colors.length}`);

    // build final strip image
    const stripWidth = colors.length * stripeWidth;
    const colorStrip = new Jimp(stripWidth, outputHeight, 0xFFFFFFFF);

    colors.forEach((hex, index) => {
      for (let x = 0; x < stripeWidth; x++) {
        for (let y = 0; y < outputHeight; y++) {
          colorStrip.setPixelColor(hex, index * stripeWidth + x, y);
        }
      }
    });

    await colorStrip.writeAsync(outputImagePath);
    await fs.writeFile(outputColorsPath, JSON.stringify(colors, null, 2));

    console.log(`✅ Image saved at ${outputImagePath}`);
    console.log(`✅ Colors saved at ${outputColorsPath}`);
  })
  .pipe();

// step 3: collect frame colors
ffmpegProc.on('data', (chunk) => {
  if (chunk.length === 3) {
    const r = chunk[0];
    const g = chunk[1];
    const b = chunk[2];
    const hex = Jimp.rgbaToInt(r, g, b, 255);
    colors.push(hex);
  }
});
