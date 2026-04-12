import fetch from 'node-fetch';

async function test() {
  try {
    console.log('Testing /api/health...');
    const res = await fetch('http://127.0.0.1:3001/api/health');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

test();
