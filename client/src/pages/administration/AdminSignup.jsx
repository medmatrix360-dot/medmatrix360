import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import '../user/AuthPortalForms.css';
import PasswordInput from '../../components/PasswordInput';
import { 
  HiOutlineUser, 
  HiOutlineMail, 
  HiOutlinePhone, 
  HiOutlineLockClosed, 
  HiOutlineArrowRight,
  HiOutlineArrowLeft 
} from 'react-icons/hi';

const AdminSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await adminAPI.signup(formData.name, formData.email, formData.password, formData.phone);

      if (response.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Navigate to superadmin dashboard
        navigate('/superadmin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating Super Admin account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/"); // Go back to home page
  };

  return (
    <div className="ap-page">
      <div className="ap-container ap-container-wide">
        <div className="ap-card">
          <button 
            onClick={handleGoBack}
            className="ap-back-btn"
            type="button"
          >
            <HiOutlineArrowLeft />
            <span>Go Back</span>
          </button>

          <div className="ap-header">
            <div className="ap-brand-badge">
              <span>Super Admin Provisioning</span>
            </div>
            <h1 className="ap-title">Create Super Admin Account</h1>
            <div className="ap-title-underline"></div>
            <p className="ap-subtitle">Register master administrator credentials for platform supervision.</p>
          </div>

          {error && (
            <div className="ap-alert ap-alert-error" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="ap-form">
            <div className="ap-form-group">
              <label className="ap-label" htmlFor="admin-name">
                <span>Full Name</span>
                <span className="ap-label-required">*</span>
              </label>
              <div className="ap-input-wrapper">
                <span className="ap-input-icon"><HiOutlineUser /></span>
                <input
                  type="text"
                  id="admin-name"
                  name="name"
                  className="ap-input ap-input-with-icon"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="ap-grid-2">
              <div className="ap-form-group">
                <label className="ap-label" htmlFor="admin-email">
                  <span>Email Address</span>
                  <span className="ap-label-required">*</span>
                </label>
                <div className="ap-input-wrapper">
                  <span className="ap-input-icon"><HiOutlineMail /></span>
                  <input
                    type="email"
                    id="admin-email"
                    name="email"
                    className="ap-input ap-input-with-icon"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter admin email"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="ap-form-group">
                <label className="ap-label" htmlFor="admin-phone">
                  <span>Phone Number</span>
                </label>
                <div className="ap-input-wrapper">
                  <span className="ap-input-icon"><HiOutlinePhone /></span>
                  <input
                    pattern="\d{10}"
                    maxLength={10}
                    type="tel"
                    id="admin-phone"
                    name="phone"
                    className="ap-input ap-input-with-icon"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile (optional)"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="ap-grid-2">
              <div className="ap-form-group">
                <label className="ap-label" htmlFor="admin-password">
                  <span>Password</span>
                  <span className="ap-label-required">*</span>
                </label>
                <div className="ap-input-wrapper">
                  <span className="ap-input-icon"><HiOutlineLockClosed /></span>
                  <PasswordInput
                    id="admin-password"
                    name="password"
                    className="ap-input ap-input-with-icon"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="ap-form-group">
                <label className="ap-label" htmlFor="admin-confirm-password">
                  <span>Confirm Password</span>
                  <span className="ap-label-required">*</span>
                </label>
                <div className="ap-input-wrapper">
                  <span className="ap-input-icon"><HiOutlineLockClosed /></span>
                  <PasswordInput
                    id="admin-confirm-password"
                    name="confirmPassword"
                    className="ap-input ap-input-with-icon"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="ap-btn-primary"
              disabled={loading}
            >
              <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
              {!loading && <HiOutlineArrowRight />}
            </button>
          </form>

          <div className="ap-divider">Account Navigation</div>

          <p className="ap-footer-text">
            Already have a Super Admin account?
            <Link to="/superadmin/login" className="ap-link">Sign In</Link>
          </p>

          <p className="ap-footer-text" style={{ marginTop: '8px', fontSize: '12px' }}>
            Looking for regular patient/user signup?
            <Link to="/signup" className="ap-link" style={{ fontSize: '12px' }}>User Signup</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
