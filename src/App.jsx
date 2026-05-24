import { useState, useEffect } from 'react';
import { capitalize, fetchAllCards } from './utils';
import NavBar from './components/NavBar';
import SearchBar from './components/SearchBar';
import CardGrid from './components/CardGrid';
import CardModal from './components/CardModal';
import BinderView from './components/binder/BinderView';
import ShareCodeModal from './components/ShareCodeModal';
import { getShareCode, saveOwnedCardsToFirebase, listenToOwnedCards } from './firebase';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('search');
  const [sidebarExpanded, setSidebarExpanded] = useState(() => window.innerWidth >= 768);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // ── Search state ──
  const [searchTerm, setSearchTerm] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchedName, setSearchedName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [pokemonNames, setPokemonNames] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  // ── Binder state (persiste en localStorage) ──
  const [ownedCards, setOwnedCards] = useState(() => {
    try {
      const saved = localStorage.getItem('binder_owned');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleResize = () => {
      setSidebarExpanded(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=2000')
      .then((r) => r.json())
      .then((data) => setPokemonNames(data.results.map((p) => capitalize(p.name))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let unsubscribe;
    let lastLocalUpdate = 0;

    async function setupFirebaseSync() {
      try {
        const shareCode = await getShareCode();
        if (shareCode) {
          unsubscribe = listenToOwnedCards(shareCode, (cardsFromFirebase) => {
            const now = Date.now();
            if (now - lastLocalUpdate > 1000) {
              setOwnedCards(cardsFromFirebase || {});
              localStorage.setItem('binder_owned', JSON.stringify(cardsFromFirebase || {}));
            }
          });
        }
      } catch (error) {
        console.error('Firebase setup error:', error);
      }
    }
    setupFirebaseSync();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const suggestions =
    searchTerm.trim().length >= 2
      ? pokemonNames
          .filter((name) => name.toLowerCase().startsWith(searchTerm.toLowerCase().trim()))
          .slice(0, 8)
      : [];

  async function handleSearch(nameOverride) {
    const nameToSearch = nameOverride ?? searchTerm;
    const name = nameToSearch.trim();
    if (!name) {
      setError('Por favor ingresa un nombre');
      return;
    }
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setSearchedName(name);
    try {
      const results = await fetchAllCards(name);
      setCards(results);
      if (results.length === 0) {
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestionSelect(name) {
    setSearchTerm(name);
    setTimeout(() => handleSearch(name), 0);
  }

  // Marca o desmarca una carta como poseída físicamente
  function extractPrice(card) {
    const cm = card.cardmarket?.prices;
    if (cm?.averageSellPrice) return { label: 'Cardmarket', value: `€${cm.averageSellPrice.toFixed(2)}` };
    const tcp = card.tcgplayer?.prices;
    if (tcp) {
      const v = tcp.holofoil ?? tcp.normal ?? tcp.reverseHolofoil ?? Object.values(tcp)[0];
      if (v?.market) return { label: 'TCGPlayer', value: `$${v.market.toFixed(2)}` };
    }
    return null;
  }

  function toggleCard(card, pokemon) {
    setOwnedCards((prev) => {
      const next = { ...prev };
      if (next[card.id]) {
        delete next[card.id];
      } else {
        next[card.id] = {
          pokemonName: pokemon.name,
          pokemonId: pokemon.id,
          imageUrl: card.images.small,
          imageLarge: card.images.large ?? card.images.small,
          cardName: card.name ?? null,
          setName: card.set?.name ?? null,
          setNumber: card.number ?? null,
          rarity: card.rarity ?? null,
          artist: card.artist ?? null,
          price: extractPrice(card),
          wishlist: false,
        };
      }
      localStorage.setItem('binder_owned', JSON.stringify(next));
      setTimeout(() => syncToFirebase(next), 100);
      return next;
    });
  }

  async function syncToFirebase(cards) {
    try {
      const shareCode = await getShareCode();
      if (shareCode) {
        await saveOwnedCardsToFirebase(cards, shareCode);
      }
    } catch (error) {
      console.error('Error syncing to Firebase:', error);
    }
  }

  function toggleWishlist(cardId) {
    setOwnedCards((prev) => {
      const next = { ...prev, [cardId]: { ...prev[cardId], wishlist: !prev[cardId].wishlist } };
      localStorage.setItem('binder_owned', JSON.stringify(next));
      setTimeout(() => syncToFirebase(next), 100);
      return next;
    });
  }

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          title={sidebarExpanded ? 'Contraer menú' : 'Expandir menú'}
          aria-label="Toggle sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="sidebar-brand">
          <svg className="pokeball-icon" viewBox="0 0 60 60" aria-hidden="true">
            <circle cx="30" cy="30" r="27" fill="#1a1a1a"/>
            <path d="M 3,30 A 27,27 0 0 1 57,30 Z" fill="#cc2929"/>
            <circle cx="30" cy="30" r="27" fill="none" stroke="#000" strokeWidth="2.5"/>
            <rect x="2.5" y="27" width="55" height="6" fill="#000"/>
            <circle cx="30" cy="30" r="10" fill="#000"/>
            <circle cx="30" cy="30" r="6" fill="#fff"/>
            <circle cx="30" cy="30" r="3" fill="#aaa"/>
          </svg>
          <div>
            <h1 className="app-title">Pokémon TCG</h1>
            <p className="app-subtitle">Colección</p>
          </div>
        </div>
        <NavBar currentView={currentView} onViewChange={setCurrentView} onShareClick={() => setShareModalOpen(true)} />
      </aside>

      <main className="app-main">
        {currentView === 'search' && (
          <>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={handleSearch}
              loading={loading}
              suggestions={suggestions}
              onSuggestionSelect={handleSuggestionSelect}
            />
            {error && <p className="error-message">Error: {error}</p>}
            {loading && <p className="loading-message">Buscando cartas...</p>}
            {!loading && hasSearched && (
              <CardGrid cards={cards} searchedName={searchedName} onCardClick={setSelectedCard} />
            )}
          </>
        )}

        {currentView === 'binder' && (
          <BinderView
            ownedCards={ownedCards}
            onToggleCard={toggleCard}
            onToggleWishlist={toggleWishlist}
            onCardDetail={setSelectedCard}
          />
        )}
      </main>

      {selectedCard && (
        <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}

      <ShareCodeModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onLoadCards={(cards) => {
          setOwnedCards(cards);
          localStorage.setItem('binder_owned', JSON.stringify(cards));
        }}
      />
    </div>
  );
}

export default App;
