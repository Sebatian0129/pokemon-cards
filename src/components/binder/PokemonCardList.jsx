import { useState, useEffect } from 'react';
import { fetchAllCards } from '../../utils';

const FILTERS = ['Todas', 'Tengo', 'No tengo'];

function PokemonCardList({ pokemon, ownedCards, onToggleCard, onClose, onCardDetail }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('Todas');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const searchName = pokemon.baseName ?? pokemon.searchName ?? pokemon.name;
    fetchAllCards(searchName)
      .then(setCards)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pokemon.name]);

  const ownedCount = cards.filter((c) => ownedCards[c.id]).length;

  const visible = cards.filter((c) => {
    if (filter === 'Tengo') return !!ownedCards[c.id];
    if (filter === 'No tengo') return !ownedCards[c.id];
    return true;
  });

  return (
    <div className="card-list-overlay" onClick={onClose}>
      <div className="card-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-list-modal-header">
          <div className="card-list-modal-title">
            <img src={pokemon.sprite} alt={pokemon.name} className="header-sprite" />
            <div>
              <h2>{pokemon.name}</h2>
              {!loading && (
                <p className="binder-progress-text">
                  {ownedCount} / {cards.length} cartas registradas
                </p>
              )}
            </div>
          </div>

          <div className="card-list-modal-controls">
            {!loading && cards.length > 0 && (
              <div className="card-pick-filters">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    className={`filter-btn ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
            <button className="card-list-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>
        </div>

        <div className="card-list-modal-body">
          {loading && <p className="loading-message">Buscando cartas...</p>}
          {error && <p className="error-message">Error: {error}</p>}
          {!loading && cards.length === 0 && !error && (
            <p className="no-results">No se encontraron cartas TCG para {pokemon.name}.</p>
          )}

          <div className="card-pick-grid">
            {visible.map((card) => {
              const owned = !!ownedCards[card.id];
              return (
                <div
                  key={card.id}
                  className={`card-pick-item ${owned ? 'owned' : ''}`}
                  onClick={() => onToggleCard(card, pokemon)}
                  title={owned ? 'Quitar del binder' : 'Agregar al binder'}
                >
                  {card.images.small ? (
                    <img src={card.images.small} alt={card.name} className="card-pick-img" loading="lazy" />
                  ) : (
                    <div className="card-no-image"><span>{card.name}</span></div>
                  )}

                  {owned && <div className="card-pick-owned-badge">✓</div>}

                  <button
                    className="card-pick-detail-btn"
                    onClick={(e) => { e.stopPropagation(); onCardDetail(card); }}
                    title="Ver detalles"
                  >
                    ⓘ
                  </button>

                  <div className="card-pick-label">
                    <span className="card-pick-set-name">{card.set.name}</span>
                    <span className="card-pick-number">#{card.number}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PokemonCardList;
