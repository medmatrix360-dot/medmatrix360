import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/hooks';
import { doctorAPI } from '../../utils/api';
import { useBranding } from '../../context/BrandingContext';
import { 
    FiUsers, FiActivity, FiFileText, FiHeart, FiLock, 
    FiZap, FiPackage, FiClipboard, FiCheckCircle, FiCpu,
    FiCalendar, FiClock, FiArrowRight, FiShield, FiCheck
} from 'react-icons/fi';
import { FaFlask, FaCapsules, FaStethoscope } from 'react-icons/fa';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [localUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    });

    const user = authUser || localUser || {};
    const { hospitalName } = useBranding?.() || {};
    const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0, total: 0 });
    const [loading, setLoading] = useState(false);

    // Time-based greeting (Morning, Afternoon, Evening)
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Good morning,';
        if (hour >= 12 && hour < 17) return 'Good afternoon,';
        return 'Good evening,';
    }, []);

    // Doctor display name
    const doctorDisplayName = useMemo(() => {
        const rawName = user.name || 'Doctor';
        return rawName.replace(/^Dr\.?\s*/i, '');
    }, [user.name]);

    const formattedTodayDate = useMemo(() => {
        return new Date().toLocaleDateString('en-GB', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    }, []);

    useEffect(() => {
        const fetchDoctorStats = async () => {
            try {
                setLoading(true);
                const aptRes = await doctorAPI.getAppointments();
                if (aptRes?.success) {
                    const apts = aptRes.appointments || [];
                    const todayStr = new Date().toISOString().split('T')[0];
                    const todayApts = apts.filter(a => a.appointmentDate && String(a.appointmentDate).startsWith(todayStr));
                    const pendingApts = apts.filter(a => ['pending', 'confirmed', 'scheduled', 'in_progress'].includes(a.status));
                    const completedApts = apts.filter(a => a.status === 'completed');

                    setStats({
                        today: todayApts.length,
                        pending: pendingApts.length,
                        completed: completedApts.length,
                        total: apts.length
                    });
                }
            } catch (err) {
                console.error("Error fetching doctor stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorStats();
    }, []);

    // Non-clickable display-only permission items
    const permissionItems = [
        {
            id: 'ai_assistant',
            title: 'AI Assistant',
            icon: <FiCpu />
        },
        {
            id: 'visit_diagnose',
            title: 'Visit Diagnose',
            icon: <FaStethoscope />
        },
        {
            id: 'patient_view',
            title: 'Patient View',
            icon: <FiUsers />
        },
        {
            id: 'clinical_history',
            title: 'Clinical History View',
            icon: <FiFileText />
        },
        {
            id: 'lab_view',
            title: 'Lab View',
            icon: <FaFlask />
        },
        {
            id: 'pharmacy_view',
            title: 'Pharmacy View',
            icon: <FaCapsules />
        }
    ];

    return (
        <div className="doc-main-dashboard-container">
            {/* 1. HERO BANNER SECTION (Clean Healthcare SaaS Surface with MedMatrix 360 Theme) */}
            <div className="doc-hero-banner">
                <div className="doc-hero-content">
                    <div className="doc-hero-badge">
                        <span className="doc-hero-badge-dot" />
                        <span>{hospitalName ? `${hospitalName} • Clinical Portal` : 'MedMatrix 360 • Doctor Console'}</span>
                    </div>

                    <h1 className="doc-hero-heading">
                        {greeting}{' '}
                        <span className="doc-hero-name-highlight">
                            Dr. {doctorDisplayName}
                        </span>
                    </h1>

                    <p className="doc-hero-subtext">
                        Welcome to your clinical dashboard. Review your consultation schedule, track patient queues in real-time, and access integrated diagnostic tools.
                    </p>
                </div>

                <div className="doc-hero-right-meta">
                    <div className="doc-hero-date-card">
                        <div className="doc-hero-date-icon-wrap">
                            <FiCalendar />
                        </div>
                        <div className="doc-hero-date-info">
                            <span className="doc-hero-date-label">Today</span>
                            <span className="doc-hero-date-val">{formattedTodayDate}</span>
                        </div>
                    </div>
                    <div className="doc-hero-status-pill">
                        <span className="doc-hero-pulse-dot" />
                        <span>Duty Status: Active</span>
                    </div>
                </div>
            </div>

            {/* 2. MAIN BODY CONTENT */}
            <div className="doc-main-body-content">
                {/* 2A. KPI METRICS CARDS */}
                <div className="doc-section-block">
                    <div className="doc-section-header">
                        <FiActivity className="doc-section-icon" />
                        <h2>APPOINTMENT & QUEUE OVERVIEW</h2>
                    </div>

                    <div className="doc-kpi-grid">
                        <div 
                            className="doc-kpi-card doc-kpi-today"
                            onClick={() => navigate('/doctor/patients')}
                            role="button"
                            tabIndex={0}
                            title="Click to view today's patient queue"
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/doctor/patients'); }}
                        >
                            <div className="doc-kpi-header">
                                <span className="doc-kpi-label">Today's Appointments</span>
                                <div className="doc-kpi-icon-wrap">
                                    <FiCalendar className="doc-kpi-icon" />
                                </div>
                            </div>
                            <div className="doc-kpi-body">
                                <div className="doc-kpi-value">{loading ? '—' : stats.today}</div>
                                <div className="doc-kpi-subtext">Bookings scheduled for today</div>
                            </div>
                            <div className="doc-kpi-footer-link">
                                <span>Open today's queue</span>
                                <FiArrowRight size={13} />
                            </div>
                        </div>

                        <div 
                            className="doc-kpi-card doc-kpi-pending"
                            onClick={() => navigate('/doctor/patients')}
                            role="button"
                            tabIndex={0}
                            title="Click to view pending appointments"
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/doctor/patients'); }}
                        >
                            <div className="doc-kpi-header">
                                <span className="doc-kpi-label">In-Queue / Pending</span>
                                <div className="doc-kpi-icon-wrap">
                                    <FiClock className="doc-kpi-icon" />
                                </div>
                            </div>
                            <div className="doc-kpi-body">
                                <div className="doc-kpi-value">{loading ? '—' : stats.pending}</div>
                                <div className="doc-kpi-subtext">Awaiting clinical consultation</div>
                            </div>
                            <div className="doc-kpi-footer-link">
                                <span>Review waiting list</span>
                                <FiArrowRight size={13} />
                            </div>
                        </div>

                        <div 
                            className="doc-kpi-card doc-kpi-completed"
                            onClick={() => navigate('/doctor/patients')}
                            role="button"
                            tabIndex={0}
                            title="Click to view completed consultations"
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/doctor/patients'); }}
                        >
                            <div className="doc-kpi-header">
                                <span className="doc-kpi-label">Completed Consultations</span>
                                <div className="doc-kpi-icon-wrap">
                                    <FiCheckCircle className="doc-kpi-icon" />
                                </div>
                            </div>
                            <div className="doc-kpi-body">
                                <div className="doc-kpi-value">{loading ? '—' : stats.completed}</div>
                                <div className="doc-kpi-subtext">Visits concluded & documented</div>
                            </div>
                            <div className="doc-kpi-footer-link">
                                <span>View completed history</span>
                                <FiArrowRight size={13} />
                            </div>
                        </div>

                        <div 
                            className="doc-kpi-card doc-kpi-total"
                            onClick={() => navigate('/doctor/patients')}
                            role="button"
                            tabIndex={0}
                            title="Click to view all patient appointments"
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/doctor/patients'); }}
                        >
                            <div className="doc-kpi-header">
                                <span className="doc-kpi-label">Total Appointments</span>
                                <div className="doc-kpi-icon-wrap">
                                    <FiUsers className="doc-kpi-icon" />
                                </div>
                            </div>
                            <div className="doc-kpi-body">
                                <div className="doc-kpi-value">{loading ? '—' : stats.total}</div>
                                <div className="doc-kpi-subtext">Lifetime patient consultations</div>
                            </div>
                            <div className="doc-kpi-footer-link">
                                <span>Explore all records</span>
                                <FiArrowRight size={13} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2B. QUICK ACCESS SECTION */}
                <div className="doc-section-block">
                    <div className="doc-section-header">
                        <FiZap className="doc-section-icon" />
                        <h2>QUICK ACCESS CLINICAL TOOLS</h2>
                    </div>

                    <div className="doc-quick-access-grid">
                        <div 
                            className="doc-quick-access-card" 
                            onClick={() => navigate('/doctor/patients')}
                            title="Click to access Patient Queue and Workspace"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/doctor/patients'); }}
                        >
                            <div className="doc-quick-left">
                                <div className="doc-quick-icon-wrapper">
                                    <FiUsers className="doc-quick-icon" />
                                </div>
                                <div className="doc-quick-info">
                                    <div className="doc-quick-title-row">
                                        <h3 className="doc-quick-title">Patient Queue & Workspace</h3>
                                        <span className="doc-quick-tag">PRIMARY WORKSPACE</span>
                                    </div>
                                    <p className="doc-quick-desc">Manage appointment queue, record patient vitals, and initiate clinical encounters</p>
                                </div>
                            </div>

                            <div className="doc-quick-action-cue">
                                <span>Open Queue</span>
                                <FiArrowRight className="doc-quick-arrow" />
                            </div>
                        </div>

                        <div 
                            className="doc-quick-access-card doc-quick-ai-card" 
                            onClick={() => navigate('/doctor/ai-assistant')}
                            title="Click to launch AI Clinical Assistant"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/doctor/ai-assistant'); }}
                        >
                            <div className="doc-quick-left">
                                <div className="doc-quick-icon-wrapper doc-ai-icon-wrap">
                                    <FiCpu className="doc-quick-icon" />
                                </div>
                                <div className="doc-quick-info">
                                    <div className="doc-quick-title-row">
                                        <h3 className="doc-quick-title">AI Clinical Assistant</h3>
                                        <span className="doc-quick-ai-badge">AI CLINICAL</span>
                                    </div>
                                    <p className="doc-quick-desc">Diagnostic intelligence, medical report interpretation, and clinical decision support</p>
                                </div>
                            </div>

                            <div className="doc-quick-action-cue doc-ai-action-cue">
                                <span>Launch Assistant</span>
                                <FiArrowRight className="doc-quick-arrow" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2C. YOUR PERMISSIONS SECTION (Display-Only / Non-Clickable Badges) */}
                <div className="doc-section-block">
                    <div className="doc-section-header">
                        <FiLock className="doc-section-icon" />
                        <h2>ROLE AUTHORIZATION & ACCESS PRIVILEGES</h2>
                    </div>

                    <div className="doc-permissions-container">
                        {permissionItems.map((item) => (
                            <div 
                                key={item.id} 
                                className="doc-permission-pill"
                            >
                                <div className="doc-permission-icon-circle">
                                    {item.icon}
                                </div>
                                <div className="doc-permission-text-col">
                                    <span className="doc-permission-label">{item.title}</span>
                                    <span className="doc-permission-status-tag">Authorized</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;