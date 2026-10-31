/**
 * Single source of truth for JWT configuration.
 * Crashes the process at startup if JWT_SECRET is not set — a missing secret
 * in production would otherwise silently fall back to a known string, allowing
 * anyone to forge tokens.
 */

const secret = process.env.JWT_SECRET;

if (!secret || secret.trim().length < 32) {
    console.error('[FATAL] JWT_SECRET env var is missing or too short (min 32 chars). Set a valid secret in your .env before starting the server.');
    process.exit(1);
}

// Set JWT_EXPIRES_IN to 7 days
const defaultExpiry = '7d';

module.exports = {
    JWT_SECRET: secret,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || defaultExpiry,
};

