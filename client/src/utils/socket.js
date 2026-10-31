import io from 'socket.io-client';

const rawBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : (typeof window !== 'undefined' ? window.location.origin : ''));
const API_BASE_URL = rawBaseUrl.startsWith('http') ? rawBaseUrl : (rawBaseUrl ? `https://${rawBaseUrl}` : '');

const socket = io(API_BASE_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

export default socket;
