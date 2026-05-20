import { useState } from 'react';
import GenerationSelector from './GenerationSelector';
import PokemonGrid from './PokemonGrid';
import PokemonCardList from './PokemonCardList';

function BinderView({ ownedCards, onToggleCard, onToggleWishlist, onCardDetail }) {
  const [view, setView] = useState('gen-select');
  const [selectedGen, setSelectedGen] = useState(null);
  const [spread, setSpread] = useState(0);
  const [cardListPokemon, setCardListPokemon] = useState(null);

  function handleSelectGen(gen) {
    setSelectedGen(gen);
    setSpread(0);
    setView('pokemon-grid');
  }

  function handleSelectPokemon(pokemon) {
    setCardListPokemon(pokemon);
  }

  function handleImportImage(pokemon, dataUrl) {
    onToggleCard(
      { id: `imported-${pokemon.id}`, images: { small: dataUrl } },
      { name: pokemon.name, id: pokemon.id }
    );
  }

  return (
    <div className="binder-view">
      {view === 'gen-select' && (
        <GenerationSelector ownedCards={ownedCards} onSelect={handleSelectGen} />
      )}
      {view === 'pokemon-grid' && (
        <PokemonGrid
          gen={selectedGen}
          ownedCards={ownedCards}
          onSelectPokemon={handleSelectPokemon}
          onImportImage={handleImportImage}
          onToggleCard={onToggleCard}
          onToggleWishlist={onToggleWishlist}
          onBack={() => setView('gen-select')}
          spread={spread}
          onSpreadChange={setSpread}
        />
      )}

      {cardListPokemon && (
        <PokemonCardList
          pokemon={cardListPokemon}
          ownedCards={ownedCards}
          onToggleCard={onToggleCard}
          onClose={() => setCardListPokemon(null)}
          onCardDetail={onCardDetail}
        />
      )}
    </div>
  );
}

export default BinderView;
