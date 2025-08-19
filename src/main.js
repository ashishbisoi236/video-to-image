import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Jimp from 'jimp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const videoPath = path.join(__dirname, 'assets', 'test-vid-2.mp4');
const outputImagePath = path.join(__dirname, 'output.png');
const colorsFilePath = path.join(__dirname, 'colors.json');

const frameIntervalSec = 0.5;   // capture every 0.5 seconds
const stripeWidth = 5;        // width of each vertical stripe
const outputHeight = 1080;    // fixed height

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const colors = []; // will store hex codes like "#RRGGBB"

const ffmpegProc = ffmpeg(videoPath)
  .outputOptions([
    `-vf fps=1/${frameIntervalSec},scale=1:1`, // 1 frame → scaled down to 1x1 pixel
    '-f rawvideo',
    '-pix_fmt rgb24'
  ])
  .format('rawvideo')
  .on('end', async () => {
    console.log('✅ Frames processed, building strip...');

    // Build strip with dynamic width
    const stripWidth = colors.length * stripeWidth;
    const strip = new Jimp(stripWidth, outputHeight, 0xFFFFFFFF);

    colors.forEach((hex, index) => {
      const colorInt = Jimp.cssColorToHex(hex); // ✅ hex → int
      for (let x = 0; x < stripeWidth; x++) {
        for (let y = 0; y < outputHeight; y++) {
          strip.setPixelColor(colorInt, index * stripeWidth + x, y);
        }
      }
    });

    await strip.writeAsync(outputImagePath);
    console.log(`✅ Color strip image saved: ${outputImagePath} (${stripWidth}x${outputHeight})`);

    await fs.writeFile(colorsFilePath, JSON.stringify(colors, null, 2));
    console.log(`✅ Color palette saved: ${colorsFilePath}`);
  })
  .on('error', (err) => console.error('Error processing video:', err))
  .pipe();

// Each frame = 3 bytes (R,G,B)
let buffer = Buffer.alloc(0);
ffmpegProc.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);

  while (buffer.length >= 3) {
    const r = buffer[0];
    const g = buffer[1];
    const b = buffer[2];
    buffer = buffer.slice(3);

    const hex = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
    colors.push(hex);
  }
});
