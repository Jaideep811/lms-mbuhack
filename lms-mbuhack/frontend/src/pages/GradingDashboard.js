import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { 
  getTeacherGradingDashboard, 
  getStudentGradingDashboard 
} from '../services/api';
import '../styles/GradingDashboard.css';

const GradingDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGradingData();
  }, []);

  const loadGradingData = async () => {
    try {
      setLoading(true);
      setError('');
      let response;
      if (user.role === 'teacher') {
        response = await getTeacherGradingDashboard();
      } else {
        response = await getStudentGradingDashboard();
      }
      
      // FIX: Handle different response formats
      if (response.data && response.data.data) {
        setData(response.data.data);
      } else if (response.data) {
        setData(response.data);
      } else {
        console.error('Unexpected grading data response format:', response.data);
        setError('Failed to load grading data: Unexpected format');
      }
    } catch (error) {
      console.error('Error loading grading data:', error);
      setError('Failed to load grading data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grading-dashboard">
        <Header />
        <div className="page-content">
          <Navigation />
          <main className="main-content">
            <div className="loading">Loading grading data...</div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grading-dashboard">
        <Header />
        <div className="page-content">
          <Navigation />
          <main className="main-content">
            <div className="error-message">{error}</div>
            <button onClick={loadGradingData} className="btn-primary">
              Retry
            </button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="grading-dashboard">
      <Header />
      <div className="page-content">
        <Navigation />
        <main className="main-content">
          <h2>Grading Dashboard</h2>
          
          {user.role === 'teacher' ? (
            <TeacherGradingView data={data} />
          ) : (
            <StudentGradingView data={data} />
          )}
        </main>
      </div>
    </div>
  );
};

const TeacherGradingView = ({ data }) => {
  // FIX: Ensure data is an array
  const submissions = Array.isArray(data) ? data : [];
  
  return (
    <div className="teacher-grading">
      <div className="stats-overview">
        <h3>Submissions Overview</h3>
        <p>Total Submissions: {submissions.length}</p>
        <p>Graded: {submissions.filter(sub => sub.grade !== undefined).length}</p>
        <p>Pending: {submissions.filter(sub => sub.grade === undefined).length}</p>
      </div>
      
      {submissions.length > 0 ? (
        <div className="submissions-table">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Assignment</th>
                <th>Submitted</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(submission => (
                <tr key={submission._id}>
                  <td>{submission.student?.name || 'Unknown'}</td>
                  <td>{submission.course?.title || 'Unknown'}</td>
                  <td>{submission.assignment?.title || 'Unknown'}</td>
                  <td>{new Date(submission.submittedAt).toLocaleDateString()}</td>
                  <td>
                    {submission.grade !== undefined ? `${submission.grade}/100` : 'Not Graded'}
                  </td>
                  <td>
                    <span className={`status ${submission.grade !== undefined ? 'graded' : 'pending'}`}>
                      {submission.grade !== undefined ? 'Graded' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No submissions found</h3>
          <p>When students submit assignments, they will appear here for grading.</p>
        </div>
      )}
    </div>
  );
};

const StudentGradingView = ({ data }) => {
  // FIX: Handle different data structures for student view
  let submissions = [];
  let averageGrade = 0;
  let totalAssignments = 0;
  let gradedAssignments = 0;

  if (data) {
    if (Array.isArray(data.submissions)) {
      // New format: { submissions, averageGrade, totalAssignments, gradedAssignments }
      submissions = data.submissions;
      averageGrade = data.averageGrade || 0;
      totalAssignments = data.totalAssignments || 0;
      gradedAssignments = data.gradedAssignments || 0;
    } else if (Array.isArray(data)) {
      // Old format: direct array
      submissions = data;
      const gradedSubs = submissions.filter(sub => sub.grade !== undefined);
      averageGrade = gradedSubs.length > 0 
        ? gradedSubs.reduce((sum, sub) => sum + sub.grade, 0) / gradedSubs.length 
        : 0;
      totalAssignments = submissions.length;
      gradedAssignments = gradedSubs.length;
    }
  }

  return (
    <div className="student-grading">
      <div className="grade-stats">
        <div className="stat-card">
          <h3>Average Grade</h3>
          <p className="grade-value">{Math.round(averageGrade)}%</p>
        </div>
        <div className="stat-card">
          <h3>Total Assignments</h3>
          <p>{totalAssignments}</p>
        </div>
        <div className="stat-card">
          <h3>Graded</h3>
          <p>{gradedAssignments}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p>{totalAssignments - gradedAssignments}</p>
        </div>
      </div>

      <div className="submissions-list">
        <h3>Assignment Grades</h3>
        {submissions.length > 0 ? (
          submissions.map(submission => (
            <div key={submission._id} className="submission-grade-card">
              <div className="submission-header">
                <h4>{submission.assignment?.title || 'Unknown Assignment'}</h4>
                <span className={`grade-badge ${submission.grade !== undefined ? 'graded' : 'pending'}`}>
                  {submission.grade !== undefined ? `${submission.grade}/100` : 'Pending'}
                </span>
              </div>
              <p className="course-name">
                Course: {submission.course?.title || 'Unknown Course'}
              </p>
              <p className="submission-date">
                Submitted: {new Date(submission.submittedAt).toLocaleString()}
              </p>
              {submission.gradedAt && (
                <p className="graded-date">
                  Graded: {new Date(submission.gradedAt).toLocaleString()}
                </p>
              )}
              {submission.feedback && (
                <div className="feedback">
                  <strong>Feedback:</strong> {submission.feedback}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>No assignment submissions found</h3>
            <p>Submit assignments to see your grades and feedback here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradingDashboard;