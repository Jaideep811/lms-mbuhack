const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const ErrorResponse = require('../utils/errorResponse');

const createCourse = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return next(new ErrorResponse('Only teachers can create courses', 403));
    }

    const { title, description, duration } = req.body;

    const course = await Course.create({
      title,
      description,
      duration,
      teacher: req.user.id
    });

    await course.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherCourses = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return next(new ErrorResponse('Only teachers can access this route', 403));
    }

    const courses = await Course.find({ teacher: req.user.id })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

const getEnrolledCourses = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return next(new ErrorResponse('Only students can access this route', 403));
    }

    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate({
        path: 'course',
        populate: { path: 'teacher', select: 'name email' }
      })
      .sort({ enrolledAt: -1 });

    const courses = enrollments.map(enrollment => enrollment.course);
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getTeacherCourses,
  getEnrolledCourses
};