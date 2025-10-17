import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navigation.css';

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sidebar">
      <div className="nav-links">
        <Link 
          to="/dashboard" 
          className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        
        <Link 
          to="/courses" 
          className={`nav-link ${isActive('/courses') ? 'active' : ''}`}
        >
          {user?.role === 'teacher' ? 'My Courses' : 'Available Courses'}
        </Link>
        
        <Link 
          to="/assignments" 
          className={`nav-link ${isActive('/assignments') ? 'active' : ''}`}
        >
          Assignments
        </Link>
        
        <Link 
          to="/grading" 
          className={`nav-link ${isActive('/grading') ? 'active' : ''}`}
        >
          Grading Dashboard
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;