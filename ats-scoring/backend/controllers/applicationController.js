const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

// Validation rules
const applyJobValidation = [
  body('jobId').isInt().withMessage('Valid job ID required')
];

const updateApplicationValidation = [
  body('status').isIn(['applied', 'shortlisted', 'rejected']).withMessage('Invalid status')
];

// Apply for a job
const applyForJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobId } = req.body;
    const studentId = req.user.id;

    // Check if job exists
    const [jobs] = await pool.execute(
      'SELECT id, title FROM jobs WHERE id = ? AND status = "active"',
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: 'Job not found or not available' });
    }

    // Check if already applied
    const [existingApplications] = await pool.execute(
      'SELECT id FROM applications WHERE job_id = ? AND student_id = ?',
      [jobId, studentId]
    );

    if (existingApplications.length > 0) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Create application
    const [result] = await pool.execute(
      'INSERT INTO applications (job_id, student_id, status) VALUES (?, ?, "applied")',
      [jobId, studentId]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [studentId, 'job_applied', `Applied for job: ${jobs[0].title}`]
    );

    res.status(201).json({
      message: 'Application submitted successfully',
      application: {
        id: result.insertId,
        jobId,
        studentId,
        status: 'applied'
      }
    });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({ message: 'Failed to apply for job' });
  }
};

// Get student's applications
const getStudentApplications = async (req, res) => {
  try {
    const studentId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [applications] = await pool.execute(
      `SELECT a.*, j.title, j.company, j.location, j.salary, u.name as recruiter_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON j.recruiter_id = u.id
       WHERE a.student_id = ?
       ORDER BY a.applied_at DESC
       LIMIT ? OFFSET ?`,
      [studentId, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM applications WHERE student_id = ?',
      [studentId]
    );
    const total = countResult[0].total;

    res.json({
      applications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalApplications: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get student applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};

// Get job applicants (for recruiters)
const getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    // Verify job belongs to recruiter
    const [jobs] = await pool.execute(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: 'Job not found or access denied' });
    }

    const [applications] = await pool.execute(
      `SELECT a.*, u.name as student_name, u.email as student_email,
              ra.ats_score, ra.matched_keywords, ra.missing_keywords, ra.recommendations
       FROM applications a
       JOIN users u ON a.student_id = u.id
       LEFT JOIN resume_analysis ra ON a.student_id = ra.student_id 
           AND ra.created_at = (
               SELECT MAX(created_at) 
               FROM resume_analysis ra2 
               WHERE ra2.student_id = a.student_id
           )
       WHERE a.job_id = ?
       ORDER BY a.ats_score DESC, a.applied_at DESC`,
      [jobId]
    );

    // Parse JSON fields
    const formattedApplications = applications.map(app => ({
      ...app,
      matched_keywords: app.matched_keywords ? JSON.parse(app.matched_keywords) : [],
      missing_keywords: app.missing_keywords ? JSON.parse(app.missing_keywords) : [],
      recommendations: app.recommendations ? JSON.parse(app.recommendations) : []
    }));

    res.json({ applicants: formattedApplications });
  } catch (error) {
    console.error('Get job applicants error:', error);
    res.status(500).json({ message: 'Failed to fetch applicants' });
  }
};

// Update application status (for recruiters)
const updateApplicationStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { applicationId } = req.params;
    const { status } = req.body;
    const recruiterId = req.user.id;

    // Verify application exists and job belongs to recruiter
    const [applications] = await pool.execute(
      `SELECT a.id, j.title, u.name as student_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON a.student_id = u.id
       WHERE a.id = ? AND j.recruiter_id = ?`,
      [applicationId, recruiterId]
    );

    if (applications.length === 0) {
      return res.status(404).json({ message: 'Application not found or access denied' });
    }

    await pool.execute(
      'UPDATE applications SET status = ? WHERE id = ?',
      [status, applicationId]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [recruiterId, 'application_updated', `Updated application status to ${status} for ${applications[0].student_name}`]
    );

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Failed to update application status' });
  }
};

// Get all applications (for admin)
const getAllApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [applications] = await pool.execute(
      `SELECT a.*, j.title as job_title, j.company,
              u1.name as student_name, u1.email as student_email,
              u2.name as recruiter_name, u2.email as recruiter_email
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u1 ON a.student_id = u1.id
       JOIN users u2 ON j.recruiter_id = u2.id
       ORDER BY a.applied_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM applications');
    const total = countResult[0].total;

    res.json({
      applications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalApplications: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};

module.exports = {
  applyJobValidation,
  updateApplicationValidation,
  applyForJob,
  getStudentApplications,
  getJobApplicants,
  updateApplicationStatus,
  getAllApplications
};
