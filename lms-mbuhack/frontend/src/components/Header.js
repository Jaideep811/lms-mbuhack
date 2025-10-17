import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">LMS Platform</h1>
        <nav className="nav">
          <span className="user-info">
            Welcome, {user?.name} ({user?.role})
          </span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;