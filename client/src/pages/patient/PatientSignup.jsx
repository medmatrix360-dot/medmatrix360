import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBranding } from '../../context/BrandingContext';
import { publicAPI, patientAuthAPI, policyAPI } from '../../utils/api';
import '../user/AuthPortalForms.css';
import './PatientPortalLogin.css';
import PasswordInput from '../../components/PasswordInput';
import HospitalPolicyModal from '../../components/HospitalPolicyModal';
import toast from 'react-hot-toast';
import {
    HiOutlineUser,
    HiOutlineMail,
    HiOutlinePhone,
    HiOutlineLockClosed,
    HiOutlineArrowRight,
    HiOutlineArrowLeft,
    HiOutlineShieldCheck
} from 'react-icons/hi';

const PatientSignup = () => {
    const navigate = useNavigate();
    const { loadBranding } = useBranding();
    
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [policyAgreed, setPolicyAgreed] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'mobile') {
            const clean = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, mobile: clean }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setErrorMsg(''); // Clear error on typing
    };

    const validateForm = () => {
        if (!formData.name.trim()) return "Full Name is required.";
        if (formData.name.trim().length < 2) return "Name must be at least 2 characters.";
        if (!formData.mobile.trim()) return "Mobile Number is required.";
        if (!/^\d{10}$/.test(formData.mobile)) return "Mobile number must be exactly 10 digits.";
        if (!formData.email.trim()) return "Email Address is required.";
        if (!formData.password) return "Password is required.";
        if (!formData.confirmPassword) return "Confirm Password is required.";
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) return "Please enter a valid email address.";
        
        if (formData.password.length < 8) return "Password must be at least 8 characters long.";
        
        if (formData.password !== formData.confirmPassword) return "Passwords do not match.";

        if (!policyAgreed) return "You must agree to the hospital's Terms & Policies.";

        return null;
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        
        const validationError = validateForm();
        if (validationError) {
            setErrorMsg(validationError);
            return;
        }

        if (!hospital?.id) {
            setErrorMsg("Hospital context not found. Please refresh the page.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await patientAuthAPI.register(
                formData.name,
                formData.email,
                formData.mobile,
                formData.password,
                hospital.id
            );

            if (response.success) {
                // Record auditable policy acceptance
                try {
                    const patientId = response.patient?._id || response.user?._id;
                    if (patientId) {
                        await policyAPI.acceptPolicies({
                            hospitalId: hospital.id,
                            patientId,
                            source: 'PATIENT_PORTAL_SIGNUP'
                        });
                    }
                } catch (pErr) {
                    console.warn('[Policy Acceptance on Signup]:', pErr.message);
                }

                toast.success("Your account has been created successfully. Please login to continue.");
                navigate('/patient');
            }
        } catch (err) {
            console.error('Registration error', err);
            if (err.response?.data?.message) {
                setErrorMsg(err.response.data.message);
            } else {
                setErrorMsg("Failed to create account. Please try again later.");
            }
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
                            Loading Patient Portal...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ap-page">
            <div className="ap-container ap-container-wide">
                <div className="ap-card">
                    <Link to="/patient" className="ap-back-btn" title="Back to Patient Login">
                        <HiOutlineArrowLeft /> Back to Login
                    </Link>

                    <div className="ap-header">
                        <div className="ap-brand-badge">
                            <HiOutlineShieldCheck /> Patient Access Portal
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
                        <p className="ap-subtitle">Create your secure patient account to access personal health records</p>
                    </div>

                    {errorMsg && (
                        <div className="ap-alert ap-alert-error" role="alert">
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form className="ap-form" onSubmit={handleSignup} noValidate>
                        <div className="ap-form-group">
                            <label className="ap-label" htmlFor="patient-name">
                                Full Name <span className="ap-label-required">*</span>
                            </label>
                            <div className="ap-input-wrapper">
                                <HiOutlineUser className="ap-input-icon" />
                                <input
                                    id="patient-name"
                                    type="text"
                                    name="name"
                                    className="ap-input ap-input-with-icon"
                                    placeholder="e.g. Eleanor Vance"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    minLength={2}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="ap-grid-2">
                            <div className="ap-form-group">
                                <label className="ap-label" htmlFor="patient-mobile">
                                    Mobile Number <span className="ap-label-required">*</span>
                                </label>
                                <div className="ap-input-wrapper">
                                    <HiOutlinePhone className="ap-input-icon" />
                                    <input
                                        id="patient-mobile"
                                        type="tel"
                                        name="mobile"
                                        className="ap-input ap-input-with-icon"
                                        placeholder="10-digit number"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        required
                                        maxLength={10}
                                        inputMode="numeric"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="ap-form-group">
                                <label className="ap-label" htmlFor="patient-email">
                                    Email Address <span className="ap-label-required">*</span>
                                </label>
                                <div className="ap-input-wrapper">
                                    <HiOutlineMail className="ap-input-icon" />
                                    <input
                                        id="patient-email"
                                        type="email"
                                        name="email"
                                        className="ap-input ap-input-with-icon"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="ap-grid-2">
                            <div className="ap-form-group">
                                <label className="ap-label" htmlFor="patient-password">
                                    Password <span className="ap-label-required">*</span>
                                </label>
                                <div className="ap-input-wrapper">
                                    <HiOutlineLockClosed className="ap-input-icon" />
                                    <PasswordInput
                                        id="patient-password"
                                        name="password"
                                        className="ap-input ap-input-with-icon"
                                        placeholder="Min. 8 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="ap-form-group">
                                <label className="ap-label" htmlFor="patient-confirm-password">
                                    Confirm Password <span className="ap-label-required">*</span>
                                </label>
                                <div className="ap-input-wrapper">
                                    <HiOutlineLockClosed className="ap-input-icon" />
                                    <PasswordInput
                                        id="patient-confirm-password"
                                        name="confirmPassword"
                                        className="ap-input ap-input-with-icon"
                                        placeholder="Confirm password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Policy Agreement Checkbox */}
                        <div className="ap-checkbox-row">
                            <input
                                type="checkbox"
                                id="signup-policy-agree"
                                className="ap-checkbox"
                                checked={policyAgreed}
                                onChange={(e) => setPolicyAgreed(e.target.checked)}
                                disabled={isSubmitting}
                            />
                            <label htmlFor="signup-policy-agree">
                                I agree to the hospital's{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowPolicyModal(true)}
                                    className="ap-inline-link"
                                >
                                    Terms & Policies
                                </button>
                            </label>
                        </div>

                        <button type="submit" className="ap-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="ap-spinner"></span>
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Patient Account</span>
                                    <HiOutlineArrowRight />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="ap-divider">Already registered?</div>

                    <Link to="/patient" className="ap-btn-secondary">
                        Sign In to Patient Portal
                    </Link>
                </div>
            </div>

            {/* Hospital Policy Reader Modal */}
            <HospitalPolicyModal
                isOpen={showPolicyModal}
                onClose={() => setShowPolicyModal(false)}
                onAccept={() => {
                    setPolicyAgreed(true);
                    setShowPolicyModal(false);
                }}
                hospitalId={hospital?.id}
                applicableTo="PATIENT_REGISTRATION"
                alreadyAccepted={policyAgreed}
            />
        </div>
    );
};

export default PatientSignup;
