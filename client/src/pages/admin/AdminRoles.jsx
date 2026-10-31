import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import confirmToast, { toast } from '../../utils/confirmToast';
import {
    FiShield,
    FiPlus,
    FiTrash2,
    FiEdit2,
    FiX,
    FiCheck,
    FiLayers,
    FiFolder,
    FiCompass,
    FiTag,
    FiUsers
} from 'react-icons/fi';
import './AdminRoles.css';

const AdminRoles = () => {
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [],
        dashboardPath: '/',
        navLinks: [{ label: '', path: '' }]
    });
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Organized Permissions List
    const PERMISSIONS = [
        {
            category: "PATIENT MANAGEMENT",
            items: [
                { key: 'patient_create', label: 'Register New Patients' },
                { key: 'patient_search', label: 'Search Patient Database' },
                { key: 'patient_view', label: 'View Patient Profiles' },
                { key: 'patient_edit', label: 'Edit Patient Profiles' }
            ]
        },
        {
            category: "CLINICAL & MEDICAL",
            items: [
                { key: 'nurse_access', label: 'Nurse Command Center & Inpatients' },
                { key: 'visit_intake', label: 'Nurse Intake (Vitals & History)' },
                { key: 'visit_diagnose', label: 'Doctor Diagnosis & Prescription' },
                { key: 'clinical_history_view', label: 'View Medical History' }
            ]
        },
        {
            category: "OPERATIONS",
            items: [
                { key: 'appointment_manage', label: 'Manage Appointments' },
                { key: 'appointment_view_all', label: 'View All Appointments' },
                { key: 'lab_view', label: 'View Lab Tests' },
                { key: 'lab_manage', label: 'Manage Lab Tests' },
                { key: 'pharmacy_view', label: 'View Pharmacy' },
                { key: 'pharmacy_manage', label: 'Pharmacy & Inventory' }
            ]
        },
        {
            category: "FINANCE & ACCOUNTING",
            items: [
                { key: 'finance_view', label: 'View Hospital Financials' },
                { key: 'billing_view', label: 'View Patient Billing' },
                { key: 'billing_manage', label: 'Manage Patient Billing (Cashier)' }
            ]
        },
        {
            category: "ADMIN",
            items: [
                { key: 'admin_manage_roles', label: 'Manage Roles' },
                { key: 'admin_view_stats', label: 'View Admin Stats' }
            ]
        }
    ];

    const PERMISSION_NAV_MAP = {
        nurse_access: { label: 'Nurse Command Center', path: '/nurse/dashboard' },
        patient_create: { label: 'Patient Registration', path: '/reception/dashboard' },
        patient_search: { label: 'Patient Search', path: '/reception/patients' },
        patient_view: { label: 'Patient Records', path: '/reception/patients' },
        patient_edit: { label: 'Edit Patients', path: '/reception/patients' },
        visit_intake: { label: 'Nurse Intake', path: '/nurse/opd-queue' },
        visit_diagnose: { label: 'Consultations', path: '/doctor/patients' },
        clinical_history_view: { label: 'Medical History', path: '/doctor/patients' },
        appointment_manage: { label: 'Reception', path: '/reception/dashboard' },
        appointment_view_all: { label: 'All Appointments', path: '/reception/dashboard' },
        lab_view: { label: 'Lab Dashboard', path: '/lab/dashboard' },
        lab_manage: { label: 'Lab Tests', path: '/lab/tests' },
        pharmacy_view: { label: 'Pharmacy', path: '/pharmacy/inventory' },
        pharmacy_manage: { label: 'Pharmacy Orders', path: '/pharmacy/orders' },
        admin_manage_roles: { label: 'Manage Users', path: '/admin/users' },
        admin_view_stats: { label: 'Admin Dashboard', path: '/admin' },
        finance_view: { label: 'Finance & Accounting', path: '/accountant/dashboard' },
        billing_view: { label: 'Patient Billing', path: '/cashier/billing' },
        billing_manage: { label: 'Patient Billing', path: '/cashier/billing' }
    };

    const getAutoNavLinks = (permissions) => {
        const seen = new Set();
        const links = [];
        permissions.forEach(perm => {
            const mapping = PERMISSION_NAV_MAP[perm];
            if (mapping && !seen.has(mapping.label)) {
                seen.add(mapping.label);
                links.push({ label: mapping.label, path: mapping.path });
            }
        });
        if (permissions.includes('admin_manage_roles') && !seen.has('Manage Roles')) {
            links.push({ label: 'Manage Roles', path: '/admin/roles' });
        }
        return links;
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await adminAPI.getRoles();
            if (res.success) setRoles(res.data);
        } catch (err) {
            console.error("Error fetching roles", err);
        }
    };

    const handlePermissionToggle = (key) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(key);
            return {
                ...prev,
                permissions: exists ? prev.permissions.filter(p => p !== key) : [...prev.permissions, key]
            };
        });
    };

    const addNavLink = () => {
        setFormData(prev => ({ ...prev, navLinks: [...prev.navLinks, { label: '', path: '' }] }));
    };

    const updateNavLink = (index, field, value) => {
        const updated = [...formData.navLinks];
        updated[index][field] = value;
        setFormData(prev => ({ ...prev, navLinks: updated }));
    };

    const removeNavLink = (index) => {
        const updated = formData.navLinks.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, navLinks: updated.length ? updated : [{ label: '', path: '' }] }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            permissions: [],
            dashboardPath: '/',
            navLinks: [{ label: '', path: '' }]
        });
        setEditingRoleId(null);
    };

    const handleEdit = (role) => {
        setEditingRoleId(role._id);
        setFormData({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions || [],
            dashboardPath: role.dashboardPath || '/',
            navLinks: role.navLinks && role.navLinks.length > 0 ? role.navLinks : [{ label: '', path: '' }]
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            toast.error('Role Name cannot be empty.');
            setLoading(false);
            return;
        }

        const isDuplicate = roles.some(r => r.name.toLowerCase() === trimmedName.toLowerCase() && r._id !== editingRoleId);
        if (isDuplicate) {
            toast.error('A role with this name already exists.');
            setLoading(false);
            return;
        }

        const pathRegex = /^\S+$/;
        if (formData.dashboardPath && !pathRegex.test(formData.dashboardPath)) {
            toast.error('Dashboard Path cannot contain spaces.');
            setLoading(false);
            return;
        }

        const manualLinks = formData.navLinks.filter(l => l.label.trim() && l.path.trim());
        for (const link of manualLinks) {
            if (!pathRegex.test(link.path)) {
                toast.error('Navigation paths cannot contain spaces.');
                setLoading(false);
                return;
            }
        }

        const autoLinks = getAutoNavLinks(formData.permissions);
        const combinedLinks = [...manualLinks];
        autoLinks.forEach(auto => {
            if (!combinedLinks.find(c => c.path === auto.path || c.label === auto.label)) {
                combinedLinks.push(auto);
            }
        });

        const cleanedData = {
            ...formData,
            navLinks: combinedLinks
        };

        try {
            if (editingRoleId) {
                await adminAPI.updateRole(editingRoleId, cleanedData);
                toast.success('Role updated successfully!');
            } else {
                await adminAPI.createRole(cleanedData);
                toast.success('Role created successfully!');
            }
            resetForm();
            fetchRoles();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error saving role');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, roleName) => {
        const confirmed = await confirmToast(
            `Are you sure you want to permanently delete the role "${roleName}"?`,
            { title: 'Delete Role', confirmText: 'Delete Role' }
        );
        if (!confirmed) return;

        try {
            await adminAPI.deleteRole(id);
            fetchRoles();
            toast.success(`Role "${roleName}" deleted successfully!`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete role');
        }
    };

    const permCount = formData.permissions.length;

    return (
        <div className="role-management-page rpm-main-wrapper">
            <div className="rpm-header-row">
                <div className="rpm-header-content">
                    <div className="rpm-header-icon-box">
                        <FiShield aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="rpm-header-title">Role &amp; Permission Manager</h1>
                        <p className="rpm-header-subtitle">
                            Configure healthcare access tiers, granular permission categories, and automated navigation links
                        </p>
                    </div>
                </div>
            </div>

            <div className="rpm-dashboard-grid">
                {/* ─── LEFT PANEL: CREATE / EDIT ROLE ─── */}
                <div className="rpm-panel rpm-editor-panel">
                    <div className="rpm-panel-header">
                        <div className="rpm-panel-header-left">
                            <span className="rpm-panel-header-icon">
                                <FiEdit2 aria-hidden="true" />
                            </span>
                            <span>{editingRoleId ? 'Edit Role Details' : 'Create New Role'}</span>
                            {editingRoleId && (
                                <span className="rpm-badge-editing">Editing</span>
                            )}
                        </div>
                        {editingRoleId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rpm-btn-cancel-edit"
                                aria-label="Cancel editing"
                            >
                                <FiX aria-hidden="true" />
                                <span>Cancel Edit</span>
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="rpm-form-group">
                            <label htmlFor="role-name-input">
                                <span>Role Name <span className="rpm-required-star">*</span></span>
                                <span className="rpm-field-hint">Max 100 characters</span>
                            </label>
                            <input
                                id="role-name-input"
                                type="text"
                                className="rpm-form-input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value.slice(0, 100) })}
                                placeholder="e.g. Senior Registered Nurse"
                                required
                            />
                        </div>

                        <div className="rpm-form-group">
                            <label htmlFor="role-desc-input">
                                <span>Role Description</span>
                                <span className="rpm-field-hint">Optional</span>
                            </label>
                            <input
                                id="role-desc-input"
                                type="text"
                                className="rpm-form-input"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value.slice(0, 1000) })}
                                placeholder="Describe responsibilities and access scope"
                            />
                        </div>

                        <div className="rpm-form-group">
                            <label htmlFor="role-dashboard-path">
                                <span>Default Dashboard Route <span className="rpm-required-star">*</span></span>
                                <span className="rpm-field-hint">e.g. /nurse/dashboard</span>
                            </label>
                            <input
                                id="role-dashboard-path"
                                type="text"
                                className="rpm-form-input"
                                value={formData.dashboardPath}
                                onChange={e => setFormData({ ...formData, dashboardPath: e.target.value.slice(0, 300) })}
                                placeholder="e.g. /reception/dashboard"
                                required
                            />
                        </div>

                        <div className="rpm-form-group">
                            <label>
                                <span>Sidebar Navigation Links</span>
                                <span className="rpm-field-hint">Custom routes</span>
                            </label>

                            <div className="rpm-nav-links-container">
                                <p className="rpm-nav-links-helper">
                                    Default navigation links are generated automatically from selected permissions. You can specify additional custom routes below.
                                </p>

                                {formData.navLinks.map((link, index) => (
                                    <div key={index} className="rpm-nav-link-block">
                                        <div className="rpm-input-row" style={{ marginBottom: '8px' }}>
                                            <div className="rpm-nav-field-wrapper">
                                                <FiTag className="rpm-nav-field-icon" aria-hidden="true" />
                                                <input
                                                    type="text"
                                                    className="rpm-form-input"
                                                    placeholder="Link Label (e.g. Inpatient Ward)"
                                                    value={link.label}
                                                    onChange={e => updateNavLink(index, 'label', e.target.value.slice(0, 300))}
                                                    aria-label={`Navigation link ${index + 1} label`}
                                                />
                                            </div>
                                        </div>
                                        <div className="rpm-input-row">
                                            <div className="rpm-nav-field-wrapper">
                                                <FiFolder className="rpm-nav-field-icon" aria-hidden="true" />
                                                <input
                                                    type="text"
                                                    className="rpm-form-input"
                                                    placeholder="Route Path (e.g. /inpatient/ward)"
                                                    value={link.path}
                                                    onChange={e => updateNavLink(index, 'path', e.target.value.slice(0, 300))}
                                                    aria-label={`Navigation link ${index + 1} route path`}
                                                />
                                            </div>
                                            {formData.navLinks.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="rpm-icon-btn delete-btn"
                                                    onClick={() => removeNavLink(index)}
                                                    title="Remove navigation link"
                                                    aria-label={`Remove navigation link ${index + 1}`}
                                                >
                                                    <FiTrash2 aria-hidden="true" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    className="rpm-add-link-btn"
                                    onClick={addNavLink}
                                    aria-label="Add additional navigation link"
                                >
                                    <FiPlus aria-hidden="true" />
                                    <span>Add Navigation Link</span>
                                </button>
                            </div>
                        </div>

                        {/* ASSIGN PERMISSIONS SECTION */}
                        <div className="rpm-perm-section">
                            <div className="rpm-perm-header-flex">
                                <div className="rpm-perm-title">Permission Categories</div>
                                <span className="rpm-perm-counter">{permCount} selected</span>
                            </div>

                            <div className="rpm-perm-categories-list">
                                {PERMISSIONS.map((cat) => {
                                    const activeCount = cat.items.filter(item => formData.permissions.includes(item.key)).length;
                                    return (
                                        <div key={cat.category} className="rpm-cat-block">
                                            <div className="rpm-cat-header">
                                                <span className="rpm-perm-sub">{cat.category}</span>
                                                <span className="rpm-cat-active-count">{activeCount} of {cat.items.length}</span>
                                            </div>
                                            <div className="rpm-checkbox-list">
                                                {cat.items.map(item => {
                                                    const isChecked = formData.permissions.includes(item.key);
                                                    return (
                                                        <label key={item.key} className={`rpm-checkbox-item ${isChecked ? 'active' : ''}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handlePermissionToggle(item.key)}
                                                                aria-label={item.label}
                                                            />
                                                            <span>{item.label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rpm-form-actions-row">
                            <button
                                type="submit"
                                disabled={loading}
                                className="rpm-btn-submit"
                            >
                                <FiCheck aria-hidden="true" />
                                <span>{loading ? 'Saving Changes...' : editingRoleId ? 'Update Role' : 'Create Role'}</span>
                            </button>
                            {editingRoleId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rpm-btn-secondary"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* ─── RIGHT PANEL: ACTIVE ROLES ─── */}
                <div className="rpm-panel rpm-roles-panel">
                    <div className="rpm-panel-header">
                        <div className="rpm-panel-header-left">
                            <span className="rpm-panel-header-icon">
                                <FiLayers aria-hidden="true" />
                            </span>
                            <span>Configured Roles</span>
                        </div>
                        <span className="rpm-badge-count">{roles.length} roles found</span>
                    </div>

                    <div className="rpm-roles-list">
                        {roles.length === 0 && (
                            <div className="rpm-empty-state">
                                <FiLayers className="rpm-empty-icon" aria-hidden="true" />
                                <p>No custom roles defined yet. Create your first role using the form on the left.</p>
                            </div>
                        )}

                        {roles.map((role) => {
                            const isSelected = editingRoleId === role._id;
                            const perms = role.permissions || [];

                            return (
                                <div
                                    key={role._id}
                                    className={`rpm-role-card ${isSelected ? 'highlight' : ''}`}
                                >
                                    <div className="rpm-card-actions">
                                        <button
                                            type="button"
                                            className="rpm-action-btn edit"
                                            onClick={() => handleEdit(role)}
                                            title={`Edit ${role.name}`}
                                            aria-label={`Edit ${role.name}`}
                                        >
                                            <FiEdit2 aria-hidden="true" />
                                        </button>
                                        {!role.isSystemRole && (
                                            <button
                                                type="button"
                                                className="rpm-action-btn delete"
                                                onClick={() => handleDelete(role._id, role.name)}
                                                title={`Delete ${role.name}`}
                                                aria-label={`Delete ${role.name}`}
                                            >
                                                <FiTrash2 aria-hidden="true" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="rpm-role-card-top">
                                        <span className="rpm-role-name">{role.name}</span>
                                        <div className="rpm-badges-group">
                                            <span className="rpm-tag-badge rpm-tag-teal">
                                                {perms.length} perms
                                            </span>
                                            {role.userCount > 0 && (
                                                <span className="rpm-tag-badge rpm-tag-slate">
                                                    <FiUsers aria-hidden="true" />
                                                    {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {role.isSystemRole && (
                                                <span className="rpm-tag-badge rpm-tag-amber">
                                                    System Role
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="rpm-role-desc">
                                        {role.description || "No description provided."}
                                    </p>

                                    <div className="rpm-role-meta-row">
                                        <span>Route:</span>
                                        <code className="rpm-dashboard-route-tag">
                                            <FiCompass aria-hidden="true" />
                                            {role.dashboardPath || '/'}
                                        </code>
                                    </div>

                                    <div className="rpm-tag-pills">
                                        {perms.slice(0, 4).map(p => (
                                            <span key={p} className="rpm-pill">
                                                {p.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                        {perms.length > 4 && (
                                            <span className="rpm-pill rpm-pill-more">
                                                +{perms.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRoles;