import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBranding } from '../../context/BrandingContext';
import { publicAPI, patientAuthAPI } from '../../utils/api';
import '../user/AuthPortalForms.css';
import './PatientPortalLogin.css';
import {
    HiOutlineMail,
    HiOutlineArrowLeft,
    HiOutlineKey,
    HiOutlinePaperAirplane,
    HiOutlineShieldCheck
} from 'react-icons/hi';

const PatientForgotPassword = () => {
    const { loadBranding } = useBranding();
    
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [resetLink, setResetLink] = useState('');

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
        setResetLink('');

        if (!email.trim()) {
            setErrorMsg('Email Address is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await patientAuthAPI.forgotPassword(email.trim(), hospital?.id);
            if (res.success) {
                setSuccessMsg('Reset link generated successfully.');
                
                // Construct a clickable reset link on screen for local testing!
                const token = res.token;
                const link = `${window.location.protocol}//${window.location.host}/patient/reset-password?token=${token}`;
                setResetLink(link);
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            setErrorMsg(err.response?.data?.message || 'Failed to process request.');
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
                            <HiOutlineKey /> Account Recovery
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
                        <p className="ap-subtitle">Enter your registered email address to receive password reset instructions</p>
                    </div>

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

                    {resetLink && (
                        <div className="ap-mock-box">
                            <strong style={{ color: 'var(--ap-cyan-glow, #38bdf8)', display: 'block', marginBottom: '4px' }}>
                                [Development Testing Reset Link]
                            </strong>
                            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--ap-text-secondary, #cbd5e1)' }}>
                                In production, an email is dispatched. In this development environment, use the direct link below:
                            </p>
                            <Link 
                                to={`/patient/reset-password?token=${resetLink.split('token=')[1]}`} 
                                className="ap-link"
                                style={{ wordBreak: 'break-all', display: 'inline-block' }}
                            >
                                Continue to Password Reset &rarr;
                            </Link>
                        </div>
                    )}

                    <form className="ap-form" onSubmit={handleSubmit} noValidate>
                        <div className="ap-form-group">
                            <label className="ap-label" htmlFor="patient-recovery-email">
                                Registered Email Address <span className="ap-label-required">*</span>
                            </label>
                            <div className="ap-input-wrapper">
                                <HiOutlineMail className="ap-input-icon" />
                                <input 
                                    id="patient-recovery-email"
                                    type="email" 
                                    className="ap-input ap-input-with-icon"
                                    placeholder="Enter your registered email" 
                                    required 
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <button type="submit" className="ap-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="ap-spinner"></span>
                                    <span>Sending Link...</span>
                                </>
                            ) : (
                                <>
                                    <span>Send Reset Instructions</span>
                                    <HiOutlinePaperAirplane style={{ transform: 'rotate(90deg)' }} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="ap-divider">Remember your credentials?</div>

                    <Link to="/patient" className="ap-btn-secondary">
                        Back to Patient Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PatientForgotPassword;
