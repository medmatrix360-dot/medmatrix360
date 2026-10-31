import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    FiScissors, FiFileText, FiSearch, FiRefreshCw, 
    FiCalendar, FiUser, FiArrowRight, FiCheckCircle,
    FiX, FiMapPin
} from 'react-icons/fi';
import { referralAPI, otAPI } from '../../utils/api';
import './Patient.css';

const DoctorSurgeries = ({ defaultTab = 'referrals' }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Active tab state: 'referrals' | 'plans'
    const initialTab = searchParams.get('tab') || defaultTab || 'referrals';
    const [activeTab, setActiveTab] = useState(initialTab === 'plans' || initialTab === 'surgery_plans' ? 'plans' : 'referrals');

    // Sync tab with URL
    useEffect(() => {
        const queryTab = searchParams.get('tab');
        if (queryTab === 'plans' || queryTab === 'surgery_plans') {
            setActiveTab('plans');
        } else if (queryTab === 'referrals') {
            setActiveTab('referrals');
        }
    }, [searchParams]);

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setSearchParams({ tab: tabKey });
    };

    // ─── 1. SURGERY REFERRALS STATE & LOGIC ─────────────────────────────────────
    const [referrals, setReferrals] = useState([]);
    const [loadingReferrals, setLoadingReferrals] = useState(true);
    const [searchReferrals, setSearchReferrals] = useState('');
    const [statusFilterReferrals, setStatusFilterReferrals] = useState('all');

    const fetchReferrals = async () => {
        setLoadingReferrals(true);
        try {
            const res = await referralAPI.getMyReferrals();
            if (res.success && Array.isArray(res.referrals)) {
                setReferrals(res.referrals);
            } else {
                setReferrals([]);
            }
        } catch (err) {
            console.error('Error fetching surgery referrals:', err);
            setReferrals([]);
        } finally {
            setLoadingReferrals(false);
        }
    };

    // ─── 2. MY SURGERY PLANS STATE & LOGIC ──────────────────────────────────────
    const [surgeryPlans, setSurgeryPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [searchPlans, setSearchPlans] = useState('');
    const [statusFilterPlans, setStatusFilterPlans] = useState('all');

    const fetchSurgeryPlans = async () => {
        setLoadingPlans(true);
        try {
            const res = await otAPI.getMySurgeryPlans();
            if (res.success && Array.isArray(res.data)) {
                setSurgeryPlans(res.data);
            } else {
                setSurgeryPlans([]);
            }
        } catch (err) {
            console.error('Error fetching surgery plans:', err);
            setSurgeryPlans([]);
        } finally {
            setLoadingPlans(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchReferrals();
        fetchSurgeryPlans();
    }, []);

    // Filter referrals
    const qRef = searchReferrals.toLowerCase().trim();
    const filteredReferrals = referrals.filter(ref => {
        const pName = ref.patientId?.name || '';
        const pMrn = ref.patientId?.mrn || ref.patientId?.patientId || '';
        const docName = ref.referringDoctorId?.name || '';
        const reason = ref.reason || '';

        const matchesQuery = !qRef || (
            pName.toLowerCase().includes(qRef) ||
            pMrn.toLowerCase().includes(qRef) ||
            docName.toLowerCase().includes(qRef) ||
            reason.toLowerCase().includes(qRef)
        );

        const status = (ref.status || '').toLowerCase();
        const matchesStatus = statusFilterReferrals === 'all' || status === statusFilterReferrals.toLowerCase();

        return matchesQuery && matchesStatus;
    });

    // Filter plans
    const qPlan = searchPlans.toLowerCase().trim();
    const filteredPlans = surgeryPlans.filter(sp => {
        const surgery = sp.surgery || '';
        const planId = sp.planId || '';
        const pName = sp.patientId?.name || '';
        const pMrn = sp.patientId?.mrn || '';
        const dx = sp.diagnosis || '';
        const otName = sp.otRoomId?.name || '';

        const matchesQuery = !qPlan || (
            surgery.toLowerCase().includes(qPlan) ||
            planId.toLowerCase().includes(qPlan) ||
            pName.toLowerCase().includes(qPlan) ||
            pMrn.toLowerCase().includes(qPlan) ||
            dx.toLowerCase().includes(qPlan) ||
            otName.toLowerCase().includes(qPlan)
        );

        const status = (sp.status || '').toLowerCase();
        const matchesStatus = statusFilterPlans === 'all' || status === statusFilterPlans.toLowerCase();

        return matchesQuery && matchesStatus;
    });

    const handleViewProfile = (sp) => {
        const targetId = sp.patientId?._id || sp.patientId?.patientId || sp.patientId?.mrn || sp._id;
        const dept = sp.department || 'Surgery';
        if (targetId) {
            navigate(`/patient/${targetId}/department/${encodeURIComponent(dept)}`);
        }
    };

    const currentDate = new Date();
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="doc-exact-patients-page">
            {/* Header Banner */}
            <div className="doc-modern-banner">
                <div className="doc-banner-left">
                    <div className="doc-title-row">
                        <h1 className="doc-exact-title">Surgeries</h1>
                        <span className="doc-role-badge">DOCTOR</span>
                        <span className="doc-count-pill">
                            {activeTab === 'referrals' ? `${referrals.length} Referrals` : `${surgeryPlans.length} Plans`}
                        </span>
                    </div>
                    <p className="doc-exact-subtitle">
                        Comprehensive surgery console: review incoming consultation referrals, formulate surgical plans, and track operational OT procedures.
                    </p>
                </div>

                <div className="doc-banner-right">
                    <div className="doc-date-card">
                        <div className="doc-date-icon-wrap">
                            <FiCalendar className="doc-date-icon" />
                        </div>
                        <div className="doc-date-info">
                            <span className="doc-date-day">{dayName}</span>
                            <span className="doc-date-full">{formattedDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB SELECTOR STRIP */}
            <div 
                className="doc-surgeries-tab-strip"
                role="tablist"
                aria-label="Doctor surgeries views"
            >
                <button
                    type="button"
                    role="tab"
                    id="tab-surgery-referrals"
                    aria-selected={activeTab === 'referrals'}
                    aria-controls="panel-surgery-referrals"
                    tabIndex={activeTab === 'referrals' ? 0 : -1}
                    onClick={() => handleTabChange('referrals')}
                    className={`doc-surgeries-tab-btn ${activeTab === 'referrals' ? 'is-active' : ''}`}
                >
                    <FiScissors size={16} />
                    <span>Surgery Referrals</span>
                    <span className="doc-surgeries-tab-badge">
                        {referrals.length}
                    </span>
                </button>

                <button
                    type="button"
                    role="tab"
                    id="tab-surgery-plans"
                    aria-selected={activeTab === 'plans'}
                    aria-controls="panel-surgery-plans"
                    tabIndex={activeTab === 'plans' ? 0 : -1}
                    onClick={() => handleTabChange('plans')}
                    className={`doc-surgeries-tab-btn ${activeTab === 'plans' ? 'is-active' : ''}`}
                >
                    <FiFileText size={16} />
                    <span>My Surgery Plans</span>
                    <span className="doc-surgeries-tab-badge">
                        {surgeryPlans.length}
                    </span>
                </button>
            </div>

            {/* TAB 1: SURGERY REFERRALS VIEW */}
            {activeTab === 'referrals' && (
                <div 
                    role="tabpanel"
                    id="panel-surgery-referrals"
                    aria-labelledby="tab-surgery-referrals"
                >
                    {/* Filter & Search Toolbar */}
                    <div className="doc-toolbar-card">
                        <div className="doc-search-pill-container">
                            <FiSearch className="doc-search-pill-icon" />
                            <input
                                type="text"
                                placeholder="Search patient, MRN, referring doctor, or indication..."
                                value={searchReferrals}
                                onChange={e => setSearchReferrals(e.target.value)}
                                className="doc-search-pill-input"
                            />
                            {searchReferrals && (
                                <button 
                                    type="button"
                                    onClick={() => setSearchReferrals('')} 
                                    className="doc-search-clear-btn"
                                    aria-label="Clear referrals search"
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>

                        <div className="doc-filter-right-actions">
                            <div className="doc-status-filter-pills">
                                {['all', 'pending', 'confirmed', 'completed'].map(st => (
                                    <button
                                        key={st}
                                        className={`doc-status-filter-btn ${statusFilterReferrals === st ? 'active' : ''}`}
                                        onClick={() => setStatusFilterReferrals(st)}
                                    >
                                        <span className="capitalize">{st === 'all' ? 'All Referrals' : st}</span>
                                    </button>
                                ))}
                            </div>

                            <button 
                                className="doc-refresh-btn" 
                                onClick={fetchReferrals} 
                                disabled={loadingReferrals}
                                title="Refresh referrals list"
                            >
                                <FiRefreshCw className={loadingReferrals ? 'spin' : ''} size={14} />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Referrals Table View */}
                    <div className="doc-tab-view-container">
                        <div className="doc-table-card-wrapper">
                            <div className="doc-table-header-bar">
                                <h3>
                                    <FiScissors style={{ marginRight: '8px' }} />
                                    Surgery Referrals Assigned to You ({filteredReferrals.length})
                                </h3>
                            </div>

                            <div className="doc-table-scroll">
                                {loadingReferrals ? (
                                    <div className="doc-loading-container" style={{ padding: '40px' }}>
                                        <div className="doc-custom-spinner" />
                                        <p>Loading surgery referrals...</p>
                                    </div>
                                ) : filteredReferrals.length === 0 ? (
                                    <div className="doc-surgeries-empty-state">
                                        <div className="doc-surgeries-empty-icon">
                                            <FiScissors size={26} />
                                        </div>
                                        <h4 className="doc-surgeries-empty-title">No Surgery Referrals Found</h4>
                                        <p className="doc-surgeries-empty-desc">
                                            {searchReferrals || statusFilterReferrals !== 'all'
                                                ? 'No referrals matched your filter criteria.'
                                                : 'There are currently no surgery referrals assigned to you.'}
                                        </p>
                                    </div>
                                ) : (
                                    <table className="doc-clean-table">
                                        <thead>
                                            <tr>
                                                <th>Patient</th>
                                                <th>Referred By</th>
                                                <th>Clinical Reason</th>
                                                <th>Referral Date</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'center' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReferrals.map(ref => {
                                                const pid = ref.patientId?.patientId || ref.patientId?.mrn || ref.patientId?._id;
                                                const status = (ref.status || 'confirmed').toLowerCase().replace(/[\s_]+/g, '-');
                                                return (
                                                    <tr key={ref._id}>
                                                        <td>
                                                            <div className="font-bold text-slate-800">{ref.patientId?.name || 'Unknown Patient'}</div>
                                                            <div className="text-xs text-slate-500">MRN: {ref.patientId?.mrn || ref.patientId?.patientId || '—'}</div>
                                                        </td>
                                                        <td className="text-slate-700">{ref.referringDoctorId?.name || 'Clinical Staff'}</td>
                                                        <td className="text-slate-700" style={{ maxWidth: '280px' }}>{ref.reason || 'Surgical Evaluation'}</td>
                                                        <td className="text-slate-500">
                                                            {ref.referralDate ? new Date(ref.referralDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                        </td>
                                                        <td>
                                                            <span className={`doc-status-pill status-${status}`}>
                                                                {ref.status || 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    navigate('/doctor/patient/' + (pid || ref._id), {
                                                                        state: { referralId: ref._id, referral: ref }
                                                                    });
                                                                }}
                                                                className="doc-action-btn btn-consult btn-surgery-table"
                                                            >
                                                                <span>Review & Plan</span>
                                                                <FiArrowRight size={13} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: MY SURGERY PLANS VIEW */}
            {activeTab === 'plans' && (
                <div
                    role="tabpanel"
                    id="panel-surgery-plans"
                    aria-labelledby="tab-surgery-plans"
                >
                    {/* Filter & Search Toolbar */}
                    <div className="doc-toolbar-card">
                        <div className="doc-search-pill-container">
                            <FiSearch className="doc-search-pill-icon" />
                            <input
                                type="text"
                                placeholder="Search procedure, plan ID, patient name, or OT room..."
                                value={searchPlans}
                                onChange={e => setSearchPlans(e.target.value)}
                                className="doc-search-pill-input"
                            />
                            {searchPlans && (
                                <button 
                                    type="button"
                                    onClick={() => setSearchPlans('')} 
                                    className="doc-search-clear-btn"
                                    aria-label="Clear plans search"
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>

                        <div className="doc-filter-right-actions">
                            <div className="doc-status-filter-pills">
                                {['all', 'planned', 'scheduled', 'completed', 'cancelled'].map(st => (
                                    <button
                                        key={st}
                                        className={`doc-status-filter-btn ${statusFilterPlans === st ? 'active' : ''}`}
                                        onClick={() => setStatusFilterPlans(st)}
                                    >
                                        <span className="capitalize">{st === 'all' ? 'All Plans' : st}</span>
                                    </button>
                                ))}
                            </div>

                            <button 
                                className="doc-refresh-btn" 
                                onClick={fetchSurgeryPlans} 
                                disabled={loadingPlans}
                                title="Refresh surgery plans list"
                            >
                                <FiRefreshCw className={loadingPlans ? 'spin' : ''} size={14} />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Surgery Plans Table View */}
                    <div className="doc-tab-view-container">
                        <div className="doc-table-card-wrapper">
                            <div className="doc-table-header-bar">
                                <h3>
                                    <FiFileText style={{ marginRight: '8px' }} />
                                    My Surgery Plans & OT Status ({filteredPlans.length})
                                </h3>
                            </div>

                            <div className="doc-table-scroll">
                                {loadingPlans ? (
                                    <div className="doc-loading-container" style={{ padding: '40px' }}>
                                        <div className="doc-custom-spinner" />
                                        <p>Loading surgery plans...</p>
                                    </div>
                                ) : filteredPlans.length === 0 ? (
                                    <div className="doc-surgeries-empty-state">
                                        <div className="doc-surgeries-empty-icon">
                                            <FiFileText size={26} />
                                        </div>
                                        <h4 className="doc-surgeries-empty-title">No Surgery Plans Found</h4>
                                        <p className="doc-surgeries-empty-desc">
                                            {searchPlans || statusFilterPlans !== 'all'
                                                ? 'No surgery plans matched your filter criteria.'
                                                : 'No surgery plans have been scheduled yet.'}
                                        </p>
                                    </div>
                                ) : (
                                    <table className="doc-clean-table">
                                        <thead>
                                            <tr>
                                                <th>Plan ID & Procedure</th>
                                                <th>Patient Details</th>
                                                <th>Referring Doctor</th>
                                                <th>OT Suite & Timing</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'center' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPlans.map(sp => {
                                                const status = (sp.status || 'planned').toLowerCase().replace(/[\s_]+/g, '-');
                                                return (
                                                    <tr key={sp._id}>
                                                        <td>
                                                            <div className="font-bold text-slate-800">{sp.surgery || 'Surgical Procedure'}</div>
                                                            <span className="doc-plan-badge">{sp.planId || 'PLAN-AUTO'}</span>
                                                            {sp.diagnosis && <div className="text-xs text-slate-500 mt-1">Dx: {sp.diagnosis}</div>}
                                                        </td>
                                                        <td>
                                                            <div className="font-bold text-slate-800">{sp.patientId?.name || 'Patient'}</div>
                                                            <div className="text-xs text-slate-500">MRN: {sp.patientId?.mrn || sp.patientId?.patientId || '—'}</div>
                                                        </td>
                                                        <td className="text-slate-700">{sp.referringDoctorId?.name || 'Self-Planned'}</td>
                                                        <td>
                                                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                                <FiMapPin size={13} className="text-[#D85F89] flex-shrink-0" />
                                                                <span>{sp.otRoomId?.name || 'OT Suite TBD'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                                                <FiCalendar size={12} className="text-slate-400 flex-shrink-0" />
                                                                <span>{sp.surgeryDate || 'Flexible'} {sp.startTime ? `(${sp.startTime} - ${sp.endTime || '--:--'})` : ''}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`doc-status-pill status-${status}`}>
                                                                {sp.status || 'Planned'}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleViewProfile(sp)}
                                                                className="doc-action-btn btn-profile btn-surgery-table"
                                                            >
                                                                <FiUser size={13} />
                                                                <span>View Profile</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorSurgeries;
