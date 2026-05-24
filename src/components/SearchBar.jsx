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

  function handleButtonClick() {
    setShowSuggestions(false);
    onSearch(value);
  }

  const visibleSuggestions = showSuggestions ? suggestions : [];
  const isManuallTyped = value.trim().length > 0;

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
      <button onClick={handleButtonClick} disabled={loading || !isManuallTyped}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </div>
  );
}

export default SearchBar;
