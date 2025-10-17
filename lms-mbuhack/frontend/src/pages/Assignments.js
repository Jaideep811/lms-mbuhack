import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { 
  getCourseAssignments, 
  createAssignment, 
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getStudentSubmissions,
  getStudentSubmissionsForCourse  // Add this import
} from '../services/api';
import { getMyCourses, getEnrolledCourses } from '../services/api';
import '../styles/Assignments.css';

const Assignments = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState({}); // Store student submissions
  const [teacherSubmissions, setTeacherSubmissions] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState({});
  const [showSubmissions, setShowSubmissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: ''
  });
  const [submissionText, setSubmissionText] = useState('');

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
        response = await getEnrolledCourses();
      }
      
      if (response.data && Array.isArray(response.data.data)) {
        setCourses(response.data.data);
      } else if (Array.isArray(response.data)) {
        setCourses(response.data);
      } else {
        console.error('Unexpected courses response format:', response.data);
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

  const loadAssignments = async (courseId) => {
    try {
      setError('');
      const response = await getCourseAssignments(courseId);
      
      let assignmentsData = response.data;
      
      if (assignmentsData && Array.isArray(assignmentsData.data)) {
        setAssignments(assignmentsData.data);
      } else if (Array.isArray(assignmentsData)) {
        setAssignments(assignmentsData);
      } else {
        console.error('Unexpected assignments response format:', assignmentsData);
        setAssignments([]);
        setError('Failed to load assignments: Unexpected data format');
      }
      
      setSelectedCourse(courseId);

      // If student, load their submissions for this course
      if (user.role === 'student') {
        loadStudentSubmissionsForCourse(courseId);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      setError('Failed to load assignments');
      setAssignments([]);
    }
  };

  // NEW: Load student submissions for a specific course
  const loadStudentSubmissionsForCourse = async (courseId) => {
    try {
      const response = await getStudentSubmissionsForCourse(courseId);
      const submissions = response.data.data || response.data;
      
      // Create a mapping of assignmentId to submission
      const submissionsMap = {};
      submissions.forEach(submission => {
        submissionsMap[submission.assignment._id] = submission;
      });
      
      setStudentSubmissions(submissionsMap);
    } catch (error) {
      console.error('Error loading student submissions:', error);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await createAssignment({
        ...newAssignment,
        course: selectedCourse
      });
      setNewAssignment({ title: '', description: '', dueDate: '' });
      setShowCreateForm(false);
      loadAssignments(selectedCourse);
    } catch (error) {
      console.error('Error creating assignment:', error);
      setError(error.response?.data?.message || 'Error creating assignment');
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    try {
      setError('');
      await submitAssignment(assignmentId, submissionText);
      setSubmissionText('');
      setShowSubmitForm({});
      
      // Reload student submissions to update the UI
      if (selectedCourse) {
        loadStudentSubmissionsForCourse(selectedCourse);
      }
      
      alert('Assignment submitted successfully!');
    } catch (error) {
      console.error('Error submitting assignment:', error);
      if (error.response?.status === 400) {
        setError('You have already submitted this assignment');
      } else {
        setError(error.response?.data?.message || 'Error submitting assignment');
      }
    }
  };

  const loadSubmissions = async (assignmentId) => {
  try {
    setError('');
    const response = await getAssignmentSubmissions(assignmentId);
    
    let submissionsData = response.data;
    
    if (submissionsData && Array.isArray(submissionsData.data)) {
      setTeacherSubmissions(prev => ({
        ...prev,
        [assignmentId]: submissionsData.data
      }));
    } else if (Array.isArray(submissionsData)) {
      setTeacherSubmissions(prev => ({
        ...prev,
        [assignmentId]: submissionsData
      }));
    } else {
      console.error('Unexpected submissions response format:', submissionsData);
      setTeacherSubmissions(prev => ({
        ...prev,
        [assignmentId]: []
      }));
    }
  } catch (error) {
    console.error('Error loading submissions:', error);
    
    // Handle assignment not found error gracefully
    if (error.response?.status === 404) {
      setError('Assignment not found. Please refresh the page.');
      setTeacherSubmissions(prev => ({
        ...prev,
        [assignmentId]: []
      }));
    } else {
      setError('Failed to load submissions');
    }
  }
};

  const handleGradeSubmission = async (submissionId, grade, feedback) => {
    try {
      setError('');
      await gradeSubmission(submissionId, grade, feedback);
      loadSubmissions(selectedCourse);
      alert('Grade submitted successfully!');
    } catch (error) {
      console.error('Error submitting grade:', error);
      setError('Error submitting grade');
    }
  };

  // Helper function to check if student has submitted an assignment
  const hasStudentSubmitted = (assignmentId) => {
    return !!studentSubmissions[assignmentId];
  };

  // Helper function to get student's submission for an assignment
  const getStudentSubmission = (assignmentId) => {
    return studentSubmissions[assignmentId];
  };

  return (
    <div className="assignments-page">
      <Header />
      <div className="page-content">
        <Navigation />
        <main className="main-content">
          <div className="assignments-header">
            <h2>Assignments</h2>
            {user.role === 'teacher' && selectedCourse && (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Create Assignment
              </button>
            )}
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="course-selector">
            <label>Select Course:</label>
            <select 
              value={selectedCourse} 
              onChange={(e) => loadAssignments(e.target.value)}
              disabled={loading}
            >
              <option value="">Choose a course</option>
              {courses && courses.length > 0 ? (
                courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))
              ) : (
                <option value="" disabled>No courses available</option>
              )}
            </select>
          </div>

          {showCreateForm && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Create New Assignment</h3>
                <form onSubmit={handleCreateAssignment}>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="datetime-local"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Create Assignment</button>
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
            <div className="loading">Loading...</div>
          ) : (
            <div className="assignments-list">
              {assignments && assignments.length > 0 ? (
                assignments.map(assignment => (
                  <div key={assignment._id} className="assignment-card">
                    <h3>{assignment.title}</h3>
                    <p>{assignment.description}</p>
                    <p className="due-date">
                      Due: {new Date(assignment.dueDate).toLocaleString()}
                    </p>
                    
                    {user.role === 'student' ? (
                      <div>
                        {hasStudentSubmitted(assignment._id) ? (
                          <div className="submission-status">
                            <span className="status-badge submitted">Submitted</span>
                            <p className="submission-time">
                              Submitted on: {new Date(getStudentSubmission(assignment._id).submittedAt).toLocaleString()}
                            </p>
                            {getStudentSubmission(assignment._id).grade !== undefined && (
                              <div className="grade-info">
                                <p><strong>Grade:</strong> {getStudentSubmission(assignment._id).grade}/100</p>
                                {getStudentSubmission(assignment._id).feedback && (
                                  <p><strong>Feedback:</strong> {getStudentSubmission(assignment._id).feedback}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <button 
                              onClick={() => setShowSubmitForm({
                                ...showSubmitForm,
                                [assignment._id]: true
                              })}
                              className="btn-primary"
                            >
                              Submit Assignment
                            </button>
                            
                            {showSubmitForm[assignment._id] && (
                              <div className="submission-form">
                                <textarea
                                  value={submissionText}
                                  onChange={(e) => setSubmissionText(e.target.value)}
                                  placeholder="Write your assignment submission here..."
                                  rows="6"
                                />
                                <div className="form-actions">
                                  <button 
                                    onClick={() => handleSubmitAssignment(assignment._id)}
                                    className="btn-primary"
                                  >
                                    Submit
                                  </button>
                                  <button 
                                    onClick={() => setShowSubmitForm({
                                      ...showSubmitForm,
                                      [assignment._id]: false
                                    })}
                                    className="btn-secondary"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <button 
                          onClick={() => {
                            loadSubmissions(assignment._id);
                            setShowSubmissions({
                              ...showSubmissions,
                              [assignment._id]: true
                            });
                          }}
                          className="btn-secondary"
                        >
                          View Submissions
                        </button>
                        
                        {showSubmissions[assignment._id] && teacherSubmissions[assignment._id] && (
                          <div className="submissions-list">
                            <h4>Submissions:</h4>
                            {teacherSubmissions[assignment._id].length > 0 ? (
                              teacherSubmissions[assignment._id].map(submission => (
                                <div key={submission._id} className="submission-item">
                                  <p><strong>Student:</strong> {submission.student?.name || 'Unknown'}</p>
                                  <p><strong>Submission:</strong> {submission.submissionText}</p>
                                  <p><strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}</p>
                                  
                                  {submission.grade !== undefined ? (
                                    <div>
                                      <p><strong>Grade:</strong> {submission.grade}/100</p>
                                      <p><strong>Feedback:</strong> {submission.feedback}</p>
                                    </div>
                                  ) : (
                                    <GradeForm 
                                      submission={submission}
                                      onGrade={handleGradeSubmission}
                                    />
                                  )}
                                </div>
                              ))
                            ) : (
                              <p>No submissions yet</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                selectedCourse && (
                  <div className="empty-state">
                    <h3>No assignments found</h3>
                    <p>
                      {user.role === 'teacher' 
                        ? 'Create your first assignment for this course!' 
                        : 'No assignments available for this course yet.'
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const GradeForm = ({ submission, onGrade }) => {
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (grade && feedback) {
      onGrade(submission._id, parseInt(grade), feedback);
      setGrade('');
      setFeedback('');
    } else {
      alert('Please provide both grade and feedback');
    }
  };

  return (
    <div className="grade-form">
      <div className="form-group">
        <label>Grade (0-100):</label>
        <input
          type="number"
          min="0"
          max="100"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Feedback:</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows="3"
          placeholder="Provide feedback for the student..."
        />
      </div>
      <button onClick={handleSubmit} className="btn-primary">
        Submit Grade
      </button>
    </div>
  );
};

export default Assignments;