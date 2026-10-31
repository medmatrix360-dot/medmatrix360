/**
 * create-local-admin.js — Safe, Isolated Local Admin Account Creator
 *
 * Safety Enforcements:
 *  1. Connects strictly and exclusively to mongodb://127.0.0.1:27017/hms_dev_sandbox.
 *  2. Refuses all remote hosts, Atlas clusters, and other databases.
 *  3. Verifies interactive TTY terminal capability before running.
 *  4. Prompts interactively with hidden password input (does not echo characters to screen).
 *  5. Restores terminal state cleanly on success, validation failure, errors, or cancellation (Ctrl+C).
 *  6. Checks for duplicate accounts (email and phone) prior to insertion.
 *  7. Relies on the existing User model's pre-save hook for bcrypt password hashing (10 rounds).
 *  8. Never logs, prints, or exposes plaintext passwords.
 *  9. Assigns the platform-level 'centraladmin' role (hospitalId: null).
 * 10. Preserves the full standard authentication and OTP login workflow.
 * 11. Disconnects cleanly from MongoDB on all termination paths.
 */

const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');

// Strict Target Connection String
const TARGET_URI = 'mongodb://127.0.0.1:27017/hms_dev_sandbox';

/**
 * Validates protocol, hostname, port, and database name strictly.
 */
function validateDatabaseTarget(uri) {
    if (!uri || typeof uri !== 'string') {
        throw new Error('Database URI is missing.');
    }
    if (uri.startsWith('mongodb+srv://')) {
        throw new Error('SAFETY VIOLATION: Remote MongoDB Atlas connections (mongodb+srv://) are strictly forbidden.');
    }
    // Parse connection string components
    const normalized = uri.replace(/^mongodb:\/\//, 'http://');
    const parsed = new URL(normalized);
    const hostname = parsed.hostname;
    const port = parsed.port || '27017';
    const dbName = parsed.pathname.replace(/^\//, '').split('?')[0];

    if (hostname !== '127.0.0.1') {
        throw new Error(`SAFETY VIOLATION: Host must be strictly "127.0.0.1", received "${hostname}".`);
    }
    if (port !== '27017') {
        throw new Error(`SAFETY VIOLATION: Port must be strictly "27017", received "${port}".`);
    }
    if (dbName !== 'hms_dev_sandbox') {
        throw new Error(`SAFETY VIOLATION: Database name must be strictly "hms_dev_sandbox", received "${dbName}".`);
    }
}

/**
 * Restores the terminal to normal mode safely.
 */
function restoreTerminal() {
    try {
        if (process.stdin.isTTY && typeof process.stdin.setRawMode === 'function') {
            process.stdin.setRawMode(false);
        }
    } catch (_) {}
    try {
        process.stdin.pause();
    } catch (_) {}
}

/**
 * Ensures terminal supports interactive TTY and raw mode for secure password masking.
 */
function verifyInteractiveTerminal() {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
        throw new Error(
            'Interactive terminal (TTY) with raw mode support is required to securely hide password input.\n' +
            'Please run this script directly in a standard interactive terminal (e.g. PowerShell, CMD, or bash) without input redirection or piping.'
        );
    }
}

/**
 * Graceful termination and cleanup helper for interrupts (Ctrl+C / SIGINT).
 */
async function handleInterrupt() {
    restoreTerminal();
    process.stdout.write('\n\nOperation cancelled by user (SIGINT).\n');
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    } catch (_) {}
    process.exit(130);
}

process.once('SIGINT', handleInterrupt);
process.once('SIGTERM', handleInterrupt);

/**
 * Prompts for visible text input.
 */
function askQuestion(query) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans.trim());
        });
    });
}

/**
 * Prompts for hidden password input without echoing characters to terminal.
 */
function askHiddenQuestion(query) {
    return new Promise((resolve, reject) => {
        process.stdout.write(query);
        const stdin = process.stdin;
        const wasRaw = stdin.isRaw;
        let password = '';

        try {
            stdin.setRawMode(true);
            stdin.resume();
            stdin.setEncoding('utf8');
        } catch (err) {
            restoreTerminal();
            return reject(new Error('Failed to enable terminal raw mode: ' + err.message));
        }

        const onData = (char) => {
            // Enter key (CR or LF)
            if (char === '\n' || char === '\r' || char === '\u0004') {
                stdin.removeListener('data', onData);
                try { stdin.setRawMode(wasRaw || false); } catch (_) {}
                stdin.pause();
                process.stdout.write('\n');
                resolve(password);
            } else if (char === '\u0003') { // Ctrl+C cancellation
                stdin.removeListener('data', onData);
                restoreTerminal();
                handleInterrupt();
            } else if (char === '\u0008' || char === '\x7f' || char === '\b') { // Backspace
                if (password.length > 0) {
                    password = password.slice(0, -1);
                }
            } else {
                password += char;
            }
        };

        stdin.on('data', onData);
    });
}

async function createLocalAdmin() {
    let exitCode = 0;
    try {
        console.log('============================================================');
        console.log('  HMS Local Development Admin Account Provisioning');
        console.log('  Target Database: mongodb://127.0.0.1:27017/hms_dev_sandbox');
        console.log('============================================================\n');

        // 1. Verify terminal capability before touching network or database
        verifyInteractiveTerminal();

        // 2. Strict Target Validation
        validateDatabaseTarget(TARGET_URI);

        // 3. Interactive Input
        const name = await askQuestion('Enter Admin Full Name: ');
        if (!name || name.length < 2) {
            throw new Error('Name must be at least 2 characters long.');
        }

        const email = (await askQuestion('Enter Admin Email Address: ')).toLowerCase();
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            throw new Error('Invalid email address format.');
        }

        const phone = await askQuestion('Enter Admin 10-Digit Mobile Number: ');
        if (!phone || !/^\d{10}$/.test(phone)) {
            throw new Error('Mobile number must be exactly 10 digits.');
        }

        const password = await askHiddenQuestion('Enter Admin Password (hidden, min 6 characters): ');
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
        }

        const confirmPassword = await askHiddenQuestion('Confirm Admin Password (hidden): ');
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match.');
        }

        console.log('\n🔒 Connecting to isolated local sandbox database...');
        await mongoose.connect(TARGET_URI);
        console.log('✅ Connected to mongodb://127.0.0.1:27017/hms_dev_sandbox');

        // 4. Load User model and check for existing accounts
        const User = require(path.join(__dirname, '../src/models/user.model'));

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            throw new Error(`An account with email "${email}" already exists in hms_dev_sandbox.`);
        }

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            throw new Error(`An account with phone number "${phone}" already exists in hms_dev_sandbox.`);
        }

        // 5. Create single Central Admin User
        // Note: Plain password is passed to constructor; User model pre-save hook
        // automatically applies bcrypt salt rounds = 10 hashing before insertion.
        const newAdmin = new User({
            name,
            email,
            password,
            phone,
            role: 'centraladmin',
            hospitalId: null, // Central administrator manages all hospital entities
            services: ['System Administration', 'Hospital Management'],
            isVerified: true
        });

        await newAdmin.save();

        console.log('\n✅ Local Central Admin account successfully created!');
        console.log(`   User ID: ${newAdmin._id}`);
        console.log(`   Name:    ${newAdmin.name}`);
        console.log(`   Email:   ${newAdmin.email}`);
        console.log(`   Role:    ${newAdmin.role}`);
        console.log('\nLogin Instructions:');
        console.log('1. Navigate to: http://localhost:5173/supremeadmin');
        console.log(`2. Enter your email: ${newAdmin.email} and the chosen password.`);
        console.log('3. Your 6-digit OTP will be printed in the running backend terminal.');
        console.log('4. Enter the OTP in the frontend modal to access the Central Admin dashboard.\n');

    } catch (err) {
        console.error('\n❌ Account Provisioning Blocked/Failed:', err.message || err);
        exitCode = 1;
    } finally {
        restoreTerminal();
        try {
            if (mongoose.connection.readyState !== 0) {
                await mongoose.disconnect();
            }
        } catch (_) {}
        process.exit(exitCode);
    }
}

createLocalAdmin();

