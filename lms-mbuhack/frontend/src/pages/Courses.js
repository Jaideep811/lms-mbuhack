import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { 
  getCourses, 
  getMyCourses, 
  getEnrolledCourses, 
  createCourse, 
  enrollInCourse,
  getEnrolledStudents 
} from '../services/api';
import '../styles/Courses.css';

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    duration: ''
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');
      let response;
      
      if (user.role === 'teacher') {
        response = await getMyCourses();
      } else {
        response = await getCourses();
      }
      
      // FIX: Check if response.data exists and is an array
      if (response.data && Array.isArray(response.data.data)) {
        setCourses(response.data.data);
      } else if (Array.isArray(response.data)) {
        setCourses(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setCourses([]);
        setError('Failed to load courses: Unexpected data format');
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await createCourse(newCourse);
      setNewCourse({ title: '', description: '', duration: '' });
      setShowCreateForm(false);
      loadCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      setError(error.response?.data?.message || 'Error creating course');
    }
  };

  const handleEnroll = async (courseId) => {
  try {
    setError('');
    const response = await enrollInCourse(courseId);
    
    // Check if it's already enrolled but returned success
    if (response.data.message === 'Already enrolled in this course') {
      alert('You are already enrolled in this course!');
    } else {
      alert('Successfully enrolled in the course!');
    }
    
    loadCourses(); // Refresh the courses list
  } catch (error) {
    console.error('Error enrolling in course:', error);
    
    // Handle the case where user is already enrolled but backend returns error
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already enrolled')) {
      alert('You are already enrolled in this course!');
    } else {
      setError(error.response?.data?.message || 'Error enrolling in course');
    }
  }
};

  const loadEnrolledStudents = async (courseId) => {
    try {
      setError('');
      const response = await getEnrolledStudents(courseId);
      
      // FIX: Handle different response formats
      const students = response.data.data || response.data;
      
      setEnrolledStudents(prev => ({
        ...prev,
        [courseId]: students
      }));
    } catch (error) {
      console.error('Error loading enrolled students:', error);
      setError('Failed to load enrolled students');
    }
  };

  return (
    <div className="courses-page">
      <Header />
      <div className="page-content">
        <Navigation />
        <main className="main-content">
          <div className="courses-header">
            <h2>
              {user.role === 'teacher' ? 'My Courses' : 'Available Courses'}
            </h2>
            {user.role === 'teacher' && (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Create New Course
              </button>
            )}
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {showCreateForm && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Create New Course</h3>
                <form onSubmit={handleCreateCourse}>
                  <div className="form-group">
                    <label>Course Title</label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                      placeholder="e.g., 8 weeks"
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Create Course</button>
                    <button 
                      type="button" 
                      onClick={() => setShowCreateForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading courses...</div>
          ) : (
            <div className="courses-grid">
              {courses && courses.length > 0 ? (
                courses.map(course => (
                  <div key={course._id} className="course-card">
                    <h3>{course.title}</h3>
                    <p className="course-description">{course.description}</p>
                    <p className="course-duration">Duration: {course.duration}</p>
                    <p className="course-teacher">
                      Teacher: {course.teacher?.name || 'Unknown'}
                    </p>
                    
                    {user.role === 'student' ? (
                      <button 
                        onClick={() => handleEnroll(course._id)}
                        className="btn-primary"
                      >
                        Enroll
                      </button>
                    ) : (
                      <div>
                        <button 
                          onClick={() => loadEnrolledStudents(course._id)}
                          className="btn-secondary"
                        >
                          View Enrolled Students
                        </button>
                        {enrolledStudents[course._id] && (
                          <div className="enrolled-students">
                            <h4>Enrolled Students:</h4>
                            {Array.isArray(enrolledStudents[course._id]) ? (
                              enrolledStudents[course._id].map(enrollment => (
                                <div key={enrollment._id} className="student-item">
                                  {enrollment.student?.name || 'Unknown'} ({enrollment.student?.email || 'No email'})
                                </div>
                              ))
                            ) : (
                              <div>No students enrolled</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <h3>No courses found</h3>
                  <p>
                    {user.role === 'teacher' 
                      ? 'Create your first course to get started!' 
                      : 'No courses available for enrollment yet.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Courses;