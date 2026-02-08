const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

async function convertDocxToPng(docxPath, outputPath) {
  try {
    console.log(`Reading DOCX file: ${docxPath}`);
    
    if (!fs.existsSync(docxPath)) {
      console.error(`Error: File not found: ${docxPath}`);
      process.exit(1);
    }
    
    // First, try to extract images directly
    console.log('Extracting images from DOCX...');
    const images = [];
    
    try {
      // Mammoth can use path directly in Node.js
      const result = await mammoth.convertToHtml({ path: docxPath }, {
        convertImage: mammoth.images.imgElement((image) => {
          return image.read('base64').then((imageBuffer) => {
            const imageData = {
              src: `data:${image.contentType};base64,${imageBuffer}`,
              contentType: image.contentType,
              buffer: Buffer.from(imageBuffer, 'base64')
            };
            images.push(imageData);
            return { src: imageData.src };
          });
        })
      });
      
      console.log(`Found ${images.length} image(s) in the DOCX file`);
      
      // If we found images, save the first one as PNG
      if (images.length > 0) {
        const firstImage = images[0];
        console.log(`Saving first image as PNG: ${outputPath}`);
        fs.writeFileSync(outputPath, firstImage.buffer);
        console.log('✅ Image extracted and saved successfully!');
        return;
      }
      
      // If no images, try to convert HTML to image using Playwright
      console.log('No images found, converting HTML to PNG using Playwright...');
      const html = result.value;
      
      // Create HTML file
      const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: white;
      width: 210mm;
      min-height: 297mm;
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    .letterhead-content {
      width: 100%;
      background: white;
    }
    img { max-width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <div class="letterhead-content">
    ${html}
  </div>
</body>
</html>
`;
      
      // Save HTML temporarily
      const tempHtmlPath = path.join(path.dirname(outputPath), 'temp-letterhead.html');
      fs.writeFileSync(tempHtmlPath, fullHtml);
      
      // Use Playwright to convert HTML to PNG
      try {
        const { chromium } = require('playwright');
        console.log('Launching browser...');
        
        const browser = await chromium.launch();
        const page = await browser.newPage();
        
        // Set viewport to A4 size (210mm x 297mm at 96 DPI)
        await page.setViewportSize({
          width: 794,  // 210mm
          height: 1123 // 297mm
        });
        
        // Load the HTML file
        const fileUrl = `file://${tempHtmlPath.replace(/\\/g, '/')}`;
        await page.goto(fileUrl, { waitUntil: 'networkidle' });
        
        // Wait a bit for any dynamic content
        await page.waitForTimeout(500);
        
        // Take screenshot
        console.log(`Saving PNG to: ${outputPath}`);
        await page.screenshot({
          path: outputPath,
          fullPage: true,
          type: 'png'
        });
        
        await browser.close();
        console.log('✅ PNG created successfully!');
        
        // Clean up temp HTML file
        fs.unlinkSync(tempHtmlPath);
        
      } catch (playwrightError) {
        console.error('Playwright conversion failed:', playwrightError.message);
        console.log(`\nHTML file saved to: ${tempHtmlPath}`);
        console.log('You can open this HTML file in a browser and take a screenshot.');
      }
      
    } catch (error) {
      console.error('Error processing DOCX:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error converting DOCX to PNG:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node convert-docx-to-png.js <input.docx> [output.png]');
  console.log('\nExample:');
  console.log('  node convert-docx-to-png.js "public/Letterheads/Fountain Letterhead HRT (1).docx" "public/Letterheads/HRT-Header.png"');
  process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = args[1] 
  ? path.resolve(args[1])
  : path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)) + '.png');

convertDocxToPng(inputPath, outputPath).catch(console.error);
