import PokemonCard from './PokemonCard';

// Props: cards (array de resultados), searchedName (nombre buscado)
function CardGrid({ cards, searchedName, onCardClick }) {
  if (cards.length === 0) {
    return (
      <p className="no-results">
        No se encontraron cartas para &quot;{searchedName}&quot;.
      </p>
    );
  }

  return (
    <>
      <p className="results-count">{cards.length} carta(s) encontrada(s)</p>
      <div className="card-grid">
        {cards.map((card) => (
          <PokemonCard key={card.id} card={card} onClick={onCardClick} />
        ))}
      </div>
    </>
  );
}

export default CardGrid;
