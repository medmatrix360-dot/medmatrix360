import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  HiOutlineCheckCircle,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineDocumentText,
  HiOutlineCreditCard,
  HiOutlineHome
} from 'react-icons/hi';
import './Appointment.css';

const AppointmentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointment = location.state?.appointment;

  useEffect(() => {
    if (!appointment) {
      navigate('/appointment');
    }
  }, [appointment, navigate]);

  if (!appointment) {
    return null;
  }

  const appointmentDate = new Date(appointment.appointmentDate);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="appointment-page">
      <div className="content-wrapper" style={{ maxWidth: '640px' }}>
        
        {/* Success Header */}
        <section className="appointment-header" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: 'none', marginBottom: '20px', paddingBottom: '0' }}>
          <div className="header-content" style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(216, 95, 137, 0.1)',
              border: '1.5px solid rgba(216, 95, 137, 0.25)',
              color: '#D85F89',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              margin: '0 auto 16px auto'
            }}>
              <HiOutlineCheckCircle />
            </div>

            <span className="badge">
              <HiOutlineCheckCircle /> Appointment Confirmed
            </span>

            <h1 style={{ fontSize: '1.85rem', marginTop: '6px' }}>
              Appointment <span className="text-gradient">Scheduled</span>
            </h1>

            <p className="header-subtext" style={{ maxWidth: '480px', margin: '0 auto' }}>
              Your appointment has been successfully booked. You can review your consultation details below.
            </p>
          </div>
        </section>

        {/* Appointment Details Card */}
        <section className="booking-form-section" style={{ padding: '28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--appt-border, #e2e8f0)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--appt-text, #0f172a)', margin: 0 }}>
              Consultation Summary
            </h2>
            <span className={`status-badge status-${appointment.status || 'confirmed'}`}>
              {(appointment.status || 'confirmed').toUpperCase()}
            </span>
          </div>

          <div className="appointment-details-list" style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
            <div className="detail-item">
              <span className="detail-icon"><HiOutlineUser /></span>
              <div style={{ flex: 1 }}>
                <span className="detail-label">Specialist Doctor</span>
                <span className="detail-value">{appointment.doctorName}</span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-icon"><HiOutlineCalendar /></span>
              <div style={{ flex: 1 }}>
                <span className="detail-label">Date</span>
                <span className="detail-value">{formattedDate}</span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-icon"><HiOutlineClock /></span>
              <div style={{ flex: 1 }}>
                <span className="detail-label">Time Slot</span>
                <span className="detail-value">{appointment.appointmentTime}</span>
              </div>
            </div>

            {appointment.serviceName && (
              <div className="detail-item">
                <span className="detail-icon"><HiOutlineDocumentText /></span>
                <div style={{ flex: 1 }}>
                  <span className="detail-label">Service</span>
                  <span className="detail-value">{appointment.serviceName}</span>
                </div>
              </div>
            )}

            <div className="detail-item">
              <span className="detail-icon"><HiOutlineCreditCard /></span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span className="detail-label">Payment Status</span>
                  <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                    {appointment.paymentStatus === 'paid' ? 'Paid' : 'Pending at Clinic'}
                  </span>
                </div>
                <span className={`status-badge status-${appointment.paymentStatus === 'paid' ? 'confirmed' : 'pending'}`} style={{ fontSize: '0.72rem' }}>
                  {appointment.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            <Link 
              to="/" 
              className="btn btn-secondary" 
              style={{ flex: '1 1 180px', textDecoration: 'none' }}
            >
              <HiOutlineHome /> Back to Home
            </Link>
            <Link 
              to="/lab-reports" 
              className="btn btn-primary" 
              style={{ flex: '1 1 180px', textDecoration: 'none' }}
            >
              <HiOutlineDocumentText /> View Lab Reports
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AppointmentSuccess;
