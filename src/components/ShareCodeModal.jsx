import { useState, useEffect } from 'react';
import { getShareCode, setShareCode, generateShareCode, loadOwnedCardsFromFirebase } from '../firebase';
import './ShareCodeModal.css';

function ShareCodeModal({ isOpen, onClose, onLoadCards }) {
  const [shareCode, setLocalShareCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('view');

  useEffect(() => {
    if (isOpen) {
      loadCurrentShareCode();
    }
  }, [isOpen]);

  async function loadCurrentShareCode() {
    const code = await getShareCode();
    if (code) {
      setLocalShareCode(code);
    }
  }

  async function handleGenerateCode() {
    setLoading(true);
    setMessage('');
    try {
      const newCode = await generateShareCode();
      await setShareCode(newCode);
      setLocalShareCode(newCode);
      setMessage('Código generado exitosamente');
    } catch (error) {
      setMessage('Error al generar el código');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadFromCode() {
    if (!inputCode.trim()) {
      setMessage('Por favor ingresa un código');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const cards = await loadOwnedCardsFromFirebase(inputCode);
      if (Object.keys(cards).length > 0) {
        onLoadCards(cards);
        setMessage('Cartas sincronizadas correctamente');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage('No se encontraron cartas con este código');
      }
    } catch (error) {
      setMessage('Error al cargar las cartas');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-code-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Sincronizar Colección</h2>

        <div className="modal-tabs">
          <button
            className={`tab-button ${tab === 'view' ? 'active' : ''}`}
            onClick={() => setTab('view')}
          >
            Ver Código
          </button>
          <button
            className={`tab-button ${tab === 'load' ? 'active' : ''}`}
            onClick={() => setTab('load')}
          >
            Cargar Colección
          </button>
        </div>

        {tab === 'view' && (
          <div className="modal-content">
            <p className="modal-description">
              Comparte este código con otros dispositivos para sincronizar tu colección en tiempo real.
            </p>
            {shareCode ? (
              <div className="code-display">
                <input
                  type="text"
                  value={shareCode}
                  readOnly
                  className="code-input"
                />
                <button
                  className="copy-button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareCode);
                    setMessage('Código copiado al portapapeles');
                  }}
                >
                  Copiar
                </button>
              </div>
            ) : (
              <p className="no-code">No tienes un código compartido aún</p>
            )}
            <button
              className="generate-button"
              onClick={handleGenerateCode}
              disabled={loading}
            >
              {loading ? 'Generando...' : shareCode ? 'Generar Nuevo Código' : 'Generar Código'}
            </button>
          </div>
        )}

        {tab === 'load' && (
          <div className="modal-content">
            <p className="modal-description">
              Ingresa el código compartido por otro dispositivo para cargar su colección.
            </p>
            <div className="code-input-group">
              <input
                type="text"
                placeholder="Ingresa el código..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="code-input"
                disabled={loading}
              />
              <button
                className="load-button"
                onClick={handleLoadFromCode}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Cargar'}
              </button>
            </div>
          </div>
        )}

        {message && <p className="modal-message">{message}</p>}
      </div>
    </div>
  );
}

export default ShareCodeModal;
