const API_URL = "https://script.google.com/macros/s/AKfycbxCv7ZheMAbG-hXFblLfQJOvYJJfXIDfAfMdpgNC7atLSSgVxxRvJTaUQJdXc18lTdy7A/exec";

async function getData() {
  try {
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(API_URL)}`;
    const res = await fetch(proxyUrl);
    const data = await res.json();
    console.log("Returned item count:", Array.isArray(data) ? data.length : typeof data);
    if (Array.isArray(data) && data.length > 0) {
      console.log("Sample Book Keys:", Object.keys(data[0]));
      console.log("Sample Book Data:", JSON.stringify(data[0], null, 2));
      console.log("Last Book Data:", JSON.stringify(data[data.length - 1], null, 2));
    } else {
      console.log("Data received:", data);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

getData().then(() => process.exit(0));
