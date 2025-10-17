import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to log requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    // Don't redirect for 400 errors (like "already enrolled")
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // For 400 errors, just reject without redirect
    return Promise.reject(error);
  }
);

// Courses
export const createCourse = (courseData) => api.post('/courses', courseData);
export const getCourses = () => api.get('/courses');
export const getMyCourses = () => api.get('/courses/my-courses');
export const getEnrolledCourses = () => api.get('/courses/enrolled');

// Enrollments
export const enrollInCourse = (courseId) => api.post(`/enrollments/${courseId}`);
export const getEnrolledStudents = (courseId) => api.get(`/enrollments/course/${courseId}/students`);

// Assignments - FIXED THE TYPO HERE
export const createAssignment = (assignmentData) => api.post('/assignments', assignmentData);
export const getCourseAssignments = (courseId) => api.get(`/assignments/course/${courseId}`); // Fixed: courseId
export const submitAssignment = (assignmentId, submissionText) => 
  api.post(`/assignments/${assignmentId}/submit`, { submissionText });

// Submissions
export const getAssignmentSubmissions = (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`);
export const gradeSubmission = (submissionId, grade, feedback) => 
  api.put(`/assignments/submissions/${submissionId}/grade`, { grade, feedback });
export const getStudentSubmissions = () => api.get('/assignments/student/submissions');
export const getStudentSubmissionsForCourse = (courseId) => 
  api.get(`/assignments/student/course/${courseId}/submissions`);

// Grading
export const getTeacherGradingDashboard = () => api.get('/assignments/teacher/grading-dashboard');
export const getStudentGradingDashboard = () => api.get('/assignments/student/grading-dashboard');


export default api;
