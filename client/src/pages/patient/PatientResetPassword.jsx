import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useBranding } from '../../context/BrandingContext';
import { publicAPI, patientAuthAPI } from '../../utils/api';
import '../user/AuthPortalForms.css';
import './PatientPortalLogin.css';
import PasswordInput from '../../components/PasswordInput';
import toast from 'react-hot-toast';
import {
    HiOutlineLockClosed,
    HiOutlineArrowLeft,
    HiOutlineKey,
    HiOutlineExclamationCircle,
    HiOutlineCheckCircle
} from 'react-icons/hi';

const PatientResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { loadBranding } = useBranding();
    
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    const token = searchParams.get('token');

    useEffect(() => {
        const resolveHospital = async () => {
            try {
                setLoading(true);
                const domain = window.location.hostname;
                const res = await publicAPI.getTenantConfig(domain);
                
                if (res.success && res.tenant) {
                    setHospital({
                        id: res.tenant.id,
                        name: res.tenant.name,
                        logo: res.tenant.branding?.logoUrl
                    });
                    
                    if (res.tenant.id) {
                        loadBranding(res.tenant.id);
                    }
                }
            } catch (err) {
                console.error('Could not load hospital branding', err);
            } finally {
                setLoading(false);
            }
        };
        resolveHospital();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!token) {
            setErrorMsg('Invalid or missing password reset token.');
            return;
        }

        if (!password || !confirmPassword) {
            setErrorMsg('Password and confirm password are required.');
            return;
        }

        if (password.length < 8) {
            setErrorMsg('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await patientAuthAPI.resetPassword(token, password);
            if (res.success) {
                setSuccessMsg('Your password has been successfully reset.');
                toast.success('Your password has been reset successfully. Please login to continue.');
                navigate('/patient');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setErrorMsg(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="ap-page">
                <div className="ap-container" style={{ textAlign: 'center' }}>
                    <div className="ap-card" style={{ padding: '48px 24px' }}>
                        <div className="ap-spinner" style={{ margin: '0 auto 16px auto', width: '28px', height: '28px' }}></div>
                        <div style={{ color: 'var(--ap-cyan-glow, #38bdf8)', fontWeight: 600, fontSize: '15px' }}>
                            Loading Portal...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ap-page">
            <div className="ap-container">
                <div className="ap-card">
                    <Link to="/patient" className="ap-back-btn" title="Back to Patient Login">
                        <HiOutlineArrowLeft /> Back to Login
                    </Link>

                    <div className="ap-header">
                        <div className="ap-brand-badge">
                            <HiOutlineKey /> Password Security
                        </div>

                        {hospital?.logo ? (
                            <div className="ap-brand-logo-wrap">
                                <img src={hospital.logo} alt={hospital?.name || "Hospital Logo"} className="ap-brand-logo" />
                            </div>
                        ) : (
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏥</div>
                        )}

                        <h1 className="ap-title">{hospital?.name || 'Welcome to Our Hospital'}</h1>
                        <span className="ap-title-underline"></span>
                        <p className="ap-subtitle">Create a strong new password for your patient account</p>
                    </div>

                    {!token ? (
                        <div style={{ width: '100%', textAlign: 'center' }}>
                            <div className="ap-alert ap-alert-error" style={{ textAlign: 'left', marginBottom: '20px' }} role="alert">
                                <HiOutlineExclamationCircle style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }} />
                                <span>Invalid or missing password reset token. Please request a new link.</span>
                            </div>
                            <Link to="/patient/forgot-password" className="ap-btn-primary" style={{ textDecoration: 'none' }}>
                                Request New Reset Link
                            </Link>
                        </div>
                    ) : (
                        <>
                            {errorMsg && (
                                <div className="ap-alert ap-alert-error" role="alert">
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {successMsg && (
                                <div className="ap-alert ap-alert-success" role="status">
                                    <span>{successMsg}</span>
                                </div>
                            )}

                            <form className="ap-form" onSubmit={handleSubmit} noValidate>
                                <div className="ap-form-group">
                                    <label className="ap-label" htmlFor="reset-new-password">
                                        New Password <span className="ap-label-required">*</span>
                                    </label>
                                    <div className="ap-input-wrapper">
                                        <HiOutlineLockClosed className="ap-input-icon" />
                                        <PasswordInput 
                                            id="reset-new-password"
                                            className="ap-input ap-input-with-icon"
                                            placeholder="Enter new password (min. 8 characters)" 
                                            required 
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="ap-form-group">
                                    <label className="ap-label" htmlFor="reset-confirm-password">
                                        Confirm New Password <span className="ap-label-required">*</span>
                                    </label>
                                    <div className="ap-input-wrapper">
                                        <HiOutlineLockClosed className="ap-input-icon" />
                                        <PasswordInput 
                                            id="reset-confirm-password"
                                            className="ap-input ap-input-with-icon"
                                            placeholder="Confirm your new password" 
                                            required 
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="ap-btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="ap-spinner"></span>
                                            <span>Updating Password...</span>
                                        </>
                                    ) : (
                                        <>
                                            <HiOutlineCheckCircle />
                                            <span>Update Password</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    <div className="ap-divider">Remember your credentials?</div>

                    <Link to="/patient" className="ap-btn-secondary">
                        Back to Patient Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PatientResetPassword;
