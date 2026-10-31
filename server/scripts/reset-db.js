const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require(path.join(__dirname, '../src/models/user.model'));
const Appointment = require(path.join(__dirname, '../src/models/appointment.model'));
const Doctor = require(path.join(__dirname, '../src/models/doctor.model'));
const Lab = require(path.join(__dirname, '../src/models/lab.model'));
const Pharmacy = require(path.join(__dirname, '../src/models/pharmacy.model'));
const Reception = require(path.join(__dirname, '../src/models/reception.model'));

// Safe connection string configuration from environment
const MONGO_URI = process.env.MONGODB_URL || process.env.MONGODB_URI;

/**
 * Validate that the connection string points ONLY to a local, non-production sandbox database.
 */
function validateTargetSafety(uri) {
    if (!uri || typeof uri !== 'string') {
        throw new Error('MONGODB_URL environment variable is required. Refusing to run without explicit target.');
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('SAFETY VIOLATION: Database reset cannot be executed in production environment.');
    }

    // Reject remote protocol
    if (uri.startsWith('mongodb+srv://')) {
        throw new Error('SAFETY VIOLATION: Remote MongoDB Atlas connections (mongodb+srv://) are strictly prohibited for database reset.');
    }

    // Require local host
    const isLocalhost = uri.includes('127.0.0.1') || uri.includes('localhost');
    if (!isLocalhost) {
        throw new Error('SAFETY VIOLATION: Database reset is only permitted on local host (127.0.0.1 or localhost).');
    }

    // Require explicit sandbox/test naming in database path
    const parsedPath = uri.split('/').pop()?.split('?')[0];
    const isIsolatedDb = parsedPath && (
        parsedPath.includes('sandbox') ||
        parsedPath.includes('dev') ||
        parsedPath.includes('test')
    );

    if (!isIsolatedDb) {
        throw new Error(`SAFETY VIOLATION: Target database "${parsedPath}" does not have a safe sandbox/dev/test identifier.`);
    }

    // Require explicit confirmation flag to prevent accidental execution
    if (process.env.CONFIRM_DB_RESET !== 'true') {
        throw new Error('SAFETY GUARD: To execute a database reset on this isolated local sandbox, you must set CONFIRM_DB_RESET=true.');
    }

    return true;
}

const reset = async () => {
    try {
        console.log('🔒 Evaluating database reset safety guards...');
        validateTargetSafety(MONGO_URI);

        console.log(`⏳ Connecting to verified local database: ${MONGO_URI.replace(/\/\/.*@/, '//***@')}...`);
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to local sandbox database.');

        // 1. CLEAR COLLECTIONS (Fixes the Schema Mismatch)
        console.log('🗑️  Clearing Corrupt Data from isolated local sandbox...');
        try { await User.collection.drop(); } catch (e) { }
        try { await Appointment.collection.drop(); } catch (e) { }
        try { await Doctor.collection.drop(); } catch (e) { }
        try { await Lab.collection.drop(); } catch (e) { }
        try { await Pharmacy.collection.drop(); } catch (e) { }
        try { await Reception.collection.drop(); } catch (e) { }

        // 2. CREATE ADMIN USER
        console.log('👤 Creating Fresh Admin User...');
        const admin = new User({
            name: 'System Admin',
            email: 'admin@admin.com',
            password: 'admin', // Will be hashed automatically
            role: 'superadmin',
            phone: '9999999999',
            services: ['Manage Users', 'System Settings']
        });
        await admin.save();
        console.log('✅ Admin Created: admin@admin.com / admin');

        // 3. CREATE RECEPTION USER (For testing dashboard)
        const reception = new User({
            name: 'Reception Desk',
            email: 'reception@crm.com',
            password: '123',
            role: 'reception',
            phone: '8888888888',
            services: ['Patient Registration']
        });
        await reception.save();
        console.log('✅ Reception Created: reception@crm.com / 123');

        console.log('🎉 LOCAL DATABASE RESET COMPLETE.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Database Reset Blocked/Failed:', err.message || err);
        process.exit(1);
    }
};

reset();