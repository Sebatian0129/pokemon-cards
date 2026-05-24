function PokemonSlot({ pokemon, owned, ownedCards, onSelectPokemon, onImportImage, onRemoveCard }) {
  const getCardCount = () => {
    return Object.values(ownedCards).filter(
      (card) => card.pokemonId === pokemon.id
    ).length;
  };

  const cardCount = getCardCount();
  const hasCards = cardCount > 0;

  if (owned) {
    return (
      <div className="book-slot book-slot-owned">
        <div className="book-slot-card">
          <img src={owned.imageUrl} alt={owned.pokemonName} loading="lazy" />
          {owned.wishlist && <div className="book-slot-wishlist-badge">⭐</div>}
        </div>
        <div className="book-slot-hover-overlay">
          <button className="book-slot-icon-btn book-slot-action-search" title="Ver más cartas" onClick={() => onSelectPokemon(pokemon)}>
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="6" cy="6" r="4"/>
              <line x1="10" y1="10" x2="14" y2="14"/>
            </svg>
          </button>
          <button className="book-slot-icon-btn book-slot-action-danger" title="Eliminar del binder" onClick={() => onRemoveCard(owned.cardId)}>
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="#f87171" strokeWidth="1.8">
              <polyline points="3,4 13,4"/>
              <path d="M5 4V3h6v1"/>
              <rect x="4" y="5" width="8" height="8" rx="1"/>
              <line x1="6.5" y1="7" x2="6.5" y2="11"/>
              <line x1="9.5" y1="7" x2="9.5" y2="11"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-slot">
      <div className="book-slot-sprite-wrapper">
        <img src={pokemon.sprite} alt={pokemon.name} className="book-slot-sprite" loading="lazy" />
        {hasCards && (
          <div className="book-slot-progress-badge">
            {cardCount}
          </div>
        )}
        <span className="book-slot-name">{pokemon.name}</span>
      </div>
      <div className="book-slot-hover-overlay">
        <button className="book-slot-action-btn" onClick={() => onSelectPokemon(pokemon)}>
          🔍 Buscar carta
        </button>
        <label className="book-slot-action-btn book-slot-action-import">
          🖼 Importar imagen
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => onImportImage(pokemon, ev.target.result);
              reader.readAsDataURL(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}

export default PokemonSlot;
