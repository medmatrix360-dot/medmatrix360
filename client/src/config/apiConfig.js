/**
 * apiConfig.js — Centralized API configuration for Medical365 HMS
 * Independent configuration module to eliminate circular dependencies.
 */

const defaultBackend = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ? 'http://localhost:3000' : '';
const rawBaseURL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || defaultBackend;

export const baseURL = rawBaseURL ? (rawBaseURL.startsWith('http') ? rawBaseURL : `https://${rawBaseURL}`) : '';

