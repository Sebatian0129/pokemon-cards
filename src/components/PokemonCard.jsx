function PokemonCard({ card, onClick }) {
  return (
    <div className="pokemon-card" onClick={() => onClick(card)}>
      {card.images.small ? (
        <img src={card.images.small} alt={card.name} loading="lazy" />
      ) : (
        <div className="card-no-image"><span>{card.name}</span></div>
      )}
      <div className="card-info">
        <p className="card-name">{card.name}</p>
        <p className="card-set">{card.set.name}</p>
        {card.rarity && <p className="card-rarity">{card.rarity}</p>}
      </div>
    </div>
  );
}

export default PokemonCard;
