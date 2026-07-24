const fs = require('fs');

async function testUpload() {
  console.log("Starting fetch...");
  try {
    const base64Img = 'iVBORw50KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const params = new URLSearchParams();
    params.append('image', base64Img);

    const response = await fetch('https://api.imgbb.com/1/upload?key=c3598d89052a5ec2c640d210a562dfd1', {
      method: 'POST',
      body: params
    });

    const data = await response.json();
    console.log('ImgBB Response status:', response.status);
    console.log('ImgBB Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testUpload().then(() => process.exit(0));
