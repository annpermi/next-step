import { renderToString } from 'react-dom/server';
import App from './App.js';
import './styles.css';

export function render(_url?: string): string {
  return renderToString(<App />);
}
