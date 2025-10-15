const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

// Get all users (for admin)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const role = req.query.role || '';
    const search = req.query.search || '';

    let query = `
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             COUNT(DISTINCT j.id) as jobs_posted,
             COUNT(DISTINCT a.id) as applications_made,
             COUNT(DISTINCT ra.id) as resumes_analyzed
      FROM users u
      LEFT JOIN jobs j ON u.id = j.recruiter_id
      LEFT JOIN applications a ON u.id = a.student_id
      LEFT JOIN resume_analysis ra ON u.id = ra.student_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (role) {
      query += ` AND u.role = ?`;
      queryParams.push(role);
    }
    
    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [users] = await pool.execute(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    const countParams = [];
    
    if (role) {
      countQuery += ` AND role = ?`;
      countParams.push(role);
    }
    
    if (search) {
      countQuery += ` AND (name LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              COUNT(DISTINCT j.id) as jobs_posted,
              COUNT(DISTINCT a.id) as applications_made,
              COUNT(DISTINCT ra.id) as resumes_analyzed
       FROM users u
       LEFT JOIN jobs j ON u.id = j.recruiter_id
       LEFT JOIN applications a ON u.id = a.student_id
       LEFT JOIN resume_analysis ra ON u.id = ra.student_id
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Prevent admin from changing their own role
    if (parseInt(userId) === adminId) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'user_role_updated', `Updated ${user.name} (${user.email}) role to ${role}`]
    );

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Prevent admin from deleting themselves
    if (parseInt(userId) === adminId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    // Log activity
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'user_deleted', `Deleted user: ${user.name} (${user.email})`]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Get platform statistics
const getPlatformStats = async (req, res) => {
  try {
    // Get total counts
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [totalJobs] = await pool.execute('SELECT COUNT(*) as count FROM jobs');
    const [totalApplications] = await pool.execute('SELECT COUNT(*) as count FROM applications');
    const [totalAnalyses] = await pool.execute('SELECT COUNT(*) as count FROM resume_analysis');

    // Get role distribution
    const [roleStats] = await pool.execute(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );

    // Get average ATS score
    const [avgScore] = await pool.execute(
      'SELECT AVG(ats_score) as average FROM resume_analysis WHERE ats_score IS NOT NULL'
    );

    // Get recent activity (last 30 days)
    const [recentActivity] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM activity_logs 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`
    );

    // Get top skills
    const [topSkills] = await pool.execute(
      `SELECT skills, COUNT(*) as count 
       FROM jobs 
       WHERE skills IS NOT NULL AND skills != ''
       GROUP BY skills
       ORDER BY count DESC
       LIMIT 10`
    );

    res.json({
      stats: {
        totalUsers: totalUsers[0].count,
        totalJobs: totalJobs[0].count,
        totalApplications: totalApplications[0].count,
        totalAnalyses: totalAnalyses[0].count,
        averageATSScore: avgScore[0].average ? Math.round(avgScore[0].average * 100) / 100 : 0
      },
      roleDistribution: roleStats,
      recentActivity,
      topSkills
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ message: 'Failed to fetch platform statistics' });
  }
};

// Get activity logs
const getActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const userId = req.query.userId || '';

    let query = `
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (userId) {
      query += ` AND al.user_id = ?`;
      queryParams.push(userId);
    }
    
    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [logs] = await pool.execute(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM activity_logs WHERE 1=1`;
    const countParams = [];
    
    if (userId) {
      countQuery += ` AND user_id = ?`;
      countParams.push(userId);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalLogs: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getPlatformStats,
  getActivityLogs
};
