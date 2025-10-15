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

// Extract skills
const extractSkills = (text) => {
  if (!text) return [];
  const textLower = text.toLowerCase();
  const skills = COMMON_SKILLS.filter(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    return regex.test(textLower);
  });
  return [...new Set(skills)];
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
    const matchedSkills = jobSkills.filter(skill => resumeSkills.includes(skill));
    components.skills = {
      match: matchedSkills,
      required: jobSkills,
      score: Math.round((matchedSkills.length / jobSkills.length) * 100 * 100) / 100
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
  let finalScore = -1;
  
  if (totalWeight > 0) {
    let scoreSum = 0;
    Object.keys(availableWeights).forEach(key => {
      scoreSum += components[key].score * (availableWeights[key] / totalWeight);
    });
    finalScore = Math.round(scoreSum * 100) / 100;
  }
  
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
