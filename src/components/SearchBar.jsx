import { useState } from 'react';

function SearchBar({ value, onChange, onSearch, loading, suggestions, onSuggestionSelect }) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      onSearch();
    }
    if (e.key === 'Escape') setShowSuggestions(false);
  }

  function handleSuggestionClick(name) {
    setShowSuggestions(false);
    onSuggestionSelect(name);
  }

  const visibleSuggestions = showSuggestions ? suggestions : [];

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Busca un Pokémon... ej: Pikachu"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          // El timeout permite que el click en una sugerencia se registre antes de cerrar
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        {visibleSuggestions.length > 0 && (
          <ul className="suggestions-list">
            {visibleSuggestions.map((name) => (
              <li key={name} onMouseDown={() => handleSuggestionClick(name)}>
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button onClick={onSearch} disabled={loading || !value.trim()}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </div>
  );
}

export default SearchBar;
