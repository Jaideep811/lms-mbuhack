const express = require('express');
const { body } = require('express-validator');
const { 
  createCourse, 
  getAllCourses, 
  getTeacherCourses, 
  getEnrolledCourses 
} = require('../controllers/courseController');
const { handleValidationErrors } = require('../middleware/validation');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('duration').notEmpty().withMessage('Duration is required'),
  handleValidationErrors
], createCourse);

router.get('/', auth, getAllCourses);
router.get('/my-courses', auth, getTeacherCourses);
router.get('/enrolled', auth, getEnrolledCourses);

module.exports = router;