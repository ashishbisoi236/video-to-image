# Video to Image Color Extractor

This project processes a video file to extract colors from every other frame and generates an image with a colored strip representing those colors.

## Project Structure

```
video-to-image
├── src
│   ├── main.js                # Entry point of the application
│   ├── assets
│        └── sample-video.mp4   # Sample video file for processing
│   
├── package.json                # npm configuration file
└── README.md                   # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd video-to-image
   ```

2. Install the required dependencies:
   ```
   npm install
   ```

## Usage

To run the application, execute the following command:
```
node src/main.js
```

This will process the `sample-video.mp4` file located in the `src/assets` directory, extract colors from every other frame, and generate an output image with a colored strip.

## Dependencies

This project requires the following npm packages:
- `fluent-ffmpeg`: For video processing.
- `jimp`: For image manipulation.

Make sure to install these packages by running `npm install` as mentioned in the Installation section.

## License

This project is licensed under the MIT License.