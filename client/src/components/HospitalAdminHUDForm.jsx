import React, { useEffect, useRef, useState } from 'react';
import './HospitalAdminHUDForm.css';

const HospitalAdminHUDForm = ({
    hospitalAdminForm,
    setHospitalAdminForm,
    handleCreateHospitalAdmin,
    creatingHospitalAdmin,
    hospitals = []
}) => {
    const fileInputRef = useRef(null);
    const [selectedFileName, setSelectedFileName] = useState(hospitalAdminForm?.file?.name || '');

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFileName(file.name);
            setHospitalAdminForm(prev => ({ ...prev, file }));
        }
    };

    const sortedHospitals = [...hospitals].sort((a, b) =>
        (a.name || '').trim().toLowerCase().localeCompare((b.name || '').trim().toLowerCase())
    );

    return (
        <div className="had-unified-container">
            {/* SINGLE MERGED UNIFIED CARD */}
            <div className="had-unified-card">
                {/* LEFT SIDE: WIDE EXPANDED FORM */}
                <div className="had-form-column">
                    <div className="had-card-header">
                        <div className="had-icon-box">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D85F89" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div className="had-title-col">
                            <h2>
                                Create Hospital Admin Account
                                <span className="had-badge">
                                    <span className="had-badge-dot"></span> ADMIN ACCESS
                                </span>
                            </h2>
                            <p>This administrator will login at <strong>/login</strong> and manage all hospital operations.</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateHospitalAdmin} className="had-form">
                        <div className="had-form-grid">
                            {/* FULL NAME */}
                            <div className="had-field-group">
                                <label className="had-label">FULL NAME <span className="had-req">*</span></label>
                                <div className="had-input-box">
                                    <svg className="had-f-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <input
                                        type="text"
                                        className="had-input"
                                        placeholder="e.g. Dr. Ramesh Kumar"
                                        value={hospitalAdminForm.name}
                                        onChange={e => setHospitalAdminForm({ ...hospitalAdminForm, name: e.target.value })}
                                        required
                                        minLength={2}
                                    />
                                </div>
                            </div>

                            {/* EMAIL */}
                            <div className="had-field-group">
                                <label className="had-label">EMAIL <span className="had-req">*</span></label>
                                <div className="had-input-box">
                                    <svg className="had-f-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    <input
                                        type="email"
                                        className="had-input"
                                        placeholder="admin@hospital.com"
                                        value={hospitalAdminForm.email}
                                        onChange={e => setHospitalAdminForm({ ...hospitalAdminForm, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* PASSWORD */}
                            <div className="had-field-group">
                                <label className="had-label">PASSWORD <span className="had-req">*</span></label>
                                <div className="had-input-box">
                                    <svg className="had-f-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <input
                                        type="text"
                                        className="had-input"
                                        placeholder="Temporary password"
                                        value={hospitalAdminForm.password}
                                        onChange={e => setHospitalAdminForm({ ...hospitalAdminForm, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* PHONE */}
                            <div className="had-field-group">
                                <label className="had-label">PHONE <span className="had-req">*</span></label>
                                <div className="had-input-box">
                                    <svg className="had-f-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                    <input
                                        type="tel"
                                        className="had-input"
                                        placeholder="10-digit phone number"
                                        maxLength={10}
                                        value={hospitalAdminForm.phone}
                                        onChange={e => {
                                            const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setHospitalAdminForm({ ...hospitalAdminForm, phone: cleanVal });
                                        }}
                                        required
                                        pattern="\d{10}"
                                        title="Phone number must be exactly 10 digits"
                                    />
                                </div>
                            </div>

                            {/* AGE */}
                            <div className="had-field-group">
                                <label className="had-label">AGE <span className="had-req">*</span></label>
                                <div className="had-input-box">
                                    <svg className="had-f-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <input
                                        type="number"
                                        className="had-input"
                                        placeholder="Age"
                                        min="20"
                                        max="100"
                                        value={hospitalAdminForm.age || ''}
                                        onChange={e => {
                                            const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 3);
                                            setHospitalAdminForm({ ...hospitalAdminForm, age: cleanVal });
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* AADHAAR NUMBER */}
                            <div className="had-field-group">
                                <label className="had-label">AADHAAR NUMBER <span className="had-req">*</span></label>
                                <div className="had-input-box">
                                    <svg className="had-f-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                        <line x1="2" y1="10" x2="22" y2="10"></line>
                                    </svg>
                                    <input
                                        type="text"
                                        className="had-input"
                                        placeholder="12-digit Aadhaar"
                                        maxLength={12}
                                        value={hospitalAdminForm.aadhaarNumber || ''}
                                        onChange={e => {
                                            const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 12);
                                            setHospitalAdminForm({ ...hospitalAdminForm, aadhaarNumber: cleanVal });
                                        }}
                                        required
                                        pattern="^\d{12}$"
                                        title="Aadhaar number must be exactly 12 digits"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM ROW: PROFILE PHOTO & ASSIGN HOSPITAL */}
                        <div className="had-bottom-grid">
                            {/* PROFILE PHOTO SCANNER */}
                            <div className="had-field-group">
                                <label className="had-label">PROFILE PHOTO</label>
                                <div className="had-photo-picker" onClick={() => fileInputRef.current?.click()}>
                                    <div className="had-photo-laser"></div>
                                    <div className="had-photo-shutter">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                            <circle cx="12" cy="13" r="4"></circle>
                                        </svg>
                                    </div>
                                    <div className="had-photo-meta">
                                        <strong>{selectedFileName || 'Scan / Upload Photo'}</strong>
                                        <span>{selectedFileName ? 'Photo attached' : 'Click to select image file'}</span>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            {/* ASSIGN HOSPITAL */}
                            <div className="had-field-group">
                                <label className="had-label">ASSIGN HOSPITAL <span className="had-req">*</span></label>
                                <div className="had-input-box">
                                    <svg className="had-f-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 21h18M5 21V7l8-4v18M13 11h4M13 15h4M13 19h4M9 9v.01M9 13v.01M9 17v.01"></path>
                                    </svg>
                                    <select
                                        className="had-select"
                                        value={hospitalAdminForm.hospitalId || ''}
                                        onChange={e => setHospitalAdminForm({ ...hospitalAdminForm, hospitalId: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>-- Select Hospital --</option>
                                        {sortedHospitals.map(h => (
                                            <option key={h._id} value={h._id}>
                                                {h.name}{h.city ? ` — ${h.city}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* HIGH ENERGY SUBMIT BUTTON */}
                        <button type="submit" disabled={creatingHospitalAdmin} className="had-submit-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            {creatingHospitalAdmin ? 'Provisioning Hospital Admin Node...' : 'Create Hospital Admin'}
                        </button>
                    </form>
                </div>

                {/* RIGHT SIDE: SEAMLESS HERO COMMAND DECK (ALIGNED TO TOP) */}
                <div className="had-visual-column">
                    {/* BIG HERO IMAGE */}
                    <div className="had-hub-image-container">
                        <img
                            src="/assets/smart-hospital-hub.jpg"
                            alt="Smart Hospital Command Center"
                            className="had-hub-img"
                        />
                    </div>

                    {/* CONCISE 3 BULLET POINTS */}
                    <div className="had-minimal-points">
                        <div className="had-m-point">
                            <span className="had-m-icon">✓</span>
                            <span>Manage OPD, IPD, Beds, Appointments & Doctors</span>
                        </div>
                        <div className="had-m-point">
                            <span className="had-m-icon">✓</span>
                            <span>Access Pharmacy, Labs, Billing & Receptionists</span>
                        </div>
                        <div className="had-m-point">
                            <span className="had-m-icon">✓</span>
                            <span>White-Label Domain & Custom Branding Controls</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalAdminHUDForm;
