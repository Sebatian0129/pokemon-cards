import { useEffect } from 'react';
import './Toast.css';

function Toast({ message, type = 'success', visible, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' && <span>✓</span>}
      {type === 'error' && <span>✕</span>}
      {type === 'info' && <span>ℹ</span>}
      <span className="toast-message">{message}</span>
    </div>
  );
}

export default Toast;
