import { hydrateRoot } from 'react-dom/client';
import App from './App.js';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element "#root" not found');
}

hydrateRoot(rootElement, <App />);
