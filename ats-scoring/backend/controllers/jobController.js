const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

// Validation rules
const createJobValidation = [
  body('title').trim().isLength({ min: 3 }).withMessage('Job title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Job description must be at least 10 characters'),
  body('skills').optional().trim(),
  body('experience').optional().trim(),
  body('salary').optional().trim(),
  body('location').optional().trim(),
  body('company').optional().trim()
];

const updateJobValidation = [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Job title must be at least 3 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Job description must be at least 10 characters'),
  body('skills').optional().trim(),
  body('experience').optional().trim(),
  body('salary').optional().trim(),
  body('location').optional().trim(),
  body('company').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'closed']).withMessage('Invalid status')
];

// Create new job
const createJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, skills, experience, salary, location, company } = req.body;
    const recruiterId = req.user.id;

    const [result] = await pool.execute(
      `INSERT INTO jobs (recruiter_id, title, description, skills, experience, salary, location, company) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [recruiterId, title, description, skills, experience, salary, location, company]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [recruiterId, 'job_created', `Created job: ${title}`]
    );

    res.status(201).json({
      message: 'Job created successfully',
      job: {
        id: result.insertId,
        title,
        description,
        skills,
        experience,
        salary,
        location,
        company,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
};

// Get all jobs (with pagination)
const getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `
      SELECT j.*, u.name as recruiter_name, u.email as recruiter_email,
             COUNT(a.id) as application_count
      FROM jobs j
      JOIN users u ON j.recruiter_id = u.id
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.status = 'active'
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND (j.title LIKE ? OR j.description LIKE ? OR j.skills LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ` GROUP BY j.id ORDER BY j.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [jobs] = await pool.execute(query, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM jobs WHERE status = 'active'`;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (title LIKE ? OR description LIKE ? OR skills LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      jobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalJobs: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

// Get job by ID
const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const [jobs] = await pool.execute(
      `SELECT j.*, u.name as recruiter_name, u.email as recruiter_email
       FROM jobs j
       JOIN users u ON j.recruiter_id = u.id
       WHERE j.id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ job: jobs[0] });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Failed to fetch job' });
  }
};

// Get recruiter's jobs
const getRecruiterJobs = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [jobs] = await pool.execute(
      `SELECT j.*, COUNT(a.id) as application_count
       FROM jobs j
       LEFT JOIN applications a ON j.id = a.job_id
       WHERE j.recruiter_id = ?
       GROUP BY j.id
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`,
      [recruiterId, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM jobs WHERE recruiter_id = ?',
      [recruiterId]
    );
    const total = countResult[0].total;

    res.json({
      jobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalJobs: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get recruiter jobs error:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

// Update job
const updateJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobId } = req.params;
    const recruiterId = req.user.id;
    const updates = req.body;

    // Check if job exists and belongs to recruiter
    const [existingJobs] = await pool.execute(
      'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (existingJobs.length === 0) {
      return res.status(404).json({ message: 'Job not found or access denied' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateValues.push(jobId);

    await pool.execute(
      `UPDATE jobs SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [recruiterId, 'job_updated', `Updated job ID: ${jobId}`]
    );

    res.json({ message: 'Job updated successfully' });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Failed to update job' });
  }
};

// Delete job
const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    // Check if job exists and belongs to recruiter
    const [existingJobs] = await pool.execute(
      'SELECT title FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, recruiterId]
    );

    if (existingJobs.length === 0) {
      return res.status(404).json({ message: 'Job not found or access denied' });
    }

    await pool.execute('DELETE FROM jobs WHERE id = ?', [jobId]);

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [recruiterId, 'job_deleted', `Deleted job: ${existingJobs[0].title}`]
    );

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Failed to delete job' });
  }
};

module.exports = {
  createJobValidation,
  updateJobValidation,
  createJob,
  getAllJobs,
  getJobById,
  getRecruiterJobs,
  updateJob,
  deleteJob
};
