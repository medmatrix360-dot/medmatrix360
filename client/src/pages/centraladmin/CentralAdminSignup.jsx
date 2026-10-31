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

const CentralAdminSignup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '', phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

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
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                navigate('/supremeadmin');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating Central Admin account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ap-page">
            <div className="ap-container ap-container-wide">
                <div className="ap-card">
                    <button onClick={() => navigate('/')} className="ap-back-btn" type="button">
                        <HiOutlineArrowLeft />
                        <span>Go Back</span>
                    </button>

                    <div className="ap-header">
                        <div className="ap-brand-badge">
                            <span>Central Admin Core</span>
                        </div>
                        <h1 className="ap-title">Create Central Admin Account</h1>
                        <div className="ap-title-underline"></div>
                        <p className="ap-subtitle">Provision master credentials for top-level multi-tenant administration.</p>
                    </div>

                    {error && (
                        <div className="ap-alert ap-alert-error" role="alert">
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="ap-form">
                        <div className="ap-form-group">
                            <label className="ap-label" htmlFor="ca-name">
                                <span>Full Name</span>
                                <span className="ap-label-required">*</span>
                            </label>
                            <div className="ap-input-wrapper">
                                <span className="ap-input-icon"><HiOutlineUser /></span>
                                <input 
                                    type="text" 
                                    id="ca-name" 
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
                                <label className="ap-label" htmlFor="ca-email">
                                    <span>Email Address</span>
                                    <span className="ap-label-required">*</span>
                                </label>
                                <div className="ap-input-wrapper">
                                    <span className="ap-input-icon"><HiOutlineMail /></span>
                                    <input 
                                        type="email" 
                                        id="ca-email" 
                                        name="email" 
                                        className="ap-input ap-input-with-icon"
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        placeholder="Enter administrator email" 
                                        required 
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="ap-form-group">
                                <label className="ap-label" htmlFor="ca-phone">
                                    <span>Phone Number</span>
                                </label>
                                <div className="ap-input-wrapper">
                                    <span className="ap-input-icon"><HiOutlinePhone /></span>
                                    <input 
                                        type="tel" 
                                        id="ca-phone" 
                                        name="phone" 
                                        className="ap-input ap-input-with-icon"
                                        pattern="^\d{10}$" 
                                        maxLength={10} 
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
                                <label className="ap-label" htmlFor="ca-password">
                                    <span>Password</span>
                                    <span className="ap-label-required">*</span>
                                </label>
                                <div className="ap-input-wrapper">
                                    <span className="ap-input-icon"><HiOutlineLockClosed /></span>
                                    <PasswordInput 
                                        id="ca-password" 
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
                                <label className="ap-label" htmlFor="ca-confirm-password">
                                    <span>Confirm Password</span>
                                    <span className="ap-label-required">*</span>
                                </label>
                                <div className="ap-input-wrapper">
                                    <span className="ap-input-icon"><HiOutlineLockClosed /></span>
                                    <PasswordInput 
                                        id="ca-confirm-password" 
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

                        <button type="submit" className="ap-btn-primary" disabled={loading}>
                            <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
                            {!loading && <HiOutlineArrowRight />}
                        </button>
                    </form>

                    <div className="ap-divider">Already registered?</div>

                    <p className="ap-footer-text">
                        Already have a Central Admin account?
                        <Link to="/supremeadmin/login" className="ap-link">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CentralAdminSignup;
