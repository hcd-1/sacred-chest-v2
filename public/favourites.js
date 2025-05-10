
document.addEventListener('DOMContentLoaded', function () {
  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
  themeToggle.addEventListener('click', function () {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // Dropdown toggle
  document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      const menu = this.nextElementSibling;
      const isHidden = menu.hasAttribute('hidden');
  
      console.log('Dropdown menu:', menu); // Debugging
      console.log('Is hidden before toggle:', isHidden); // Debugging
  
      // Close all other dropdowns
      document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m !== menu) {
          m.setAttribute('hidden', '');
          m.previousElementSibling.setAttribute('aria-expanded', 'false');
        }
      });
  
      // Toggle the current dropdown
      if (isHidden) {
        menu.removeAttribute('hidden');
        this.setAttribute('aria-expanded', 'true');
      } else {
        menu.setAttribute('hidden', '');
        this.setAttribute('aria-expanded', 'false');
      }
  
      console.log('Is hidden after toggle:', menu.hasAttribute('hidden')); // Debugging
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-container')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.setAttribute('hidden', '');
        menu.previousElementSibling.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Prevent clicks inside the dropdown from closing it
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  // Favourites management
  function getFavourites() {
    const favourites = localStorage.getItem('favourites');
    return favourites ? JSON.parse(favourites) : [];
  }

  function saveFavourites(favourites) {
    localStorage.setItem('favourites', JSON.stringify(favourites));
  }

  function isVerseFavourited(verseId) {
    const favourites = getFavourites();
    return favourites.some(fav => fav.id === verseId);
  }

  function removeFavourite(verseId) {
    const favourites = getFavourites();
    const updatedFavourites = favourites.filter(fav => fav.id !== verseId);
    saveFavourites(updatedFavourites);
  }

  // Sort favourites
  let currentSort = 'date-desc';

  function sortFavourites(favourites) {
    let sorted = [...favourites];
    console.log('Sorting with currentSort:', currentSort);
    console.log('Favourites before sorting:', sorted);

    if (currentSort === 'random') {
      // Simple random sort using sort with random comparison
      sorted.sort(() => Math.random() - 0.5);
    } else {
      sorted.sort((a, b) => {
        if (currentSort === 'date-desc') {
          const dateA = a.date ? new Date(a.date) : new Date(0);
          const dateB = b.date ? new Date(b.date) : new Date(0);
          return dateB - dateA;
        } else if (currentSort === 'date-asc') {
          const dateA = a.date ? new Date(a.date) : new Date(0);
          const dateB = b.date ? new Date(b.date) : new Date(0);
          return dateA - dateB;
        } else if (currentSort === 'verse-asc') {
          return (a.verse || '').localeCompare(b.verse || '');
        } else if (currentSort === 'verse-desc') {
          return (b.verse || '').localeCompare(a.verse || '');
        } else if (currentSort === 'text-asc') {
          return (a.text || '').localeCompare(b.text || '');
        } else if (currentSort === 'text-desc') {
          return (b.text || '').localeCompare(a.text || '');
        }
        return 0;
      });
    }

    console.log('Favourites after sorting:', sorted);
    return sorted;
  }

  // Update dropdown text
  function updateDropdownText() {
    const dropdownText = document.querySelector('.dropdown-text');
    const sortText = {
      'date-desc': 'Newest First',
      'date-asc': 'Oldest First',
      'verse-asc': 'Verse A-Z',
      'verse-desc': 'Verse Z-A',
      'text-asc': 'Text A-Z',
      'text-desc': 'Text Z-A',
      'random': 'Random'
    }[currentSort];
    dropdownText.textContent = `Sort: ${sortText}`;
  }

  // Render favourites list
  async function renderFavourites() {
    const favouritesList = document.getElementById('favourites-list');
    const noFavourites = document.querySelector('.no-favourites');
    const favourites = getFavourites();

    // Verify favourites against Supabase via Netlify function
    let validFavourites = favourites;
    const verseIds = favourites.map(fav => fav.id);
    if (verseIds.length > 0) {
      try {
        const response = await fetch('/.netlify/functions/verify-favourites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verseIds }),
        });
        const verses = await response.json();
        if (!response.ok) {
          console.error('Error verifying favourites:', verses.error);
        } else {
          validFavourites = favourites.filter(fav => {
            const verse = verses.find(v => v.id === fav.id);
            return verse;
          });
          if (validFavourites.length < favourites.length) {
            saveFavourites(validFavourites);
          }
        }
      } catch (error) {
        console.error('Error fetching verified favourites:', error);
      }
    }

    const sortedFavourites = sortFavourites(validFavourites);

    if (sortedFavourites.length === 0) {
      noFavourites.style.display = 'block';
      favouritesList.style.display = 'none';
      noFavourites.textContent = 'No favourited verses yet.';
      return;
    }

    noFavourites.style.display = 'none';
    favouritesList.style.display = 'flex';
    favouritesList.innerHTML = '';

    sortedFavourites.forEach(fav => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-header">
          <div class="verse-reference">${fav.verse}</div>
          <div class="verse-date">${new Date(fav.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="card-content">
          <blockquote class="verse-text">${fav.text}</blockquote>
        </div>
        <div class="card-footer">
          <button class="button outline-button" aria-label="Share verse">
            <span class="share-icon"></span>
            <span>Share</span>
          </button>
          <button class="icon-button favorited" data-verse-id="${fav.id}" aria-label="Unfavourite verse">
            <span class="heart-icon"></span>
          </button>
        </div>
      `;
      favouritesList.appendChild(card);
    });

    // Share button handlers
    document.querySelectorAll('.outline-button').forEach(button => {
      button.addEventListener('click', function () {
        const card = this.closest('.card');
        const verseText = card.querySelector('.verse-text').textContent.trim();
        if (!verseText) return;
        if (navigator.share) {
          navigator.share({
            title: 'Favourited Bible Verse',
            text: verseText,
            url: window.location.href
          }).catch(err => console.log('Error sharing:', err));
        } else {
          navigator.clipboard.writeText(verseText).then(() => {
            alert('Verse copied to clipboard!');
          }).catch(err => console.error('Could not copy text: ', err));
        }
      });
    });

    // Unfavourite button handlers
    document.querySelectorAll('.icon-button').forEach(button => {
      button.addEventListener('click', function () {
        const verseId = parseInt(this.dataset.verseId);
        if (confirm('Are you sure you want to remove this verse from your favourites?')) {
          removeFavourite(verseId);
          renderFavourites();
        }
      });
    });
  }

  // Dropdown menu handlers
  document.querySelectorAll('.dropdown-menu li').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const sort = item.dataset.sort;

      if (sort) {
        currentSort = sort;
        console.log('Selected sort:', currentSort);
      }

      updateDropdownText();
      renderFavourites();

      // Update aria-selected
      document.querySelectorAll('.dropdown-menu li').forEach(li => {
        li.setAttribute('aria-selected', 'false');
      });
      item.setAttribute('aria-selected', 'true');

      // Close dropdown
      const menu = item.closest('.dropdown-menu');
      menu.setAttribute('hidden', '');
      const toggle = menu.previousElementSibling;
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Initial render
  updateDropdownText();
  renderFavourites();
});