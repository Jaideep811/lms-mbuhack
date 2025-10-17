const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const ErrorResponse = require('../utils/errorResponse');

const createAssignment = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return next(new ErrorResponse('Only teachers can create assignments', 403));
    }

    const { title, description, course, dueDate } = req.body;

    // Verify teacher owns the course
    const courseDoc = await Course.findById(course);
    if (!courseDoc || courseDoc.teacher.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to create assignments for this course', 403));
    }

    const assignment = await Assignment.create({
      title,
      description,
      course,
      teacher: req.user.id,
      dueDate
    });

    await assignment.populate('course', 'title');
    await assignment.populate('teacher', 'name');

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    next(error);
  }
};

const getCourseAssignments = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error loading assignments:', error);
    next(error);
  }
};

const submitAssignment = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return next(new ErrorResponse('Only students can submit assignments', 403));
    }

    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return next(new ErrorResponse('Assignment not found', 404));
    }

    // Check if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: assignment.course
    });

    if (!enrollment) {
      return next(new ErrorResponse('Not enrolled in this course', 403));
    }

    // Check if student has already submitted this assignment
    const existingSubmission = await Submission.findOne({
      assignment: req.params.assignmentId,
      student: req.user.id
    });

    if (existingSubmission) {
      return next(new ErrorResponse('You have already submitted this assignment', 400));
    }

    const submission = await Submission.create({
      assignment: req.params.assignmentId,
      student: req.user.id,
      course: assignment.course,
      submissionText: req.body.submissionText
    });

    await submission.populate('student', 'name email');
    await submission.populate('assignment', 'title');

    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    if (error.code === 11000) {
      return next(new ErrorResponse('You have already submitted this assignment', 400));
    }
    next(error);
  }
};

// FIXED: Correct function name - was "gcwssigmemetsdimissions"
const getAssignmentSubmissions = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return next(new ErrorResponse('Only teachers can view submissions', 403));
    }

    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return next(new ErrorResponse('Assignment not found', 404));
    }

    // Verify teacher owns the assignment
    if (assignment.teacher.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to view submissions for this assignment', 403));
    }

    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error in getAssignmentSubmissions:', error);
    
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return next(new ErrorResponse('Invalid assignment ID', 400));
    }
    
    next(error);
  }
};

const gradeSubmission = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return next(new ErrorResponse('Only teachers can grade submissions', 403));
    }

    const submission = await Submission.findById(req.params.submissionId)
      .populate('assignment');
    
    if (!submission) {
      return next(new ErrorResponse('Submission not found', 404));
    }

    // Verify teacher owns the assignment
    if (submission.assignment.teacher.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to grade this submission', 403));
    }

    submission.grade = req.body.grade;
    submission.feedback = req.body.feedback;
    submission.gradedAt = new Date();
    submission.status = 'graded';

    await submission.save();
    await submission.populate('student', 'name email');
    await submission.populate('assignment', 'title');

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    next(error);
  }
};

const getStudentSubmissions = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return next(new ErrorResponse('Only students can access this route', 403));
    }

    const submissions = await Submission.find({ student: req.user.id })
      .populate('assignment', 'title description dueDate')
      .populate('course', 'title')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error loading student submissions:', error);
    next(error);
  }
};

const getStudentSubmissionsForCourse = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return next(new ErrorResponse('Only students can access this route', 403));
    }

    const submissions = await Submission.find({ 
      student: req.user.id,
      course: req.params.courseId
    }).populate('assignment', 'title description dueDate');

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error loading student submissions for course:', error);
    next(error);
  }
};

const getTeacherGradingDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return next(new ErrorResponse('Only teachers can access this route', 403));
    }

    const courses = await Course.find({ teacher: req.user.id });
    const courseIds = courses.map(course => course._id);

    const submissions = await Submission.find({ course: { $in: courseIds } })
      .populate('student', 'name email')
      .populate('assignment', 'title')
      .populate('course', 'title')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error loading teacher grading dashboard:', error);
    next(error);
  }
};

const getStudentGradingDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return next(new ErrorResponse('Only students can access this route', 403));
    }

    const submissions = await Submission.find({ student: req.user.id })
      .populate('assignment', 'title')
      .populate('course', 'title')
      .sort({ submittedAt: -1 });

    const gradedSubmissions = submissions.filter(sub => sub.grade !== undefined);
    const averageGrade = gradedSubmissions.length > 0 
      ? gradedSubmissions.reduce((sum, sub) => sum + sub.grade, 0) / gradedSubmissions.length 
      : 0;

    res.json({
      success: true,
      data: {
        submissions,
        averageGrade: Math.round(averageGrade * 100) / 100,
        totalAssignments: submissions.length,
        gradedAssignments: gradedSubmissions.length
      }
    });
  } catch (error) {
    console.error('Error loading student grading dashboard:', error);
    next(error);
  }
};

// Make sure ALL functions are exported
module.exports = {
  createAssignment,
  getCourseAssignments,
  submitAssignment,
  getAssignmentSubmissions, // Fixed function name
  gradeSubmission,
  getStudentSubmissions,
  getStudentSubmissionsForCourse,
  getTeacherGradingDashboard,
  getStudentGradingDashboard
};