const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Common skills list (adapted from Python version)
const COMMON_SKILLS = [
  'python', 'java', 'javascript', 'react', 'node', 'sql', 'html', 'css', 'git', 'docker', 
  'kubernetes', 'aws', 'azure', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'c++', 'c#', 
  'excel', 'linux', 'django', 'flask', 'fastapi', 'scikit-learn', 'mongodb', 'postgresql',
  'redis', 'elasticsearch', 'jenkins', 'ci/cd', 'microservices', 'rest api', 'graphql',
  'typescript', 'angular', 'vue', 'spring', 'express', 'next.js', 'webpack', 'babel'
];

const DEGREE_KEYWORDS = [
  'bachelor', 'b.sc', 'btech', 'b.tech', 'b.e', 'b.eng', 'master', 'm.sc', 'mtech', 
  'm.tech', 'mba', 'phd', 'associate', 'diploma', 'degree', 'engineering', 'computer science'
];

// --- Fuzzy matching utilities ---
// Levenshtein distance and similarity score in [0,1]
function levenshtein(a, b) {
  if (!a || !b) return (a === b) ? 0 : Math.max(a ? a.length : 0, b ? b.length : 0);
  a = a.toLowerCase();
  b = b.toLowerCase();
  const alen = a.length;
  const blen = b.length;
  const dp = Array.from({ length: blen + 1 }, () => new Array(alen + 1).fill(0));
  for (let i = 0; i <= blen; i++) dp[i][0] = i;
  for (let j = 0; j <= alen; j++) dp[0][j] = j;
  for (let i = 1; i <= blen; i++) {
    for (let j = 1; j <= alen; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[blen][alen];
}

function similarity(a, b) {
  a = (a || '').toString().toLowerCase();
  b = (b || '').toString().toLowerCase();
  if (a === b) return 1;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return Math.max(0, 1 - dist / maxLen);
}


// Extract text from PDF
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

// Extract text from DOCX
const extractTextFromDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
};

// Preprocess text
const preprocessText = (text) => {
  if (!text) return '';
  
  // Normalize whitespace and simple cleaning
  text = text.replace(/\r/g, ' ');
  text = text.replace(/\n+/g, ' ');
  text = text.replace(/\s+/g, ' ');
  return text.trim();
};

// Extract emails
const extractEmails = (text) => {
  if (!text) return [];
  const pattern = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
  const emails = text.match(pattern) || [];
  return [...new Set(emails)];
};

// Extract phone numbers
const extractPhones = (text) => {
  if (!text) return [];
  const pattern = /(?:\+\d{1,3}[\s-]?)?(?:\(\d{2,4}\)[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g;
  const phones = text.match(pattern) || [];
  return [...new Set(phones.filter(phone => phone.replace(/\D/g, '').length >= 7))];
};

// Extract LinkedIn profiles
const extractLinkedIn = (text) => {
  if (!text) return [];
  const pattern = /(https?:\/\/)?(www\.)?linkedin\.com\/[\w\-/]+/g;
  const links = text.match(pattern) || [];
  return [...new Set(links)];
};

// Extract skills with fuzzy matching
const extractSkills = (text) => {
  if (!text) return [];
  const textLower = text.toLowerCase();

  // Tokenize resume text into words for fuzzy matching
  const tokens = (textLower.match(/[a-z0-9+#\-]+/g) || []).map(t => t.trim()).filter(Boolean);

  const found = new Map(); // skill -> best similarity

  for (const skill of COMMON_SKILLS) {
    const skillNorm = skill.toLowerCase();

    // exact match first
    const regex = new RegExp(`\\b${skillNorm.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`);
    if (regex.test(textLower)) {
      found.set(skill, 1);
      continue;
    }

    // fuzzy search across tokens and short ngrams
    let best = 0;
    for (let n = 1; n <= Math.min(3, tokens.length); n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        const ngram = tokens.slice(i, i + n).join(' ');
        const sim = similarity(ngram, skillNorm);
        if (sim > best) best = sim;
        if (best >= 0.95) break;
      }
      if (best >= 0.95) break;
    }

    // accept fuzzy matches above threshold 0.7
    if (best >= 0.7) found.set(skill, best);
  }

  return [...found.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([skill]) => skill);
};

// Extract degrees
const extractDegrees = (text) => {
  if (!text) return [];
  const textLower = text.toLowerCase();
  const degrees = DEGREE_KEYWORDS.filter(degree => textLower.includes(degree));
  return [...new Set(degrees)];
};

// Extract designation/title
const extractDesignation = (text) => {
  if (!text) return [];
  const parts = text.split(/[\n\r]+/);
  const candidates = [];
  
  for (let i = 0; i < Math.min(6, parts.length); i++) {
    const part = parts[i];
    const words = part.split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && part.length < 60) {
      candidates.push(part.trim());
    }
  }
  
  return [...new Set(candidates)];
};

// Extract job keywords
const extractJobKeywords = (text, topK = 30) => {
  if (!text) return new Set();
  
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'will', 'from', 'into', 'using', 'use',
    'required', 'required.', 'a', 'an', 'to', 'of', 'in', 'on', 'by', 'as', 'be'
  ]);
  
  // Extract tokens
  const tokens = text.toLowerCase().match(/[A-Za-z0-9+#\-]+/g) || [];
  const filteredTokens = tokens.filter(token => token.length > 2 && !stopWords.has(token));
  
  // Prioritize known skills
  const textLower = text.toLowerCase();
  const skillsInJob = [];
  
  for (const skill of COMMON_SKILLS) {
    if (skill.includes(' ')) {
      if (textLower.includes(skill)) {
        skillsInJob.push(skill);
      }
    } else {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      if (regex.test(textLower)) {
        skillsInJob.push(skill);
      }
    }
  }
  
  // Extract n-grams (2-3 grams)
  const ngrams = new Set();
  const words = filteredTokens;
  
  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(' ');
      ngrams.add(ngram);
    }
  }
  
  // Get top frequent tokens
  const freq = {};
  filteredTokens.forEach(token => {
    freq[token] = (freq[token] || 0) + 1;
  });
  
  const topTokens = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([token]) => token);
  
  return new Set([...skillsInJob, ...topTokens, ...ngrams]);
};

// Extract all entities
const extractAllEntities = (text) => {
  const processedText = preprocessText(text);
  
  return {
    EMAIL: extractEmails(processedText),
    PHONE: extractPhones(processedText),
    LINKEDIN: extractLinkedIn(processedText),
    SKILLS: extractSkills(processedText),
    DEGREE: extractDegrees(processedText),
    DESIGNATION: extractDesignation(processedText)
  };
};

// Compute ATS score
const computeATSScore = (resumeText, jobText) => {
  const processedResumeText = preprocessText(resumeText);
  const processedJobText = preprocessText(jobText);
  
  const resumeEntities = extractAllEntities(processedResumeText);
  const jobEntities = extractAllEntities(processedJobText);
  
  const jobKeywords = extractJobKeywords(processedJobText);
  const resumeTokens = new Set(processedResumeText.toLowerCase().match(/[A-Za-z0-9+#\-]+/g) || []);
  
  // Component scores
  const components = {};
  
  // Skills component
  const jobSkills = jobEntities.SKILLS || [];
  const resumeSkills = resumeEntities.SKILLS || [];
  
  if (jobSkills.length > 0) {
    // Attempt exact matches first, then fuzzy-match remaining required skills
    const matched = [];
    let totalMatchWeight = 0;
    for (const reqSkill of jobSkills) {
      if (resumeSkills.includes(reqSkill)) {
        matched.push({ skill: reqSkill, similarity: 1 });
        totalMatchWeight += 1;
        continue;
      }

      // fuzzy match against resume skills and tokens
      let bestSim = 0;
      // check resumeSkills (which are normalized common skills)
      for (const r of resumeSkills) {
        const sim = similarity(reqSkill, r);
        if (sim > bestSim) bestSim = sim;
        if (bestSim >= 0.99) break;
      }
      // if still low, check resume tokens as fallback
      if (bestSim < 0.75) {
        const tokens = Array.from(resumeTokens || []);
        for (const tok of tokens) {
          const sim = similarity(reqSkill, tok);
          if (sim > bestSim) bestSim = sim;
          if (bestSim >= 0.95) break;
        }
      }

      if (bestSim >= 0.7) {
        matched.push({ skill: reqSkill, similarity: Math.round(bestSim * 100) / 100 });
        totalMatchWeight += bestSim;
      }
    }

    const skillScore = Math.round(((totalMatchWeight / jobSkills.length) * 100) * 100) / 100;
    components.skills = {
      match: matched.map(m => m.skill),
      required: jobSkills,
      score: skillScore,
      details: matched
    };
  } else {
    components.skills = { match: [], required: [], score: null };
  }
  
  // Degree component
  const jobDegrees = jobEntities.DEGREE || [];
  const resumeDegrees = resumeEntities.DEGREE || [];
  
  if (jobDegrees.length > 0) {
    const matchedDegrees = jobDegrees.filter(degree => 
      resumeDegrees.some(resumeDegree => resumeDegree.includes(degree))
    );
    components.degree = {
      match: matchedDegrees,
      required: jobDegrees,
      score: Math.round((matchedDegrees.length / jobDegrees.length) * 100 * 100) / 100
    };
  } else {
    components.degree = { match: [], required: [], score: null };
  }
  
  // Designation/title component
  const jobTitleTokens = new Set(processedJobText.toLowerCase().match(/[A-Za-z0-9]+/g) || []);
  const resumeTitles = resumeEntities.DESIGNATION || [];
  
  if (resumeTitles.length > 0 && jobTitleTokens.size > 0) {
    const titleTokens = new Set();
    resumeTitles.forEach(title => {
      const tokens = title.toLowerCase().match(/[A-Za-z0-9]+/g) || [];
      tokens.forEach(token => titleTokens.add(token));
    });
    
    const intersection = new Set([...jobTitleTokens].filter(token => titleTokens.has(token)));
    components.designation = {
      match_count: intersection.size,
      score: Math.round((intersection.size / Math.max(1, jobTitleTokens.size)) * 100 * 100) / 100
    };
  } else {
    components.designation = { match_count: 0, score: null };
  }
  
  // Keyword match component
  if (jobKeywords.size > 0) {
    const matchedKeywords = [...jobKeywords].filter(keyword => 
      processedResumeText.toLowerCase().includes(keyword) || resumeTokens.has(keyword)
    );
    components.keywords = {
      required: [...jobKeywords],
      matched: matchedKeywords,
      score: Math.round((matchedKeywords.length / jobKeywords.size) * 100 * 100) / 100
    };
  } else {
    components.keywords = { required: [], matched: [], score: null };
  }
  
  // Contact completeness
  const contactFields = ['EMAIL', 'PHONE', 'LINKEDIN'];
  const presentFields = contactFields.filter(field => resumeEntities[field] && resumeEntities[field].length > 0);
  components.contact = {
    present: presentFields,
    score: Math.round((presentFields.length / contactFields.length) * 100 * 100) / 100
  };
  
  // Calculate final score
  const weights = {
    skills: 0.45,
    keywords: 0.25,
    degree: 0.15,
    designation: 0.1,
    contact: 0.05
  };
  
  const availableWeights = {};
  Object.keys(weights).forEach(key => {
    const score = components[key]?.score;
    if (score !== null && score !== undefined) {
      availableWeights[key] = weights[key];
    }
  });
  
  const totalWeight = Object.values(availableWeights).reduce((sum, weight) => sum + weight, 0);
  // Default to 0 (no match) to avoid returning sentinel -1 which can confuse clients.
  let finalScore = 0;

  if (totalWeight > 0) {
    let scoreSum = 0;
    Object.keys(availableWeights).forEach(key => {
      const componentScore = Number(components[key].score) || 0;
      scoreSum += componentScore * (availableWeights[key] / totalWeight);
    });
    finalScore = Math.round(scoreSum * 100) / 100;
  }

  // Defensive: ensure finalScore is a finite number in [0,100]
  if (!Number.isFinite(finalScore) || isNaN(finalScore)) finalScore = 0;
  finalScore = Math.max(0, Math.min(100, finalScore));
  
  // Generate recommendations
  const recommendations = [];
  
  // Missing skills
  if (jobSkills.length > 0) {
    const missingSkills = jobSkills.filter(skill => !resumeSkills.includes(skill));
    missingSkills.forEach(skill => {
      recommendations.push({
        title: `Add skill: ${skill}`,
        text: `Include ${skill} in your Skills section and provide context (project or years of experience).`,
        examples: [`Used ${skill} to build X`, `${skill} for Y operations`]
      });
    });
  }
  
  // Missing contact fields
  contactFields.forEach(field => {
    if (!resumeEntities[field] || resumeEntities[field].length === 0) {
      let message = '';
      let examples = [];
      
      switch (field) {
        case 'EMAIL':
          message = 'Add a professional email address.';
          examples = ['first.last@example.com'];
          break;
        case 'PHONE':
          message = 'Add a reachable phone number.';
          examples = ['+91 98xxxxxx'];
          break;
        case 'LINKEDIN':
          message = 'Add your LinkedIn profile link.';
          examples = ['https://linkedin.com/in/yourname'];
          break;
      }
      
      recommendations.push({
        title: `Add ${field}`,
        text: message,
        examples: examples
      });
    }
  });
  
  // Degree suggestion
  if (jobDegrees.length > 0 && resumeDegrees.length === 0) {
    recommendations.push({
      title: 'Add education/degree',
      text: 'List your degree and institution in Education section.',
      examples: ['B.Tech in Computer Science — XYZ University, 2022']
    });
  }
  
  // Keyword suggestions
  if (jobKeywords.size > 0 && components.keywords.score < 60) {
    const missingKeywords = [...jobKeywords]
      .filter(keyword => !components.keywords.matched.includes(keyword))
      .slice(0, 6);
    
    if (missingKeywords.length > 0) {
      recommendations.push({
        title: 'Add job keywords',
        text: 'Include relevant keywords from the job description in your summary or skills/projects.',
        examples: missingKeywords
      });
    }
  }
  
  // Default recommendation if none provided
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Polish resume',
      text: 'Add more detail to projects and skills; quantify achievements where possible.',
      examples: ['Reduced latency by 30%', 'Improved user engagement by 25%']
    });
  }
  
  // Build missing list for backward compatibility
  const missing = [];
  if (jobSkills.length > 0) {
    jobSkills.forEach(skill => {
      if (!resumeSkills.includes(skill)) {
        missing.push(`SKILL:${skill}`);
      }
    });
  }
  
  contactFields.forEach(field => {
    if (!resumeEntities[field] || resumeEntities[field].length === 0) {
      missing.push(field);
    }
  });
  
  return {
    score: finalScore,
    breakdown: components,
    entities: resumeEntities,
    job_entities: jobEntities,
    missing: [...new Set(missing)],
    recommendations: recommendations
  };
};

// Main function to analyze resume
const analyzeResume = async (filePath, jobDescription) => {
  // If environment requests Python model via process spawn, call wrapper
  if (process.env.USE_PY_MODEL === 'true') {
    try {
      const { spawn } = require('child_process');
      const pyScript = path.join(__dirname, '..', 'ATS-Scoring-System-main', 'score_resume.py');
      const args = ['--file', filePath, '--job', jobDescription || ''];

      const proc = spawn(process.env.PYTHON_BIN || 'python', [pyScript, ...args], { cwd: path.join(__dirname, '..', 'ATS-Scoring-System-main') });

      let stdout = '';
      let stderr = '';

      const timeout = setTimeout(() => {
        proc.kill('SIGKILL');
      }, parseInt(process.env.PY_MODEL_TIMEOUT_MS || '30000'));

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      const exitCode = await new Promise((resolve, reject) => {
        proc.on('close', (code) => resolve(code));
        proc.on('error', (err) => reject(err));
      });

      clearTimeout(timeout);

      if (exitCode !== 0) {
        console.error('Python model error stderr:', stderr);
        // fallback to JS analyzer
      } else {
        // parse stdout as JSON
        try {
          const parsed = JSON.parse(stdout);
          if (parsed && parsed.success && parsed.data) {
            return { success: true, data: parsed.data, resumeText: (parsed.resumeText || '').substring(0, 1000) };
          } else if (parsed && parsed.success === false) {
            return { success: false, error: parsed.error || 'Python model reported failure' };
          }
        } catch (err) {
          console.error('Failed to parse python model output:', err, stdout);
          // fallback
        }
      }
    } catch (err) {
      console.error('Failed to run python model:', err);
      // fallback to JS analyzer
    }
    // If we reach here, fall back to JS analyzer implementation below
  }

  // If an external Python model service URL is provided, call it over HTTP
  if (process.env.PY_MODEL_URL) {
    try {
      // lazy require form-data to avoid startup cost when not used
      const FormData = require('form-data');
      const https = require('https');
      const http = require('http');
      const url = require('url');

      const target = process.env.PY_MODEL_URL;
      const parsed = url.parse(target);
      const isHttps = parsed.protocol === 'https:';

      const form = new FormData();
      // attach file stream
      form.append('resume', fs.createReadStream(filePath));
      form.append('job_description', jobDescription || '');

      const headers = form.getHeaders();

      const options = {
        method: 'POST',
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.path || '/',
        headers
      };

      const httpLib = isHttps ? https : http;

      const result = await new Promise((resolve, reject) => {
        const req = httpLib.request(options, (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            try {
              const parsedBody = JSON.parse(body);
              resolve({ status: res.statusCode, body: parsedBody });
            } catch (err) {
              reject(new Error('Invalid JSON response from Python model: ' + err.message + ' -- ' + body));
            }
          });
        });

        req.on('error', (err) => reject(err));

        // pipe form-data into request
        form.pipe(req);
      });

      if (result && result.status >= 200 && result.status < 300) {
        if (result.body && result.body.success && result.body.data) {
          return { success: true, data: result.body.data, resumeText: (result.body.resumeText || '').substring(0, 1000) };
        }
        if (result.body && result.body.success === false) {
          return { success: false, error: result.body.error || 'Python model service returned failure' };
        }
      } else {
        console.error('Python model service returned status', result && result.status);
      }
    } catch (err) {
      console.error('Error calling PY_MODEL_URL:', err);
      // fall through to local JS analyzer
    }
  }

  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    let resumeText;
    
    if (fileExtension === '.pdf') {
      resumeText = await extractTextFromPDF(filePath);
    } else if (fileExtension === '.docx') {
      resumeText = await extractTextFromDOCX(filePath);
    } else {
      throw new Error('Unsupported file format');
    }
    
    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error('No text content found in the file');
    }
    
    const analysisResult = computeATSScore(resumeText, jobDescription);
    
    return {
      success: true,
      data: analysisResult,
      resumeText: resumeText.substring(0, 1000) // First 1000 chars for preview
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  analyzeResume,
  extractTextFromPDF,
  extractTextFromDOCX,
  computeATSScore
};
