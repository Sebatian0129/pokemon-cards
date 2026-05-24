import { useState, useEffect, useRef, useCallback } from 'react';
import { capitalize } from '../../utils';
import PokemonSlot from './PokemonSlot';

const SLOTS = 9;

const EXCLUDED_FORM_PATTERNS = ['-gmax', '-totem', '-cap', '-cosplay', '-rock-star', '-belle', '-pop-star', '-phd', '-libre', '-starter'];
const REGIONAL_SUFFIXES = ['-alola', '-galar', '-hisui', '-paldea'];
const REGIONAL_SUFFIXES_BY_GEN = { 7: ['-alola'], 8: ['-galar', '-hisui'], 9: ['-paldea'] };
const REGIONAL_ADJECTIVES = { '-alola': 'Alolan', '-galar': 'Galarian', '-hisui': 'Hisuian', '-paldea': 'Paldean' };

function getIdFromUrl(url) {
  const parts = url.split('/').filter(Boolean);
  return parseInt(parts[parts.length - 1]);
}

function getPageSlots(pokemon, startIndex) {
  return Array.from({ length: SLOTS }, (_, i) => pokemon[startIndex + i] ?? null);
}

function isWantedForm(formName) {
  if (EXCLUDED_FORM_PATTERNS.some((p) => formName.includes(p))) return false;
  // Regional forms are excluded from the base gen — fetched separately for their own gen
  if (REGIONAL_SUFFIXES.some((s) => formName.endsWith(s))) return false;
  return true;
}

function getFormDisplayName(formName, baseName) {
  if (formName.includes('-mega-x')) return `Mega ${baseName} X`;
  if (formName.includes('-mega-y')) return `Mega ${baseName} Y`;
  if (formName.includes('-mega')) return `Mega ${baseName}`;
  if (formName.includes('-primal')) return `Primal ${baseName}`;
  const REGIONAL = { '-alola': 'Alolan', '-galar': 'Galarian', '-hisui': 'Hisuian', '-paldea': 'Paldean' };
  for (const [suffix, adj] of Object.entries(REGIONAL)) {
    if (formName.endsWith(suffix)) return `${adj} ${baseName}`;
  }
  return capitalize(formName);
}

function getFormSearchName(formName, baseName) {
  // Mega/Primal: TCG uses "M Charizard-EX" not "Charizard Mega X" — search base name
  if (formName.includes('-mega') || formName.includes('-primal')) return baseName;
  return getFormDisplayName(formName, baseName);
}

// Sparkle particle pool — generated once per mount
function generateSparkles(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 1.5,
    duration: 0.5 + Math.random() * 0.6,
    hue: Math.round(Math.random() * 360),
  }));
}

function CardZoomModal({ card, onClose }) {
  const isImported = card.cardId?.startsWith('imported-') || card.imageUrl?.startsWith('data:');
  const needsFetch = !isImported && !card.imageLarge;
  const isFoil = card.rarity === 'Special Illustration Rare' || card.rarity === 'Illustration Rare' || card.rarity === 'Hyper Rare';

  const [largeUrl, setLargeUrl] = useState(card.imageLarge ?? card.imageUrl);
  const [imgLoading, setImgLoading] = useState(needsFetch);
  const [price, setPrice] = useState(card.price ?? null);
  const [sparkles] = useState(() => isFoil ? generateSparkles(45) : []);
  const [sparkleActive, setSparkleActive] = useState(false);

  const cardRef = useRef(null);
  const imgRef  = useRef(null);
  const rafRef  = useRef(null);

  useEffect(() => {
    const missingPrice = !card.price && !isImported;
    if (!needsFetch && !missingPrice) return;
    fetch(`https://api.pokemontcg.io/v2/cards/${card.cardId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d?.data) return;
        if (needsFetch && d.data.images?.large) setLargeUrl(d.data.images.large);
        const cm = d.data.cardmarket?.prices;
        if (cm?.averageSellPrice) { setPrice({ label: 'Cardmarket', value: `€${cm.averageSellPrice.toFixed(2)}` }); return; }
        const tcp = d.data.tcgplayer?.prices;
        if (tcp) {
          const v = tcp.holofoil ?? tcp.normal ?? tcp.reverseHolofoil ?? Object.values(tcp)[0];
          if (v?.market) setPrice({ label: 'TCGPlayer', value: `$${v.market.toFixed(2)}` });
        }
      })
      .catch(() => {})
      .finally(() => setImgLoading(false));
  }, [card.cardId, needsFetch, isImported, card.price]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleMouseMove(e) {
    const el  = cardRef.current;
    const img = imgRef.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const x  = (e.clientX - rect.left) / rect.width;
      const y  = (e.clientY - rect.top)  / rect.height;
      const cx = x - 0.5;
      const cy = y - 0.5;

      // 3D tilt
      el.style.transform = `perspective(900px) rotateX(${-cy * 14}deg) rotateY(${cx * 14}deg) scale(1.03)`;

      // Glare
      el.style.setProperty('--gx', `${50 + cx * 60}%`);
      el.style.setProperty('--gy', `${50 + cy * 60}%`);
      el.style.setProperty('--glare-opacity', isFoil ? '0.22' : '0.1');

      // Parallax: image shifts opposite to tilt
      if (img) img.style.transform = `translate(${cx * -18}px, ${cy * -18}px) scale(1.06)`;
    });
    if (isFoil) setSparkleActive(true);
  }

  function handleMouseLeave() {
    const el  = cardRef.current;
    const img = imgRef.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    el.style.transform  = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    el.style.setProperty('--glare-opacity', '0');
    if (img) img.style.transform = 'translate(0px, 0px) scale(1)';
    setSparkleActive(false);
  }

  return (
    <div className="card-zoom-overlay" onClick={onClose}>
      <div className="card-zoom-modal" onClick={(e) => e.stopPropagation()}>
        <div
          className="card-zoom-image"
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {imgLoading
            ? <div className="card-zoom-loading">Cargando...</div>
            : <>
                <img
                  ref={imgRef}
                  src={largeUrl}
                  alt={card.cardName ?? card.pokemonName}
                  className="card-zoom-img-parallax"
                />
                <div className="card-zoom-glare" />
                {isFoil && sparkleActive && (
                  <div className="card-zoom-sparkles">
                    {sparkles.map((s) => (
                      <div
                        key={s.id}
                        className="card-sparkle"
                        style={{
                          left: `${s.x}%`,
                          top:  `${s.y}%`,
                          width:  `${s.size}px`,
                          height: `${s.size}px`,
                          animationDelay:    `${s.delay}s`,
                          animationDuration: `${s.duration}s`,
                          '--sparkle-hue': `${s.hue}deg`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
          }
        </div>
        <div className="card-zoom-info">
          <button className="card-zoom-close" onClick={onClose}>✕</button>
          <p className="card-zoom-name">{card.cardName ?? card.pokemonName}</p>
          <div className="card-zoom-rows">
            {card.setName   && <div className="card-zoom-row"><span>Set</span><span>{card.setName}</span></div>}
            {card.setNumber && <div className="card-zoom-row"><span>Número</span><span>#{card.setNumber}</span></div>}
            {card.rarity    && <div className="card-zoom-row"><span>Rareza</span><span>{card.rarity}</span></div>}
            {price
              ? <div className="card-zoom-row card-zoom-price"><span>{price.label}</span><span>{price.value}</span></div>
              : !isImported && <div className="card-zoom-row"><span>Valor</span><span className="card-zoom-no-price">—</span></div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function BookCover({ gen }) {
  return (
    <div className="book-cover" style={{ '--gen-color': gen.color }}>
      <div className="book-cover-spine-accent" />
      <div className="book-cover-content">
        <p className="book-cover-label">{gen.label}</p>
        <h2 className="book-cover-name">{gen.name}</h2>
        <p className="book-cover-sub">Binder de colección</p>
      </div>
    </div>
  );
}

function BookPage({ slots, ownedDataByPokemonId, genColor, onSelectPokemon, onImportImage, onRemoveCard, onToggleWishlist, onCardDetail }) {
  return (
    <div className="book-page-grid">
      {slots.map((pokemon, i) => {
        if (!pokemon) return <div key={`empty-${i}`} className="book-slot empty" />;
        const owned = ownedDataByPokemonId[pokemon.id];
        const cardImage = owned?.imageUrl ?? null;
        const isWishlist = owned?.wishlist ?? false;

        return (
          <div
            key={pokemon.id}
            className={`book-slot filled ${cardImage ? 'has-card' : ''} ${isWishlist ? 'wishlist' : ''}`}
            title={pokemon.name}
          >
            {cardImage ? (
              <>
                <img src={cardImage} alt={pokemon.name} className="book-slot-card-img" loading="lazy" />
                <span className="book-slot-dot" style={{ backgroundColor: genColor }} />
                <div className="book-slot-icon-overlay">
                  <button className="book-slot-icon-btn" title="Ver carta" onClick={() => onCardDetail(owned)}>
                    <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="#fff" strokeWidth="1.8">
                      <circle cx="6.5" cy="6.5" r="4"/>
                      <line x1="10" y1="10" x2="14" y2="14"/>
                    </svg>
                  </button>
                  <button
                    className={`book-slot-icon-btn ${isWishlist ? 'active-wishlist' : ''}`}
                    title={isWishlist ? 'Marcar como obtenida' : 'Marcar como deseada'}
                    onClick={() => onToggleWishlist(owned.cardId)}
                  >
                    {isWishlist ? (
                      <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="#aaa" strokeWidth="1.8">
                        <circle cx="8" cy="8" r="3"/>
                        <path d="M1 8C3 4 13 4 15 8C13 12 3 12 1 8Z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="#fff" strokeWidth="1.8">
                        <circle cx="8" cy="8" r="3"/>
                        <path d="M1 8C3 4 13 4 15 8C13 12 3 12 1 8Z"/>
                        <line x1="2" y1="2" x2="14" y2="14"/>
                      </svg>
                    )}
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
              </>
            ) : (
              <>
                <div className="book-slot-sprite-wrapper">
                  <img src={pokemon.sprite} alt={pokemon.name} className="book-slot-sprite" loading="lazy" />
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
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PokemonGrid({ gen, ownedCards, onSelectPokemon, onImportImage, onToggleCard, onToggleWishlist, onBack, spread, onSpreadChange }) {
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [animDir, setAnimDir] = useState('fwd');
  const [fromSpread, setFromSpread] = useState(spread);
  const toSpreadRef = useRef(spread);
  const [zoomedCard, setZoomedCard] = useState(null);
  const [isPortrait, setIsPortrait] = useState(() => window.matchMedia('(orientation: portrait)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const handleOrientationChange = (e) => {
      setIsPortrait(e.matches);
      // Sincronizar spread cuando cambia la orientación
      if (e.matches) {
        // Cambiar a portrait: convert landscape spread to portrait spread
        const newSpread = spread === 0 ? 0 : 1 + (spread * 2);
        if (newSpread !== spread) {
          onSpreadChange(newSpread);
        }
      } else {
        // Cambiar a landscape: convert portrait spread to landscape spread
        const newSpread = spread === 0 ? 0 : Math.floor((spread - 1) / 2);
        if (newSpread !== spread) {
          onSpreadChange(newSpread);
        }
      }
    };
    mediaQuery.addEventListener('change', handleOrientationChange);
    return () => mediaQuery.removeEventListener('change', handleOrientationChange);
  }, [spread, onSpreadChange]);

  useEffect(() => {
    setLoading(true);

    const cacheKey = `pkm_gen_${gen.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsedData = JSON.parse(cached);
        setPokemon(Array.isArray(parsedData) ? parsedData : []);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Error parsing cached pokemon data:', e);
        sessionStorage.removeItem(cacheKey);
      }
    }

    // Two parallel requests instead of N+2 sequential ones
    Promise.all([
      fetch(`https://pokeapi.co/api/v2/generation/${gen.id}`).then((r) => r.json()),
      fetch('https://pokeapi.co/api/v2/pokemon?limit=10000').then((r) => r.json()).catch(() => ({ results: [] })),
    ])
      .then(([genData, allPokemonData]) => {
        const baseList = genData.pokemon_species
          .map((p) => {
            const id = getIdFromUrl(p.url);
            return {
              id,
              apiName: p.name,
              name: capitalize(p.name),
              sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
            };
          })
          .sort((a, b) => a.id - b.id);

        const speciesApiNames = new Set(baseList.map((p) => p.apiName));
        const speciesByApiName = Object.fromEntries(baseList.map((p) => [p.apiName, p]));

        // Find the base species API name for a form (e.g. "charizard-mega-x" → "charizard")
        function getBaseApiName(formName) {
          const parts = formName.split('-');
          for (let len = parts.length - 1; len >= 1; len--) {
            const candidate = parts.slice(0, len).join('-');
            if (speciesApiNames.has(candidate)) return candidate;
          }
          return null;
        }

        const regionalSuffixes = REGIONAL_SUFFIXES_BY_GEN[gen.id] || [];
        const formsMap = {};
        const regionalForms = [];

        for (const entry of (allPokemonData.results || [])) {
          const formName = entry.name;
          if (speciesApiNames.has(formName)) continue; // skip base species

          const isRegional = REGIONAL_SUFFIXES.some((s) => formName.endsWith(s));

          if (isRegional) {
            // Only collect regional forms that belong to this generation
            const suffix = regionalSuffixes.find((s) => formName.endsWith(s));
            if (!suffix) continue;
            const id = getIdFromUrl(entry.url);
            const baseName = capitalize(formName.slice(0, -suffix.length));
            regionalForms.push({
              id,
              name: `${REGIONAL_ADJECTIVES[suffix]} ${baseName}`,
              searchName: `${REGIONAL_ADJECTIVES[suffix]} ${baseName}`,
              baseName,
              sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
            });
          } else {
            if (!isWantedForm(formName)) continue;
            const baseApiName = getBaseApiName(formName);
            if (!baseApiName) continue;
            const base = speciesByApiName[baseApiName];
            const id = getIdFromUrl(entry.url);
            if (!formsMap[baseApiName]) formsMap[baseApiName] = [];
            formsMap[baseApiName].push({
              id,
              name: getFormDisplayName(formName, base.name),
              searchName: getFormSearchName(formName, base.name),
              baseName: base.name,
              sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
            });
          }
        }

        const nativeAndForms = [];
        for (const base of baseList) {
          nativeAndForms.push(base);
          const forms = (formsMap[base.apiName] || []).sort((a, b) => a.id - b.id);
          nativeAndForms.push(...forms);
        }

        const finalList = [...nativeAndForms, ...regionalForms.sort((a, b) => a.id - b.id)];
        sessionStorage.setItem(cacheKey, JSON.stringify(finalList));
        setPokemon(finalList);
      })
      .finally(() => setLoading(false));
  }, [gen.id]);

  // Build a map pokemonId → full owned entry (including cardId) for slots
  const ownedDataByPokemonId = {};
  Object.entries(ownedCards).forEach(([cardId, data]) => {
    if (data.imageUrl && !ownedDataByPokemonId[data.pokemonId]) {
      ownedDataByPokemonId[data.pokemonId] = { ...data, cardId };
    }
  });

  function handleRemoveCard(cardId) {
    onToggleCard({ id: cardId }, { name: '', id: 0 });
  }

  function handleCardDetail(ownedEntry) {
    setZoomedCard(ownedEntry);
  }

  const ownedCount = pokemon.filter((p) => ownedDataByPokemonId[p.id]).length;

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (spread > 0 && !animating) navigate(spread - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (spread < totalSpreads - 1 && !animating) navigate(spread + 1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spread, animating, totalSpreads]);

  // En portrait: navegación página por página. En landscape: spreads (dos páginas)
  const totalSpreads = isPortrait
    ? (pokemon.length === 0 ? 1 : 1 + Math.ceil(pokemon.length / SLOTS))
    : (1 + Math.ceil(Math.max(0, pokemon.length - SLOTS) / (SLOTS * 2)));

  // Genera el contenido de la página izquierda para cualquier spread
  function getLeftContent(s) {
    if (s === 0) return <BookCover gen={gen} />;
    if (isPortrait) {
      const start = (s - 1) * SLOTS;
      const slots = getPageSlots(pokemon, start);
      return <BookPage key={`page-left-${s}`} slots={slots} ownedDataByPokemonId={ownedDataByPokemonId} genColor={gen.color} onSelectPokemon={onSelectPokemon} onImportImage={onImportImage} onRemoveCard={handleRemoveCard} onToggleWishlist={onToggleWishlist} onCardDetail={handleCardDetail} />;
    }
    const start = SLOTS + (s - 1) * SLOTS * 2;
    const slots = getPageSlots(pokemon, start);
    return <BookPage key={`page-left-${s}`} slots={slots} ownedDataByPokemonId={ownedDataByPokemonId} genColor={gen.color} onSelectPokemon={onSelectPokemon} onImportImage={onImportImage} onRemoveCard={handleRemoveCard} onToggleWishlist={onToggleWishlist} onCardDetail={handleCardDetail} />;
  }

  // Genera el contenido de la página derecha para cualquier spread
  function getRightContent(s) {
    if (isPortrait) return null;
    const start = s === 0 ? 0 : SLOTS + (s - 1) * SLOTS * 2 + SLOTS;
    return <BookPage slots={getPageSlots(pokemon, start)} ownedDataByPokemonId={ownedDataByPokemonId} genColor={gen.color} onSelectPokemon={onSelectPokemon} onImportImage={onImportImage} onRemoveCard={handleRemoveCard} onToggleWishlist={onToggleWishlist} onCardDetail={handleCardDetail} />;
  }

  function navigate(target) {
    if (animating || target < 0 || target >= totalSpreads) return;
    setFromSpread(spread);
    toSpreadRef.current = target;
    setAnimDir(target > spread ? 'fwd' : 'back');

    if (isPortrait) {
      onSpreadChange(target);
    } else {
      setAnimating(true);
    }
  }

  function handleAnimationEnd(e) {
    if (e.target !== e.currentTarget) return;
    onSpreadChange(toSpreadRef.current);
    setAnimating(false);
  }

  // Texto de rango de página
  const isCover = spread === 0;
  const leftStart = SLOTS + (spread - 1) * SLOTS * 2;
  const rightStart = isCover ? 0 : leftStart + SLOTS;

  function pageRangeText() {
    if (isCover) return `Portada · Pokémon 1–${Math.min(SLOTS, pokemon.length)}`;
    const from = leftStart + 1;
    const to = Math.min(rightStart + SLOTS, pokemon.length);
    return `Pokémon ${from}–${to} de ${pokemon.length}`;
  }

  return (
    <div className="book-view">
      <div className="binder-header">
        <button className="back-btn" onClick={onBack}>← Volver</button>
        <div>
          <h2>{gen.name} <span className="gen-label-small">{gen.label}</span></h2>
          <p className="binder-progress-text">
            {loading ? 'Cargando...' : `${ownedCount} / ${pokemon.length} Pokémon con cartas registradas`}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="loading-message">Cargando Pokémon...</p>
      ) : (
        <>
          <div className="book-desk">
            <div className="book-scene">
              <button
                className="book-arrow book-arrow-left"
                onClick={() => navigate(spread - 1)}
                disabled={spread === 0 || animating}
                aria-label="Página anterior"
                title="Página anterior"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              <div className="book-wrapper">
                <div className={`book-container${animating ? ' book-animating' : ''}`}>

                  {/* Página izquierda estática */}
                  <div className="book-page book-page-left">
                    {animating
                      ? (animDir === 'fwd'
                          ? getLeftContent(fromSpread)        // vieja izquierda se queda
                          : getLeftContent(toSpreadRef.current)) // nueva izquierda ya visible
                      : getLeftContent(spread)
                    }
                  </div>

                  <div className="book-spine" />

                  {/* Página derecha estática */}
                  <div className="book-page book-page-right">
                    {animating
                      ? (animDir === 'fwd'
                          ? getRightContent(toSpreadRef.current) // nueva derecha ya visible
                          : getRightContent(fromSpread))         // vieja derecha se queda
                      : getRightContent(spread)
                    }
                  </div>

                  {/* Página fantasma que anima (absolutamente posicionada sobre el libro) */}
                  {animating && (
                    <div
                      className={`book-flip book-flip-${animDir}`}
                      onAnimationEnd={handleAnimationEnd}
                    >
                      {/* Cara frontal: contenido viejo */}
                      <div className="book-flip-front">
                        <div className="book-page-inner">
                          {animDir === 'fwd'
                            ? getRightContent(fromSpread)
                            : getLeftContent(fromSpread)}
                        </div>
                        <div className="book-flip-shade" />
                      </div>

                      {/* Cara trasera: contenido nuevo (pre-rotada, aparece al completar el giro) */}
                      <div className="book-flip-rear">
                        <div className="book-page-inner">
                          {animDir === 'fwd'
                            ? getLeftContent(toSpreadRef.current)
                            : getRightContent(toSpreadRef.current)}
                        </div>
                        <div className="book-flip-shade book-flip-shade-rear" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                className="book-arrow book-arrow-right"
                onClick={() => navigate(spread + 1)}
                disabled={spread >= totalSpreads - 1 || animating}
                aria-label="Página siguiente"
                title="Página siguiente"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
            <div className="book-page-indicator">
              Página {spread + 1} de {totalSpreads}
            </div>
          </div>

        </>
      )}

      {zoomedCard && (
        <CardZoomModal card={zoomedCard} onClose={() => setZoomedCard(null)} />
      )}
    </div>
  );
}

export default PokemonGrid;
