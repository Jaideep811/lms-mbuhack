const express = require('express');
const { body } = require('express-validator');
const {
  createAssignment,
  getCourseAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getStudentSubmissions,
  getTeacherGradingDashboard,
  getStudentGradingDashboard,
  getStudentSubmissionsForCourse // Make sure this is imported
} = require('../controllers/assignmentController');
const { handleValidationErrors } = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('course').notEmpty().withMessage('Course is required'),
  body('dueDate').notEmpty().withMessage('Due date is required'),
  handleValidationErrors
], createAssignment);

router.get('/course/:courseId', auth, getCourseAssignments);
router.post('/:assignmentId/submit', [
  auth,
  body('submissionText').notEmpty().withMessage('Submission text is required'),
  handleValidationErrors
], submitAssignment);
router.get('/:assignmentId/submissions', auth, getAssignmentSubmissions);
router.put('/submissions/:submissionId/grade', [
  auth,
  body('grade').isNumeric().withMessage('Grade must be a number'),
  body('feedback').optional().isString(),
  handleValidationErrors
], gradeSubmission);
router.get('/student/submissions', auth, getStudentSubmissions);
router.get('/student/course/:courseId/submissions', auth, getStudentSubmissionsForCourse); // Add this route
router.get('/teacher/grading-dashboard', auth, getTeacherGradingDashboard);
router.get('/student/grading-dashboard', auth, getStudentGradingDashboard);

module.exports = router;