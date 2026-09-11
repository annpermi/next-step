import { hydrateRoot } from 'react-dom/client';
import App from './App.js';
import './styles.css';

// Without this, browsers auto-restore the scroll position from your last
// visit to this URL on every reload — with a hero this tall, testing near
// the bottom and then reloading looks exactly like "it jumps on load".
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element "#root" not found');
}

hydrateRoot(rootElement, <App />);
