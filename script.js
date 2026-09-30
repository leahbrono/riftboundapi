const searchForm = document.querySelector('#searchForm');
const searchInput = document.querySelector('#searchInput');
const typeFilter = document.querySelector('#typeFilter');
const rarityFilter = document.querySelector('#rarityFilter');
const signatureFilter = document.querySelector('#signatureFilter');
const altArtFilter = document.querySelector('#altArtFilter');
const resultsGrid = document.querySelector('#resultsGrid');
const statusMessage = document.querySelector('#statusMessage');

let fetchedCards = [];

// Handle search form submit
searchForm.addEventListener('submit', event => {
  event.preventDefault();

  const query = searchInput.value.trim();
  
  // Decide endpoint: search by name if input exists, otherwise pull base endpoint
  const baseURL = query 
    ? 'https://api.riftcodex.com/cards/name' 
    : 'https://api.riftcodex.com/cards';

  const url = new URL(baseURL);
  if (query) {
    url.searchParams.set('fuzzy', query);
  }

  statusMessage.textContent = 'Fetching cards...';
  resultsGrid.innerHTML = '';

  fetch(url.href)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Normalize response shapes
      if (Array.isArray(data)) {
        fetchedCards = data;
      } else if (data && typeof data === 'object') {
        fetchedCards = data.cards || data.items || [data];
      } else {
        fetchedCards = [];
      }

      applyFiltersAndDisplay();
    })
    .catch(error => {
      console.error('Fetch error:', error);
      statusMessage.textContent = 'Error loading cards. Please check console.';
    });
});

// Trigger client-side filtering whenever a dropdown or checkbox changes
[typeFilter, rarityFilter, signatureFilter, altArtFilter].forEach(element => {
  element.addEventListener('change', applyFiltersAndDisplay);
});

function applyFiltersAndDisplay() {
  const selectedType = typeFilter.value.toLowerCase();
  const selectedRarity = rarityFilter.value.toLowerCase();
  const mustBeSignature = signatureFilter.checked;
  const mustBeAltArt = altArtFilter.checked;

  // Filter local results based on current controls
  const filteredCards = fetchedCards.filter(card => {
    // 1. Type Filter
    const cardType = (card.classification?.type || '').toLowerCase();
    if (selectedType && cardType !== selectedType) return false;

    // 2. Rarity Filter
    const cardRarity = (card.classification?.rarity || '').toLowerCase();
    if (selectedRarity && cardRarity !== selectedRarity) return false;

    // 3. Signature Filter
    const isSignature = Boolean(card.metadata?.signature);
    if (mustBeSignature && !isSignature) return false;

    // 4. Alternate Art Filter
    const isAltArt = Boolean(card.metadata?.alternate_art);
    if (mustBeAltArt && !isAltArt) return false;

    return true;
  });

  renderImages(filteredCards);
}

function renderImages(cards) {
  resultsGrid.innerHTML = '';

  if (!cards || cards.length === 0) {
    statusMessage.textContent = 'No cards match the selected criteria.';
    return;
  }

  statusMessage.textContent = `Showing ${cards.length} card(s)`;

  cards.forEach(card => {
    const cardWrapper = document.createElement('div');
    cardWrapper.classList.add('card-image-wrapper');

    const imageUrl = card.media?.image_url || '';
    const cardName = card.name || 'Card Image';

    if (imageUrl) {
      cardWrapper.innerHTML = `<img src="${imageUrl}" alt="${cardName}" loading="lazy" title="${cardName}">`;
    } else {
      cardWrapper.innerHTML = `<div class="no-image">No Image</div>`;
    }

    resultsGrid.appendChild(cardWrapper);
  });
}