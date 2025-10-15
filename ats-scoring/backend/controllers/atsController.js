const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { analyzeResume } = require('../utils/atsScoring');
const path = require('path');

// Validation rules
const scoreResumeValidation = [
  body('jobDescription').notEmpty().withMessage('Job description is required'),
  body('jobId').optional().isInt().withMessage('Job ID must be a valid integer')
];

// Score resume against job description
const scoreResume = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobDescription, jobId } = req.body;
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required' });
    }

    const filePath = req.file.path;
    
    // Analyze the resume
    const analysisResult = await analyzeResume(filePath, jobDescription);
    
    if (!analysisResult.success) {
      return res.status(400).json({ message: analysisResult.error });
    }

    const { data } = analysisResult;
    
    // Save analysis to database
    const [result] = await pool.execute(
      `INSERT INTO resume_analysis 
       (student_id, resume_url, ats_score, matched_keywords, missing_keywords, recommendations, analysis_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        req.file.filename,
        data.score,
        JSON.stringify(data.breakdown.skills?.match || []),
        JSON.stringify(data.missing || []),
        JSON.stringify(data.recommendations || []),
        JSON.stringify(data)
      ]
    );

    // If jobId is provided, create an application
    if (jobId) {
      try {
        await pool.execute(
          `INSERT INTO applications (job_id, student_id, resume_url, ats_score, status) 
           VALUES (?, ?, ?, ?, 'applied')
           ON DUPLICATE KEY UPDATE 
           resume_url = VALUES(resume_url), 
           ats_score = VALUES(ats_score),
           updated_at = CURRENT_TIMESTAMP`,
          [jobId, userId, req.file.filename, data.score]
        );
      } catch (error) {
        console.error('Error creating application:', error);
        // Don't fail the entire request if application creation fails
      }
    }

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, 'resume_scored', `Resume scored: ${data.score}%`]
    );

    res.json({
      message: 'Resume analyzed successfully',
      analysis: {
        score: data.score,
        matched_keywords: data.breakdown.skills?.match || [],
        missing_keywords: data.missing || [],
        recommendations: data.recommendations || [],
        breakdown: data.breakdown,
        analysisId: result.insertId
      }
    });

  } catch (error) {
    console.error('Resume scoring error:', error);
    res.status(500).json({ message: 'Failed to analyze resume' });
  }
};

// Get user's resume analysis history
const getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [analyses] = await pool.execute(
      `SELECT id, resume_url, ats_score, matched_keywords, missing_keywords, 
              recommendations, created_at 
       FROM resume_analysis 
       WHERE student_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Parse JSON fields
    const formattedAnalyses = analyses.map(analysis => ({
      ...analysis,
      matched_keywords: JSON.parse(analysis.matched_keywords || '[]'),
      missing_keywords: JSON.parse(analysis.missing_keywords || '[]'),
      recommendations: JSON.parse(analysis.recommendations || '[]')
    }));

    res.json({ analyses: formattedAnalyses });
  } catch (error) {
    console.error('Analysis history error:', error);
    res.status(500).json({ message: 'Failed to fetch analysis history' });
  }
};

// Get specific analysis details
const getAnalysisDetails = async (req, res) => {
  try {
    const { analysisId } = req.params;
    const userId = req.user.id;
    
    const [analyses] = await pool.execute(
      `SELECT * FROM resume_analysis 
       WHERE id = ? AND student_id = ?`,
      [analysisId, userId]
    );

    if (analyses.length === 0) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    const analysis = analyses[0];
    
    res.json({
      analysis: {
        ...analysis,
        matched_keywords: JSON.parse(analysis.matched_keywords || '[]'),
        missing_keywords: JSON.parse(analysis.missing_keywords || '[]'),
        recommendations: JSON.parse(analysis.recommendations || '[]'),
        analysis_data: JSON.parse(analysis.analysis_data || '{}')
      }
    });
  } catch (error) {
    console.error('Analysis details error:', error);
    res.status(500).json({ message: 'Failed to fetch analysis details' });
  }
};

// Get job recommendations based on user's skills
const getJobRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's latest analysis to extract skills
    const [latestAnalysis] = await pool.execute(
      `SELECT analysis_data FROM resume_analysis 
       WHERE student_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (latestAnalysis.length === 0) {
      return res.json({ jobs: [], message: 'No resume analysis found. Please upload and analyze your resume first.' });
    }

    const analysisData = JSON.parse(latestAnalysis[0].analysis_data);
    const userSkills = analysisData.entities?.SKILLS || [];

    if (userSkills.length === 0) {
      return res.json({ jobs: [], message: 'No skills found in your resume. Please update your resume with relevant skills.' });
    }

    // Find jobs that match user's skills
    const [jobs] = await pool.execute(
      `SELECT j.*, u.name as recruiter_name, u.email as recruiter_email
       FROM jobs j
       JOIN users u ON j.recruiter_id = u.id
       WHERE j.status = 'active'
       ORDER BY j.created_at DESC
       LIMIT 20`,
      []
    );

    // Score jobs based on skill match
    const scoredJobs = jobs.map(job => {
      const jobSkills = job.skills ? job.skills.toLowerCase().split(',').map(s => s.trim()) : [];
      const matchedSkills = userSkills.filter(skill => 
        jobSkills.some(jobSkill => jobSkill.includes(skill.toLowerCase()))
      );
      
      const matchScore = jobSkills.length > 0 ? 
        Math.round((matchedSkills.length / jobSkills.length) * 100) : 0;

      return {
        ...job,
        matched_skills: matchedSkills,
        match_score: matchScore
      };
    }).filter(job => job.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10);

    res.json({ jobs: scoredJobs });
  } catch (error) {
    console.error('Job recommendations error:', error);
    res.status(500).json({ message: 'Failed to get job recommendations' });
  }
};

module.exports = {
  scoreResumeValidation,
  scoreResume,
  getAnalysisHistory,
  getAnalysisDetails,
  getJobRecommendations
};
