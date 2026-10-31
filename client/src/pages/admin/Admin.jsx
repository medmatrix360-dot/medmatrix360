import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAPI, uploadAPI, hospitalAPI, publicAPI } from '../../utils/api';
import { getSubscriptionLimits } from '../../utils/subscriptionPlans';
import toast from 'react-hot-toast';
import { 
    FiUsers, 
    FiUserPlus, 
    FiPlus, 
    FiX, 
    FiSearch, 
    FiAlertCircle, 
    FiAlertTriangle, 
    FiUserCheck, 
    FiPieChart, 
    FiEdit2, 
    FiTrash2, 
    FiChevronDown, 
    FiCheck 
} from 'react-icons/fi';
import '../administration/SuperAdmin.css';
import './Admin.css';

const HospitalSelect = ({ hospitals, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedName = value ? (hospitals.find(h => h._id === value)?.name || 'Unknown') : 'All Hospitals';

    return (
        <div ref={dropdownRef} className="staff-hospital-select-box">
            <div 
                className={`staff-hospital-trigger ${isOpen ? 'is-open' : ''}`}
                onClick={() => setIsOpen(!isOpen)} 
                role="button"
                tabIndex={0}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    } else if (e.key === 'Escape') {
                        setIsOpen(false);
                    }
                }}
            >
                <span className="staff-hospital-selected-text">{selectedName}</span>
                <FiChevronDown className={`staff-hospital-chevron ${isOpen ? 'open' : ''}`} />
            </div>
            {isOpen && (
                <div 
                    data-lenis-prevent
                    onWheel={(e) => e.stopPropagation()}
                    className="staff-hospital-dropdown-menu"
                    role="listbox"
                >
                    <div 
                        onClick={() => { onChange(''); setIsOpen(false); }}
                        className={`staff-hospital-option ${value === '' ? 'is-selected' : ''}`}
                        role="option"
                        aria-selected={value === ''}
                    >
                        <span>All Hospitals</span>
                        {value === '' && <FiCheck className="staff-option-check" />}
                    </div>
                    {[...hospitals].sort((a, b) => (a.name || '').trim().toLowerCase().localeCompare((b.name || '').trim().toLowerCase())).map(opt => (
                        <div key={opt._id} 
                            onClick={() => { onChange(opt._id); setIsOpen(false); }}
                            className={`staff-hospital-option ${opt._id === value ? 'is-selected' : ''}`}
                            role="option"
                            aria-selected={opt._id === value}
                        >
                            <span>{opt.name}</span>
                            {opt._id === value && <FiCheck className="staff-option-check" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const compressAvatarImage = async (file, maxWidth = 400, quality = 0.8) => {
    if (!file || !file.type || !file.type.startsWith('image/')) return file;
    if (file.size <= 80 * 1024) return file; // Already under 80KB

    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            if (width > maxWidth || height > maxWidth) {
                if (width > height) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                } else {
                    width = Math.round((width * maxWidth) / height);
                    height = maxWidth;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (!blob || blob.size >= file.size) {
                        resolve(file);
                    } else {
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    }
                },
                'image/jpeg',
                quality
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(file);
        };
        img.src = objectUrl;
    });
};

const Admin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [roles, setRoles] = useState([]);
    const [hospital, setHospital] = useState(null);

    // Infinite Scroll State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const observerRef = useRef(null);

    const [editModal, setEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        id: '', name: '', email: '', phone: '', roleId: '', roleName: '', currentAvatar: '', newAvatarFile: null, specialty: '', department: '', assignedDoctors: []
    });
    const [initialEditForm, setInitialEditForm] = useState(null);

    const isStaffModified = useMemo(() => {
        if (!initialEditForm) return false;
        const doctorsMatch = JSON.stringify(editForm.assignedDoctors || []) === JSON.stringify(initialEditForm.assignedDoctors || []);
        return (
            (editForm.name || '').trim() !== (initialEditForm.name || '').trim() ||
            (editForm.email || '').trim().toLowerCase() !== (initialEditForm.email || '').trim().toLowerCase() ||
            (editForm.phone || '').trim() !== (initialEditForm.phone || '').trim() ||
            (editForm.department || '') !== (initialEditForm.department || '') ||
            !doctorsMatch ||
            Boolean(editForm.newAvatarFile)
        );
    }, [editForm, initialEditForm]);
    const [updating, setUpdating] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Create Staff Form state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '', email: '', password: '', phone: '', age: '', aadhaar: '', roleId: '', file: null, department: '', assignedDoctors: []
    });
    const [creating, setCreating] = useState(false);
    const [clinicDoctorExists, setClinicDoctorExists] = useState(false);
    const [checkingDocLimit, setCheckingDocLimit] = useState(false);
    const [availableDoctors, setAvailableDoctors] = useState([]);

    const [hospitals, setHospitals] = useState([]);
    const [staffHospitalFilter, setStaffHospitalFilter] = useState('');
    const [staffPlanFilter, setStaffPlanFilter] = useState('');

    // Search state
    const [staffSearchQuery, setStaffSearchQuery] = useState('');
    const [staffSearchExpanded, setStaffSearchExpanded] = useState(false);
    const searchTimeoutRef = useRef(null);
    const staffSearchInputRef = useRef(null);

    const getPlanBadge = (userItem) => {
        let rawPlan = userItem?.subscriptionPlan || userItem?.plan;
        if (!rawPlan && userItem?.hospitalId) {
            const hId = typeof userItem.hospitalId === 'object' ? (userItem.hospitalId._id || userItem.hospitalId.id) : String(userItem.hospitalId);
            const hosp = hospitals.find(h => String(h._id) === String(hId));
            if (hosp) {
                rawPlan = hosp.subscriptionPlan || (hosp.clinicType === 'clinic' ? 'starter' : 'enterprise');
            }
        }
        if (!rawPlan && hospital) {
            rawPlan = hospital.subscriptionPlan || (hospital.clinicType === 'clinic' ? 'starter' : 'enterprise');
        }
        if (!rawPlan) return { label: 'Starter Clinic', key: 'starter' };

        const p = String(rawPlan).toLowerCase();
        if (p === 'starter' || p === 'simple_clinic') return { label: 'Starter Clinic', key: 'starter' };
        if (p === 'clinic_basic') return { label: 'Clinic Basic', key: 'clinic_basic' };
        if (p === 'multi_speciality_starter') return { label: 'Multi-Speciality', key: 'multi_speciality' };
        if (p === 'enterprise') return { label: 'Enterprise', key: 'enterprise' };
        if (p === 'none') return { label: 'Starter Clinic', key: 'starter' };
        return { label: p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), key: p };
    };

    const handleToggleCreateForm = async () => {
        const nextState = !showCreateForm;
        if (nextState && hospital?.clinicType === 'clinic') {
            setCheckingDocLimit(true);
            setError('');
            try {
                const response = await adminAPI.getUsers();
                if (response.success) {
                    const staffUsers = response.users || [];
                    const hasDoc = staffUsers.some(u => {
                        const rName = (u.role || '').toLowerCase();
                        return rName === 'clinic doctor' || rName === 'doctor';
                    });
                    setClinicDoctorExists(hasDoc);
                }
            } catch (err) {
                console.error("Error rechecking Clinic Doctor count:", err);
            } finally {
                setCheckingDocLimit(false);
            }
        }
        setShowCreateForm(nextState);
    };

    // Reactive check to sync Clinic Doctor count status
    useEffect(() => {
        if (hospital?.clinicType === 'clinic') {
            const hasDoc = users.some(u => {
                const rName = (u.role || '').toLowerCase();
                return rName === 'clinic doctor' || rName === 'doctor';
            });
            setClinicDoctorExists(hasDoc);
        }
    }, [users, hospital]);

    // Check if user is admin
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const perms = user.permissions || [];
        const allowedRoles = ['admin', 'superadmin', 'centraladmin', 'hospitaladmin'];
        if (!allowedRoles.includes(user.role) &&
            !perms.includes('*') && !perms.includes('admin_manage_roles') && !perms.includes('admin_view_stats')) {
            navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchHospital();
        
        const fetchDocs = async () => {
            try {
                const res = await publicAPI.getDoctors();
                if (res.success) setAvailableDoctors(res.doctors || res.data || []);
            } catch (err) {}
        };
        fetchDocs();

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (['superadmin', 'centraladmin'].includes(user.role)) {
            fetchHospitals();
        }
    }, []);

    const fetchHospitals = async (plan = staffPlanFilter) => {
        try {
            const res = await hospitalAPI.getHospitals(plan === '' ? 'all' : plan);
            if (res.success) setHospitals(res.hospitals || []);
        } catch (err) { console.error('Error fetching hospitals:', err); }
    };

    const fetchHospital = async () => {
        try {
            const res = await hospitalAPI.getMyHospital();
            if (res.success && res.hospital) {
                setHospital(res.hospital);
            }
        } catch (err) {
            console.error('Error fetching hospital:', err);
        }
    };

    // UPI Management State & Functions
    const [upiList, setUpiList] = useState([]);
    const [newLabel, setNewLabel] = useState('');
    const [newUpiId, setNewUpiId] = useState('');
    const [upiLoading, setUpiLoading] = useState(false);
    const [upiError, setUpiError] = useState('');
    const [upiSuccess, setUpiSuccess] = useState('');

    const fetchUpiIds = async () => {
        try {
            const res = await hospitalAPI.getUpiIds();
            if (res.success) setUpiList(res.upiIds || []);
        } catch (err) {
            console.error('Error fetching UPI IDs:', err);
        }
    };

    useEffect(() => {
        if (hospital) fetchUpiIds();
    }, [hospital]);

    const handleAddUpi = () => {
        if (!newLabel.trim() || !newUpiId.trim()) {
            setUpiError('Both label and UPI ID are required');
            return;
        }
        setUpiList(prev => [...prev, { label: newLabel.trim(), upiId: newUpiId.trim() }]);
        setNewLabel('');
        setNewUpiId('');
        setUpiError('');
    };

    const handleDeleteUpi = (index) => {
        setUpiList(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveUpi = async () => {
        setUpiLoading(true);
        setUpiError('');
        setUpiSuccess('');
        try {
            const res = await hospitalAPI.updateUpiIds(upiList);
            if (res.success) {
                setUpiSuccess('UPI IDs updated');
            } else {
                setUpiError('Failed to update UPI IDs');
            }
        } catch (err) {
            setUpiError(err.response?.data?.message || 'Error updating UPI IDs');
        } finally {
            setUpiLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await adminAPI.getRoles();
            if (response.success) setRoles(response.data);
        } catch (err) {
            console.error('Error fetching roles:', err);
        }
    };

    const PAGE_SIZE = 10;

    const fetchUsers = async (
        plan = staffPlanFilter, 
        hospitalId = staffHospitalFilter, 
        targetPage = 1, 
        limit = PAGE_SIZE, 
        search = staffSearchQuery,
        isAppend = false
    ) => {
        try {
            if (isAppend) {
                setLoadingMore(true);
            } else {
                setLoadingUsers(true);
            }
            const userObj = JSON.parse(localStorage.getItem('user') || '{}');
            const isCentral = ['superadmin', 'centraladmin'].includes(userObj.role);
            const response = await adminAPI.getUsers(plan, hospitalId, targetPage, limit, search, !isCentral);
            if (response.success) {
                const staffUsers = (response.users || response.data || []).filter(u => {
                    const r = (typeof u.role === 'string' ? u.role : (u.role?.name || '')).toLowerCase();
                    if (['patient', 'user'].includes(r)) return false;
                    if (!isCentral && (r === 'doctor' || r === 'clinic doctor' || (r.includes('doctor') && !r.includes('assistant')))) return false;
                    return true;
                });

                if (isAppend) {
                    setUsers(prev => {
                        const existingIds = new Set(prev.map(item => item.id || item._id));
                        const uniqueNew = staffUsers.filter(item => !existingIds.has(item.id || item._id));
                        return [...prev, ...uniqueNew];
                    });
                } else {
                    setUsers(staffUsers);
                }

                if (response.pagination) {
                    setPage(response.pagination.currentPage);
                    setTotalRecords(response.pagination.totalRecords);
                    setHasMore(response.pagination.currentPage < response.pagination.totalPages);
                } else {
                    setTotalRecords(staffUsers.length);
                    setHasMore(false);
                }
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Error fetching users');
        } finally {
            setLoadingUsers(false);
            setLoadingMore(false);
        }
    };

    const handleTableScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 150 && hasMore && !loadingMore && !loadingUsers) {
            const nextPage = page + 1;
            fetchUsers(staffPlanFilter, staffHospitalFilter, nextPage, PAGE_SIZE, staffSearchQuery, true);
        }
    };

    // Infinite Scroll IntersectionObserver trigger
    useEffect(() => {
        if (loadingUsers || loadingMore || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loadingUsers) {
                    const nextPage = page + 1;
                    fetchUsers(staffPlanFilter, staffHospitalFilter, nextPage, PAGE_SIZE, staffSearchQuery, true);
                }
            },
            { threshold: 0.1, rootMargin: '120px' }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observer.unobserve(observerRef.current);
            }
            observer.disconnect();
        };
    }, [hasMore, loadingMore, loadingUsers, page, staffPlanFilter, staffHospitalFilter, staffSearchQuery]);

    // Debounced Search Handler
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setStaffSearchQuery(query);
        setPage(1);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchUsers(staffPlanFilter, staffHospitalFilter, 1, PAGE_SIZE, query, false);
        }, 300);
    };

    const handleClearSearch = () => {
        setStaffSearchQuery('');
        setPage(1);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        fetchUsers(staffPlanFilter, staffHospitalFilter, 1, PAGE_SIZE, '', false);
    };

    const handlePlanFilterChange = (e) => {
        const newPlan = e.target.value;
        setStaffPlanFilter(newPlan);
        setStaffHospitalFilter('');
        setPage(1);
        fetchUsers(newPlan, '', 1, PAGE_SIZE, staffSearchQuery, false);
        fetchHospitals(newPlan);
    };

    const handleHospitalFilterChange = (newHosp) => {
        setStaffHospitalFilter(newHosp);
        setPage(1);
        fetchUsers(staffPlanFilter, newHosp, 1, PAGE_SIZE, staffSearchQuery, false);
    };

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Open Edit Modal
    const openEditModal = (userItem) => {
        const rawAssigned = userItem.assignedDoctors || [];
        const formattedAssigned = rawAssigned.map(d => typeof d === 'object' ? (d._id || d.id) : String(d));
        const initData = {
            id: userItem.id || userItem._id,
            name: userItem.name || '',
            email: userItem.email || '',
            phone: userItem.phone || '',
            roleId: userItem.roleId || userItem.role,
            roleName: userItem.role || 'Staff',
            currentAvatar: userItem.avatar || null,
            newAvatarFile: null,
            specialty: '',
            department: (userItem.departments && userItem.departments.length > 0) ? userItem.departments[0] : '',
            assignedDoctors: formattedAssigned
        };
        setEditForm(initData);
        setInitialEditForm(initData);
        setEditModal(true);
    };

    // Update User Logic
    const handleUpdateUser = async (e) => {
        e.preventDefault();

        if (!isStaffModified) {
            toast('No changes detected.', { icon: 'ℹ️' });
            setEditModal(false);
            return;
        }

        setUpdating(true);

        const cleanPhone = (editForm.phone || '').replace(/\D/g, '').slice(0, 10);
        if (cleanPhone && cleanPhone.length !== 10) {
            toast.error('Mobile number must be exactly 10 digits.');
            setUpdating(false);
            return;
        }

        try {
            let avatarUrl = editForm.currentAvatar;

            // 1. Upload new image if selected
            if (editForm.newAvatarFile) {
                const formData = new FormData();
                formData.append('images', editForm.newAvatarFile);
                const uploadRes = await uploadAPI.uploadImages(formData);
                if (uploadRes.success && uploadRes.files.length > 0) {
                    avatarUrl = uploadRes.files[0].url;
                }
            }

            // 2. Prepare Update Data
            const updateData = {
                name: (editForm.name || '').trim(),
                email: (editForm.email || '').trim(),
                phone: cleanPhone,
                avatar: avatarUrl,
                specialty: editForm.specialty,
                departments: editForm.department ? [editForm.department] : [],
                assignedDoctors: editForm.assignedDoctors || []
            };

            const response = await adminAPI.updateUser(editForm.id, updateData);
            if (response.success) {
                toast.success('User updated successfully!');
                setEditModal(false);
                const updated = response.user || {
                    ...updateData,
                    id: editForm.id,
                    _id: editForm.id,
                    role: editForm.roleName
                };
                setUsers(prev => prev.map(u => (String(u.id || u._id) === String(editForm.id) ? { ...u, ...updated } : u)));
                try {
                    await fetchUsers(staffPlanFilter, staffHospitalFilter, page, PAGE_SIZE, staffSearchQuery, false);
                } catch (fetchErr) {
                    console.error('Error refreshing staff list:', fetchErr);
                }
            }
        } catch (err) {
            console.error('Error updating user:', err);
            toast.error(err.response?.data?.message || err.message || 'Error updating user.');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        toast.dismiss();
        setDeletingId(userId);
        try {
            const response = await adminAPI.deleteUser(userId);
            if (response.status === 200 || response.success === true) {
                toast.success('User deleted successfully!');
                const targetPage = (users.length === 1 && page > 1) ? page - 1 : page;
                setPage(targetPage);
                try {
                    await fetchUsers(staffPlanFilter, staffHospitalFilter, targetPage, PAGE_SIZE, staffSearchQuery, false);
                } catch (fetchErr) {
                    console.error('Error refreshing staff list:', fetchErr);
                }
            } else {
                toast.error('Failed to delete user.');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            toast.error(err.response?.data?.message || err.message || 'Error deleting user.');
        } finally {
            setDeletingId(null);
            setDeleteConfirm(null);
        }
    };

    // Create Staff Account
    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setCreating(true);

        if (createForm.phone && createForm.phone.length !== 10) {
            toast.error('Mobile number must be exactly 10 digits.');
            setCreating(false);
            return;
        }

        if (!createForm.name || !createForm.email || !createForm.password || !createForm.roleId) {
            toast.error('Name, email, password, and role are all required.');
            setCreating(false);
            return;
        }

        if (hospital?.clinicType === 'clinic') {
            const hasDoc = clinicDoctorExists || users.some(u => {
                const rName = (u.role?.name || u.role || '').toLowerCase();
                return rName === 'clinic doctor' || rName === 'doctor';
            });
            if (hasDoc) {
                toast.error('This clinic already has an assigned Clinic Doctor.');
                setClinicDoctorExists(true);
                setCreating(false);
                return;
            }
        }

        try {
            let avatarUrl = null;

            // 1. Upload Image if selected (optimized with fast client-side compression)
            if (createForm.file) {
                const fileToUpload = await compressAvatarImage(createForm.file);
                const formData = new FormData();
                formData.append('images', fileToUpload);
                try {
                    const uploadRes = await uploadAPI.uploadImages(formData);
                    if (uploadRes.success && uploadRes.urls && uploadRes.urls.length > 0) {
                        avatarUrl = uploadRes.urls[0];
                    } else if (uploadRes.success && uploadRes.files && uploadRes.files.length > 0) {
                        avatarUrl = uploadRes.files[0].url;
                    }
                } catch (uploadErr) {
                    console.error("Image upload failed:", uploadErr);
                    // continue without image if upload fails or notify user
                }
            }

            // 2. Create User with avatar URL
            const userData = {
                ...createForm,
                departments: createForm.department ? [createForm.department] : [],
                assignedDoctors: createForm.assignedDoctors || [],
                avatar: avatarUrl
            };

            const response = await adminAPI.createUser(userData);
            if (response.success) {
                toast.success(`Staff account created for ${createForm.name}! They can log in with: ${createForm.email}`);
                setCreateForm({ name: '', email: '', password: '', phone: '', age: '', aadhaar: '', roleId: '', file: null, department: '', hospitalId: '' });
                setShowCreateForm(false);
                setPage(1);
                fetchUsers(staffPlanFilter, staffHospitalFilter, 1, 15, staffSearchQuery, false);
            }
        } catch (err) {
            console.error("Creation error:", err);
            toast.error(err.response?.data?.message || 'Error creating staff account.');
        } finally {
            setCreating(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="superadmin-page staff-management-page">
            <div className="superadmin-container">
                {/* TOP CARD: Create Staff Account */}
                <div className="staff-create-card">
                    <div className="staff-create-header">
                        <div className="staff-create-title-wrap">
                            <div className="staff-create-icon-badge">
                                <FiUserPlus />
                            </div>
                            <div>
                                <h2>Create Staff Account</h2>
                                <p className="staff-create-subtitle">Provision access roles, credentials, and departmental permissions</p>
                            </div>
                            {hospital && (hospital.subscriptionPlan === 'clinic_basic' || hospital.subscriptionPlan === 'multi_speciality_starter') && (() => {
                                const limits = getSubscriptionLimits(hospital.subscriptionPlan);
                                const maxStaff = limits.maxStaff;
                                const staffCount = users.filter(u => {
                                    const rName = (u.role?.name || u.role || '').toLowerCase();
                                    const isDoc = (rName === 'doctor' || rName === 'clinic doctor' || (rName.includes('doctor') && !rName.includes('assistant')));
                                    return !isDoc && !['patient', 'hospitaladmin', 'centraladmin', 'superadmin'].includes(rName);
                                }).length;
                                const remaining = Math.max(0, maxStaff - staffCount);

                                if (remaining === 0) return null;

                                return (
                                    <span className="staff-quota-pill">
                                        <span className="staff-quota-dot" />
                                        {remaining} left
                                    </span>
                                );
                            })()}
                        </div>

                        {(() => {
                            let isStaffQuotaFull = false;
                            if (hospital && (hospital.subscriptionPlan === 'clinic_basic' || hospital.subscriptionPlan === 'multi_speciality_starter')) {
                                const limits = getSubscriptionLimits(hospital.subscriptionPlan);
                                const maxStaff = limits.maxStaff;
                                const staffCount = users.filter(u => {
                                    const rName = (u.role?.name || u.role || '').toLowerCase();
                                    const isDoc = (rName === 'doctor' || rName === 'clinic doctor' || (rName.includes('doctor') && !rName.includes('assistant')));
                                    return !isDoc && !['patient', 'hospitaladmin', 'centraladmin', 'superadmin'].includes(rName);
                                }).length;
                                isStaffQuotaFull = Math.max(0, maxStaff - staffCount) === 0;
                            }
                            
                            if (isStaffQuotaFull) return null;
                            
                            return (
                                <button 
                                    onClick={handleToggleCreateForm} 
                                    className={`btn-add-staff-action ${showCreateForm ? 'close-mode' : ''}`}
                                    title={showCreateForm ? "Close Form" : "Add Staff"}
                                >
                                    {showCreateForm ? (
                                        <>
                                            <FiX className="staff-btn-icon" />
                                            <span className="staff-btn-label-desktop">Close Form</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiPlus className="staff-btn-icon" />
                                            <span className="staff-btn-label-desktop">Add Staff</span>
                                        </>
                                    )}
                                    <span className="staff-btn-label-mobile">
                                        {showCreateForm ? <FiX /> : <FiPlus />}
                                    </span>
                                </button>
                            );
                        })()}
                    </div>

                    {showCreateForm && (
                        <div className="staff-form-expandable">
                            {hospital?.clinicType === 'clinic' && clinicDoctorExists && (
                                <div className="staff-alert-banner staff-alert-warning">
                                    <FiAlertTriangle className="staff-alert-icon" />
                                    <span>This clinic already has an assigned Clinic Doctor. Only 1 Doctor account is permitted under this plan.</span>
                                </div>
                            )}
                            <form onSubmit={handleCreateStaff} className="user-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="staff-label">Full Name *</label>
                                        <input type="text" placeholder="e.g. Dr. Sharma" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required minLength={2} className="staff-input" />
                                    </div>
                                    <div className="form-group">
                                        <label className="staff-label">Email Address *</label>
                                        <input type="email" placeholder="staff@hospital.com" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required className="staff-input" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="staff-label">Password *</label>
                                        <input type="text" placeholder="Temporary password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} required className="staff-input" />
                                    </div>
                                    <div className="form-group">
                                        <label className="staff-label">Phone *</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 9876543210" 
                                            value={createForm.phone || ''} 
                                            onChange={e => {
                                                const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setCreateForm({ ...createForm, phone: cleanVal });
                                            }} 
                                            required
                                            title="Phone number must be exactly 10 digits"
                                            className="staff-input" 
                                            maxLength="10" 
                                            pattern="\d{10}" 
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="staff-label">Profile Image</label>
                                        <input type="file" accept="image/*" onChange={e => setCreateForm({ ...createForm, file: e.target.files[0] })} className="staff-input" style={{ padding: '8px' }} />
                                    </div>
                                    <div className="form-group">
                                        <label className="staff-label">Assign Role *</label>
                                        <select value={createForm.roleId} onChange={e => setCreateForm({ ...createForm, roleId: e.target.value })} required className="staff-input">
                                            <option value="">-- Select a Role --</option>
                                            {roles
                                                .filter(r => {
                                                    const name = (r.name || '').toLowerCase().trim();
                                                    if (['patient', 'user'].includes(name)) return false;
                                                    if ((name.includes('doctor') || name.includes('doc')) && !name.includes('assistant')) return false;
                                                    if (name.includes('admin')) return false;
                                                    const isClinic = hospital?.clinicType === 'clinic';
                                                    if (!isClinic && name.includes('clinic')) return false;
                                                    return true;
                                                })
                                                .map(role => (
                                                    <option key={role._id} value={role._id}>{role.name}</option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {(() => {
                                    const selectedRole = roles.find(r => r._id === createForm.roleId);
                                    const roleName = (selectedRole?.name || '').toLowerCase();
                                    const isAssistant = roleName.includes('assistant');

                                    if (isAssistant) {
                                        const selectedDocIds = createForm.assignedDoctors || [];
                                        const derivedDepts = Array.from(new Set(
                                            availableDoctors
                                                .filter(d => selectedDocIds.includes(d._id))
                                                .flatMap(d => d.departments || [d.specialty].filter(Boolean))
                                        ));

                                        return (
                                            <div className="form-row staff-assistant-row">
                                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                    <label className="staff-label staff-label-highlight">
                                                        <FiUserCheck className="staff-field-icon" />
                                                        <span>Assign Responsible Doctors (Doctor Assistant will manage queue &amp; preparation for these doctors)</span>
                                                    </label>
                                                    <div className="staff-doctors-grid">
                                                        {availableDoctors.map(doc => {
                                                            const isChecked = selectedDocIds.includes(doc._id);
                                                            return (
                                                                <label key={doc._id} className={`staff-doctor-chip ${isChecked ? 'selected' : ''}`}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={(e) => {
                                                                            const updated = e.target.checked
                                                                                ? [...selectedDocIds, doc._id]
                                                                                : selectedDocIds.filter(id => id !== doc._id);
                                                                            setCreateForm(prev => ({ ...prev, assignedDoctors: updated }));
                                                                        }}
                                                                    />
                                                                    <span className="staff-doctor-chip-name">
                                                                        {doc.name} ({doc.departments?.[0] || doc.specialty || 'General'})
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                    {derivedDepts.length > 0 && (
                                                        <div className="staff-derived-depts-note">
                                                            <FiCheck className="staff-note-icon" />
                                                            <span>Auto-derived Authorized Departments: {derivedDepts.join(', ')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                
                                {hospital && hospital.departments && hospital.departments.length > 0 && (
                                    <div className="form-row" style={{ marginTop: '10px' }}>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="staff-label">Assign Department (Optional - Leave blank to allow all)</label>
                                            <select
                                                value={createForm.department}
                                                onChange={(e) => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
                                                className="staff-input"
                                                style={{ marginTop: '8px' }}
                                            >
                                                <option value="">-- Select Department --</option>
                                                {hospital.departments.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="form-group" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" disabled={creating} className="btn-staff-primary">
                                        {creating ? 'Creating Staff Account...' : 'Create Staff Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Quota Card if applicable */}
                {(() => {
                    if (hospital && (hospital.subscriptionPlan === 'clinic_basic' || hospital.subscriptionPlan === 'multi_speciality_starter')) {
                        const limits = getSubscriptionLimits(hospital.subscriptionPlan);
                        const maxStaff = limits.maxStaff;
                        const staffCount = users.filter(u => {
                            const rName = (u.role?.name || u.role || '').toLowerCase();
                            const isDoc = (rName === 'doctor' || rName === 'clinic doctor' || (rName.includes('doctor') && !rName.includes('assistant')));
                            return !isDoc && !['patient', 'hospitaladmin', 'centraladmin', 'superadmin'].includes(rName);
                        }).length;
                        const remaining = Math.max(0, maxStaff - staffCount);
                        
                        return (
                            <div className="staff-quota-card">
                                <div className="staff-quota-card-header">
                                    <FiPieChart className="staff-quota-icon" />
                                    <h3>Subscription Quota (Staff)</h3>
                                </div>
                                <div className="staff-quota-grid">
                                    <div className="staff-quota-metric">
                                        <span className="staff-quota-metric-label">Staff Accounts</span>
                                        <span className="staff-quota-metric-value">{staffCount} / {maxStaff} Used</span>
                                    </div>
                                    <div className={`staff-quota-metric ${remaining === 0 ? 'is-exhausted' : 'is-available'}`}>
                                        <span className="staff-quota-metric-label">Remaining</span>
                                        <span className="staff-quota-metric-value">{remaining}</span>
                                    </div>
                                </div>
                                {remaining === 0 && (
                                    <div className="staff-alert-banner staff-alert-danger" style={{ marginTop: '14px' }}>
                                        <FiAlertCircle className="staff-alert-icon" />
                                        <span>Staff quota has been fully utilized. Upgrade your plan to add more staff.</span>
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* ALL STAFF SECTION (With Clean Clinical Rows & Infinite Scroll) */}
                <div className="staff-main-card">
                    <div className="staff-main-header">
                        <div className="staff-title-and-search-row">
                            <h2 className="staff-title-text">
                                All Staff <span className="staff-count-badge">{totalRecords}</span>
                            </h2>
                            
                            {/* Expandable Search in same row as All Staff */}
                            <div className={`staff-expandable-search-box ${staffSearchExpanded || staffSearchQuery ? 'is-expanded' : ''}`}>
                                <button 
                                    type="button"
                                    className="staff-search-icon-btn"
                                    onClick={() => {
                                        setStaffSearchExpanded(prev => {
                                            const next = !prev;
                                            if (next) {
                                                setTimeout(() => staffSearchInputRef.current?.focus(), 150);
                                            }
                                            return next;
                                        });
                                    }}
                                    title="Search staff"
                                >
                                    <FiSearch />
                                </button>
                                <input
                                    ref={staffSearchInputRef}
                                    type="text"
                                    placeholder="Search name, email, phone..."
                                    value={staffSearchQuery}
                                    onChange={handleSearchChange}
                                    className="staff-search-expandable-input"
                                />
                                {staffSearchQuery ? (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="staff-search-clear-btn"
                                        title="Clear search"
                                    >
                                        <FiX />
                                    </button>
                                ) : staffSearchExpanded ? (
                                    <button
                                        type="button"
                                        onClick={() => setStaffSearchExpanded(false)}
                                        className="staff-search-clear-btn"
                                        title="Close search"
                                    >
                                        <FiX />
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {/* Dual Filters in ONE SINGLE LINE on mobile */}
                        {['superadmin', 'centraladmin'].includes(JSON.parse(localStorage.getItem('user') || '{}').role) && (
                            <div className="staff-filters-dual-row">
                                <select className="staff-input staff-filter-plan-select" value={staffPlanFilter} onChange={handlePlanFilterChange}>
                                    <option value="">All Plans</option>
                                    <option value="starter">Simple Clinics (Starter)</option>
                                    <option value="clinic_basic">Clinic Basic</option>
                                    <option value="multi_speciality_starter">Multi-Speciality Starter</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                                <div className="staff-filter-hospital-wrap">
                                    <HospitalSelect 
                                        hospitals={hospitals} 
                                        value={staffHospitalFilter} 
                                        onChange={handleHospitalFilterChange} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="staff-table-wrapper">
                        {loadingUsers && users.length === 0 ? (
                            <div className="users-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th className="staff-col-avatar">Avatar</th>
                                            <th className="staff-col-name">Name</th>
                                            <th className="staff-col-hospital">Hospital</th>
                                            <th className="staff-col-plan">Plan Name</th>
                                            <th className="staff-col-role">Role</th>
                                            <th className="staff-col-email">Email</th>
                                            <th className="staff-col-phone">Phone</th>
                                            <th className="staff-col-actions">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[0, 1, 2, 3, 4].map((s) => (
                                            <tr key={s} className="staff-skeleton-row">
                                                <td className="staff-col-avatar"><div className="staff-skeleton-circle"></div></td>
                                                <td className="staff-col-name"><div className="staff-skeleton-line" style={{ width: '140px' }}></div></td>
                                                <td className="staff-col-hospital"><div className="staff-skeleton-line" style={{ width: '100px' }}></div></td>
                                                <td className="staff-col-plan"><div className="staff-skeleton-line" style={{ width: '95px' }}></div></td>
                                                <td className="staff-col-role"><div className="staff-skeleton-line" style={{ width: '90px' }}></div></td>
                                                <td className="staff-col-email"><div className="staff-skeleton-line" style={{ width: '160px' }}></div></td>
                                                <td className="staff-col-phone"><div className="staff-skeleton-line" style={{ width: '100px' }}></div></td>
                                                <td className="staff-col-actions"><div className="staff-skeleton-line" style={{ width: '110px' }}></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="staff-empty-state">
                                <div className="staff-empty-icon-wrap">
                                    <FiUsers />
                                </div>
                                <h3>No staff found</h3>
                                <p>No staff members match your current search or filters.</p>
                                {(staffSearchQuery || staffPlanFilter || staffHospitalFilter) && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setStaffSearchQuery('');
                                            setStaffPlanFilter('');
                                            setStaffHospitalFilter('');
                                            setPage(1);
                                            fetchUsers('', '', 1, PAGE_SIZE, '', false);
                                        }}
                                        className="btn-staff-secondary"
                                        style={{ marginTop: '14px' }}
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div 
                                className="users-table" 
                                data-lenis-prevent
                                onScroll={handleTableScroll}
                            >
                                <table>
                                    <thead>
                                        <tr>
                                            <th className="staff-col-avatar">Avatar</th>
                                            <th className="staff-col-name">Name</th>
                                            <th className="staff-col-hospital">Hospital</th>
                                            <th className="staff-col-plan">Plan Name</th>
                                            <th className="staff-col-role">Role</th>
                                            <th className="staff-col-email">Email</th>
                                            <th className="staff-col-phone">Phone</th>
                                            <th className="staff-col-actions">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((userItem, index) => {
                                            const isCurrentUser = (userItem.id || userItem._id) === JSON.parse(localStorage.getItem('user') || '{}').id;
                                            const canModify = !isCurrentUser;
                                            const planInfo = getPlanBadge(userItem);

                                            return (
                                                <tr 
                                                    key={userItem.id || userItem._id} 
                                                    className="staff-table-row"
                                                >
                                                    <td className="staff-col-avatar">
                                                        {userItem.avatar ? (
                                                            <img src={userItem.avatar} alt={userItem.name} className="staff-avatar-img" />
                                                        ) : (
                                                            <div className="staff-avatar-circle-neutral">
                                                                {userItem.name?.charAt(0).toUpperCase() || 'S'}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="staff-col-name">{userItem.name}</td>
                                                    <td className="staff-col-hospital">
                                                        <span className="staff-hosp-tag">
                                                            {userItem.hospitalId ? (hospitals.find(h => h._id === String(userItem.hospitalId))?.name || userItem.hospitalName || hospital?.name || 'Unknown') : (
                                                                <span className="staff-no-hosp"><FiAlertCircle /> No hospital</span>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="staff-col-plan">
                                                        <span className={`staff-plan-tag staff-plan-${planInfo.key}`}>
                                                            {planInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="staff-col-role">
                                                        <span className="staff-role-tag">
                                                            {(userItem.role || 'No Role').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="staff-col-email">{userItem.email}</td>
                                                    <td className="staff-col-phone">{userItem.phone || '—'}</td>
                                                    <td className="staff-col-actions">
                                                        <div className="action-buttons">
                                                            {canModify && (
                                                                <>
                                                                    <button onClick={() => openEditModal(userItem)} className="btn-staff-action edit" title="Edit Staff Details">
                                                                        <FiEdit2 /> <span>Edit</span>
                                                                    </button>
                                                                    <button onClick={() => setDeleteConfirm(userItem.id || userItem._id)} disabled={deletingId === (userItem.id || userItem._id)} className="btn-staff-action delete" title="Delete Staff Account">
                                                                        <FiTrash2 /> <span>{deletingId === (userItem.id || userItem._id) ? 'Deleting...' : 'Delete'}</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Infinite Scroll Sentinel inside scrollable table */}
                                <div ref={observerRef} className="staff-infinite-sentinel" data-lenis-prevent>
                                    {loadingMore && (
                                        <div className="staff-infinite-loader">
                                            <div className="staff-infinite-spinner" />
                                        </div>
                                    )}
                                    {!hasMore && users.length > 0 && !loadingUsers && (
                                        <span className="staff-all-loaded-text">
                                            <FiCheck className="staff-loaded-icon" /> All {totalRecords} staff records loaded
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>


                {/* EDIT USER MODAL */}
                {editModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '600px' }}>
                            <div className="staff-modal-header">
                                <h3>Edit Staff Details</h3>
                                <button type="button" onClick={() => setEditModal(false)} className="staff-modal-close-btn" title="Close">
                                    <FiX />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateUser} className="user-form">
                                <div className="staff-avatar-edit-row">
                                    <div className="staff-avatar-preview-wrap">
                                        {editForm.newAvatarFile ? (
                                            <img src={URL.createObjectURL(editForm.newAvatarFile)} alt="Preview" className="staff-avatar-modal-img" />
                                        ) : editForm.currentAvatar ? (
                                            <img src={editForm.currentAvatar} alt="Current" className="staff-avatar-modal-img" />
                                        ) : (
                                            <div className="staff-avatar-modal-placeholder">
                                                <FiUsers />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="staff-label">Change Photo</label>
                                        <input type="file" accept="image/*" onChange={e => setEditForm({ ...editForm, newAvatarFile: e.target.files[0] })} className="staff-input" style={{ padding: '8px' }} />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="staff-label">Name</label>
                                        <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required className="staff-input" />
                                    </div>
                                    <div className="form-group">
                                        <label className="staff-label">Email</label>
                                        <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required className="staff-input" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="staff-label">Phone</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 9876543210"
                                            value={editForm.phone || ''}
                                            onChange={e => {
                                                const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setEditForm({ ...editForm, phone: cleanVal });
                                            }}
                                            className="staff-input"
                                            maxLength="10"  pattern="\d{10}"  title="Phone number must be exactly 10 digits" />
                                    </div>
                                    <div className="form-group">
                                        <label className="staff-label">Role</label>
                                        <select value={editForm.roleId} onChange={e => setEditForm({ ...editForm, roleId: e.target.value })} required disabled className="staff-input">
                                            {roles
                                                .filter(r => !['patient', 'user'].includes(r.name.toLowerCase()))
                                                .filter(r => {
                                                    const isClinic = hospital?.clinicType === 'clinic';
                                                    const name = r.name.toLowerCase();
                                                    if (isClinic) {
                                                        return name === 'clinic doctor';
                                                    } else {
                                                        return !name.includes('clinic');
                                                    }
                                                })
                                                .map(role => (
                                                    <option key={role._id} value={role._id}>{role.name}</option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {(() => {
                                    const selectedRole = roles.find(r => r._id === editForm.roleId || r.name === editForm.roleId);
                                    const roleName = (selectedRole?.name || '').toLowerCase();
                                    const isAssistant = roleName.includes('assistant');

                                    if (isAssistant) {
                                        const selectedDocIds = editForm.assignedDoctors || [];
                                        const derivedDepts = Array.from(new Set(
                                            availableDoctors
                                                .filter(d => selectedDocIds.includes(d._id))
                                                .flatMap(d => d.departments || [d.specialty].filter(Boolean))
                                        ));

                                        return (
                                            <div className="form-row staff-assistant-row">
                                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                    <label className="staff-label staff-label-highlight">
                                                        <FiUserCheck className="staff-field-icon" />
                                                        <span>Assign Responsible Doctors (Doctor Assistant will manage queue &amp; preparation for these doctors)</span>
                                                    </label>
                                                    <div className="staff-doctors-grid">
                                                        {availableDoctors.map(doc => {
                                                            const isChecked = selectedDocIds.includes(doc._id);
                                                            return (
                                                                <label key={doc._id} className={`staff-doctor-chip ${isChecked ? 'selected' : ''}`}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={(e) => {
                                                                            const updated = e.target.checked
                                                                                ? [...selectedDocIds, doc._id]
                                                                                : selectedDocIds.filter(id => id !== doc._id);
                                                                            setEditForm(prev => ({ ...prev, assignedDoctors: updated }));
                                                                        }}
                                                                    />
                                                                    <span className="staff-doctor-chip-name">
                                                                        {doc.name} ({doc.departments?.[0] || doc.specialty || 'General'})
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                    {derivedDepts.length > 0 && (
                                                        <div className="staff-derived-depts-note">
                                                            <FiCheck className="staff-note-icon" />
                                                            <span>Auto-derived Authorized Departments: {derivedDepts.join(', ')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}


                                {hospital && hospital.departments && hospital.departments.length > 0 && (
                                    <div className="form-row" style={{ marginTop: '10px' }}>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="staff-label">Assign Department (Optional - Leave blank to allow all)</label>
                                            <select
                                                value={editForm.department}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                                                className="staff-input"
                                                style={{ marginTop: '8px' }}
                                            >
                                                <option value="">-- Select Department --</option>
                                                {hospital.departments.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="modal-buttons staff-modal-buttons">
                                    <button 
                                        type="submit" 
                                        disabled={updating || !isStaffModified} 
                                        className="btn-staff-primary"
                                        style={{
                                            opacity: (!isStaffModified || updating) ? 0.6 : 1,
                                            cursor: (!isStaffModified || updating) ? 'not-allowed' : 'pointer'
                                        }}
                                        title={!isStaffModified ? 'No changes detected' : ''}
                                    >
                                        {updating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button type="button" onClick={() => setEditModal(false)} className="btn-staff-secondary">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '440px' }}>
                            <div className="staff-modal-header">
                                <h3>Confirm Staff Deletion</h3>
                                <button type="button" onClick={() => setDeleteConfirm(null)} disabled={deletingId !== null} className="staff-modal-close-btn" title="Close">
                                    <FiX />
                                </button>
                            </div>
                            <p className="staff-delete-prompt-text">Are you sure you want to delete this staff member? This action cannot be undone.</p>
                            <div className="modal-buttons staff-modal-buttons">
                                <button onClick={() => handleDeleteUser(deleteConfirm)} disabled={deletingId !== null} className="btn-staff-danger">
                                    {deletingId !== null ? 'Deleting...' : 'Delete'}
                                </button>
                                <button onClick={() => setDeleteConfirm(null)} disabled={deletingId !== null} className="btn-staff-secondary">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;