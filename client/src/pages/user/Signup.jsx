import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAuth } from '../../store/hooks';
import { signupUser, clearError } from '../../store/slices/authSlice';
import './AuthPortalForms.css';
import PasswordInput from '../../components/PasswordInput';
import { 
  HiOutlineUser, 
  HiOutlineMail, 
  HiOutlinePhone, 
  HiOutlineLockClosed, 
  HiOutlineArrowRight 
} from 'react-icons/hi';

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const clean = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phone: clean }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
    dispatch(clearError());
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setLocalError('');

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      setLocalError('Mobile number must be exactly 10 digits.');
      return;
    }

    await dispatch(signupUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone
    }));
  };

  return (
    <div className="ap-page">
      <div className="ap-container ap-container-wide">
        <div className="ap-card">
          <div className="ap-header">
            <div className="ap-brand-badge">
              <span>MedMatrix 360</span>
            </div>
            <h1 className="ap-title">Start Your Journey</h1>
            <div className="ap-title-underline"></div>
            <p className="ap-subtitle">Create an account to book and track your medical appointments.</p>
          </div>

          {(error || localError) && (
            <div className="ap-alert ap-alert-error" role="alert">
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="ap-form">
            <div className="ap-form-group">
              <label className="ap-label" htmlFor="signup-name">
                <span>Full Name</span>
                <span className="ap-label-required">*</span>
              </label>
              <div className="ap-input-wrapper">
                <span className="ap-input-icon"><HiOutlineUser /></span>
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  className="ap-input ap-input-with-icon"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="ap-grid-2">
              <div className="ap-form-group">
                <label className="ap-label" htmlFor="signup-email">
                  <span>Email Address</span>
                  <span className="ap-label-required">*</span>
                </label>
                <div className="ap-input-wrapper">
                  <span className="ap-input-icon"><HiOutlineMail /></span>
                  <input
                    id="signup-email"
                    type="email"
                    name="email"
                    className="ap-input ap-input-with-icon"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="ap-form-group">
                <label className="ap-label" htmlFor="signup-phone">
                  <span>Phone Number</span>
                  <span className="ap-label-required">*</span>
                </label>
                <div className="ap-input-wrapper">
                  <span className="ap-input-icon"><HiOutlinePhone /></span>
                  <input
                    id="signup-phone"
                    type="tel"
                    name="phone"
                    className="ap-input ap-input-with-icon"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    pattern="^\d{10}$"
                    inputMode="numeric"
                    title="Phone number must be exactly 10 digits"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="ap-grid-2">
              <div className="ap-form-group">
                <label className="ap-label" htmlFor="signup-password">
                  <span>Create Password</span>
                  <span className="ap-label-required">*</span>
                </label>
                <div className="ap-input-wrapper">
                  <span className="ap-input-icon"><HiOutlineLockClosed /></span>
                  <PasswordInput
                    id="signup-password"
                    name="password"
                    className="ap-input ap-input-with-icon"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="ap-form-group">
                <label className="ap-label" htmlFor="signup-confirm-password">
                  <span>Confirm Password</span>
                  <span className="ap-label-required">*</span>
                </label>
                <div className="ap-input-wrapper">
                  <span className="ap-input-icon"><HiOutlineLockClosed /></span>
                  <PasswordInput
                    id="signup-confirm-password"
                    name="confirmPassword"
                    className="ap-input ap-input-with-icon"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="ap-btn-primary" disabled={loading}>
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              {!loading && <HiOutlineArrowRight />}
            </button>
          </form>

          <div className="ap-divider">Already registered?</div>

          <p className="ap-footer-text">
            Already have an account?
            <Link to="/login" className="ap-link">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;