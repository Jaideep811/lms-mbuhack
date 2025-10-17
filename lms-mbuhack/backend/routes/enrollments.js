const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Temporary inline functions to test
const enrollInCourse = async (req, res) => {
  try {
    res.json({ success: true, message: 'Enrollment route working' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEnrolledStudents = async (req, res) => {
  try {
    res.json({ success: true, message: 'Get enrolled students route working' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.post('/:courseId', auth, enrollInCourse);
router.get('/course/:courseId/students', auth, getEnrolledStudents);

module.exports = router;