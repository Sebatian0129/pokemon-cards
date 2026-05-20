import { useEffect } from 'react';

const TYPE_COLORS = {
  fire:       '#ef4444',
  water:      '#3b82f6',
  grass:      '#22c55e',
  lightning:  '#eab308',
  psychic:    '#a855f7',
  fighting:   '#f97316',
  darkness:   '#6b7280',
  metal:      '#94a3b8',
  dragon:     '#6366f1',
  fairy:      '#ec4899',
  colorless:  '#d1d5db',
};

function getPriceInfo(card) {
  const cm = card.cardmarket?.prices;
  if (cm?.averageSellPrice) {
    return { label: 'Cardmarket (media)', value: `€${cm.averageSellPrice.toFixed(2)}` };
  }
  const tcp = card.tcgplayer?.prices;
  if (tcp) {
    const variant = tcp.holofoil ?? tcp.normal ?? tcp.reverseHolofoil ?? Object.values(tcp)[0];
    if (variant?.market) {
      return { label: 'TCGPlayer (market)', value: `$${variant.market.toFixed(2)}` };
    }
  }
  return null;
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function CardModal({ card, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const price = getPriceInfo(card);
  const category = [card.supertype, ...(card.subtypes ?? [])].join(' · ');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="modal-body">
          <div className="modal-image">
            {card.images.large ? (
              <img src={card.images.large} alt={card.name} />
            ) : (
              <div className="modal-no-image"><span>{card.name}</span></div>
            )}
          </div>

          <div className="modal-details">
            <h2 className="modal-card-name">{card.name}</h2>

            {card.types && (
              <div className="modal-types">
                {card.types.map((type) => (
                  <span
                    key={type}
                    className="type-badge"
                    style={{ backgroundColor: TYPE_COLORS[type.toLowerCase()] ?? '#6b7280' }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}

            <div className="detail-section">
              <DetailRow label="Categoría"  value={category} />
              <DetailRow label="Colección"  value={card.set.name} />
              <DetailRow label="Serie"      value={card.set.series} />
              <DetailRow label="Número"     value={`${card.number} / ${card.set.total}`} />
              {card.rarity  && <DetailRow label="Rareza"     value={card.rarity} />}
              {card.artist  && <DetailRow label="Ilustrador" value={card.artist} />}
              {price        && <DetailRow label={price.label} value={price.value} />}
            </div>

            {card.set.images?.logo && (
              <img
                src={card.set.images.logo}
                alt={card.set.name}
                className="modal-set-logo"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardModal;
