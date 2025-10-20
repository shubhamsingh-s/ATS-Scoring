// backend/scripts/test_py_model_http.js
const fs = require('fs');
const FormData = require('form-data');
const http = require('http');
const url = require('url');

async function test(pyUrl, filePath, jobDesc='Software engineer with Python and Node') {
  const parsed = url.parse(pyUrl);
  const isHttps = parsed.protocol === 'https:';
  const form = new FormData();
  form.append('resume', fs.createReadStream(filePath));
  form.append('job_description', jobDesc);

  const options = {
    method: 'POST',
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path: parsed.path,
    headers: form.getHeaders()
  };

  const lib = isHttps ? require('https') : require('http');

  const resObj = await new Promise((resolve, reject) => {
    const req = lib.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({status: res.statusCode, body: JSON.parse(body)}); }
        catch(e) { reject(new Error('Invalid JSON: ' + e.message + ' -- raw: ' + body)); }
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });

  console.log('Response status:', resObj.status);
  console.log('Body:', JSON.stringify(resObj.body, null, 2));
}

const pyUrl = process.argv[2] || 'http://127.0.0.1:8000/api/score';
const filePath = process.argv[3] || '../ats-model/ATS-Scoring-System-main/uploads/John_Doe_Resume.docx';

test(pyUrl, filePath).catch(err => { console.error(err); process.exit(1); });
