import React from 'react';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css'; // This should be the correct path

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <Header />
      <div className="dashboard-content">
        <Navigation />
        <main className="main-content">
          <div className="welcome-section">
            <h2>Welcome to LMS Platform, {user?.name}!</h2>
            <p className="role-badge">Role: {user?.role}</p>
            
            <div className="dashboard-stats">
              {user?.role === 'teacher' ? (
                <>
                  <div className="stat-card">
                    <h3>My Courses</h3>
                    <p>Manage and create courses</p>
                  </div>
                  <div className="stat-card">
                    <h3>Assignments</h3>
                    <p>Create and grade assignments</p>
                  </div>
                  <div className="stat-card">
                    <h3>Students</h3>
                    <p>View enrolled students</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="stat-card">
                    <h3>Enrolled Courses</h3>
                    <p>View your courses</p>
                  </div>
                  <div className="stat-card">
                    <h3>Assignments</h3>
                    <p>Submit and track assignments</p>
                  </div>
                  <div className="stat-card">
                    <h3>Grades</h3>
                    <p>Check your progress</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;