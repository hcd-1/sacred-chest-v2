
    document.addEventListener('DOMContentLoaded', function () {
      let currentDisplayDate = new Date();
      let versesForDay = [];
      let maxTracks = 1;
      let currentVerseSpecial = null;
      let currentCalendarDate = new Date();
      const calendarContainer = document.getElementById('calendar-container');

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

      // Calendar setup
      const calendarGrid = document.querySelector('.calendar-grid');
      const calendarTitle = document.getElementById('calendar-title');

      // Dynamic margin for main-grid to prevent overlap
      function updateMainGridMargin() {
        const mainGrid = document.querySelector('.main-grid');
        const calendarContainer = document.getElementById('calendar-container');
        if (calendarContainer.classList.contains('open')) {
          const calendarRect = calendarContainer.getBoundingClientRect();
          const headerRect = document.querySelector('header').getBoundingClientRect();
          const spacing = window.innerWidth <= 640 ? 4 : 8;
          const margin = calendarRect.height + (calendarRect.top - headerRect.bottom) + spacing;
          mainGrid.style.marginTop = `${margin}px`;
        } else {
          mainGrid.style.marginTop = '0rem';
        }
      }

      function updateDateDisplay() {
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const monthDayOptions = { month: 'long', day: 'numeric' };
        const dayOfWeekOptions = { weekday: 'long' };
        const currentDateEl = document.getElementById('current-date');
        const oddEvenLabelEl = document.getElementById('odd-even-label');
        const dayOfWeekLabelEl = document.getElementById('day-of-week-label');
        const dayLabelEl = document.getElementById('day-label');
        const dailyLabelEl = document.getElementById('daily-label');

        if (currentDateEl) currentDateEl.textContent = currentDisplayDate.toLocaleDateString('en-US', dateOptions);
        if (oddEvenLabelEl) oddEvenLabelEl.textContent = currentDisplayDate.getDate() % 2 === 0 ? 'Even' : 'Odd';
        if (dayOfWeekLabelEl) dayOfWeekLabelEl.textContent = currentDisplayDate.toLocaleDateString('en-US', dayOfWeekOptions);
        if (dayLabelEl) dayLabelEl.textContent = currentDisplayDate.toLocaleDateString('en-US', monthDayOptions);
        if (dailyLabelEl) dailyLabelEl.textContent = 'Daily';
      }

      async function fetchVerseCounts(year, month) {
        try {
          const response = await fetch('/.netlify/functions/fetch-verse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetchVerseCounts', year, month }),
          });
          const data = await response.json();
          if (!response.ok) {
            console.warn('No verse data found:', data.error);
            return {};
          }
          return data;
        } catch (err) {
          console.error('Error fetching verse counts:', err);
          return {};
        }
      }

      async function renderCalendar() {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        if (calendarTitle) {
          calendarTitle.textContent = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });
        }

        while (calendarGrid.children.length > 7) {
          calendarGrid.removeChild(calendarGrid.lastChild);
        }

        const verseCounts = await fetchVerseCounts(year, month);
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        for (let i = 0; i < startDay; i++) {
          const emptyCell = document.createElement('div');
          emptyCell.className = 'calendar-day disabled';
          calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day++) {
          const dayCell = document.createElement('div');
          dayCell.className = 'calendar-day';
          dayCell.setAttribute('role', 'gridcell');
          dayCell.setAttribute('aria-label', `${new Date(year, month, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
          dayCell.tabIndex = 0;

          if (isCurrentMonth && day === today.getDate()) {
            dayCell.classList.add('today');
            dayCell.setAttribute('aria-label', `Today, ${dayCell.getAttribute('aria-label')}`);
          }

          if (currentDisplayDate.getFullYear() === year && currentDisplayDate.getMonth() === month && currentDisplayDate.getDate() === day) {
            dayCell.classList.add('selected');
            dayCell.setAttribute('aria-selected', 'true');
          }

          const dayNumber = document.createElement('span');
          dayNumber.textContent = day;
          dayCell.appendChild(dayNumber);

          const verseCount = verseCounts[day.toString()] || 0;
          if (verseCount > 0) {
            const indicators = document.createElement('div');
            indicators.className = 'verse-indicators';
            const dots = Math.min(verseCount, 3);
            for (let i = 0; i < dots; i++) {
              const dot = document.createElement('span');
              dot.className = 'verse-dot';
              indicators.appendChild(dot);
            }
            dayCell.appendChild(indicators);
          }

          dayCell.addEventListener('click', () => {
            currentDisplayDate = new Date(year, month, day);
            document.querySelectorAll('.calendar-day').forEach(cell => cell.classList.remove('selected'));
            dayCell.classList.add('selected');
            updateAllContent();
          });

          dayCell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              dayCell.click();
            }
          });

          calendarGrid.appendChild(dayCell);
        }
      }

      document.getElementById('open-calendar').addEventListener('click', (e) => {
        e.stopPropagation();
        const calendarContainer = document.getElementById('calendar-container');
        const mainGrid = document.querySelector('.main-grid');
        calendarContainer.classList.toggle('open');

        if (calendarContainer.classList.contains('open')) {
          mainGrid.style.marginTop = '350px';
          document.documentElement.classList.add('calendar-open');
          currentCalendarDate = new Date(currentDisplayDate);
          renderCalendar().then(() => {
            updateMainGridMargin();
          });
        } else {
          mainGrid.style.marginTop = '0rem';
          document.documentElement.classList.remove('calendar-open');
        }
      });

      document.getElementById('calendar-close').addEventListener('click', (e) => {
        e.stopPropagation();
        calendarContainer.classList.remove('open');
        document.documentElement.classList.remove('calendar-open');
        updateMainGridMargin();
      });

      document.addEventListener('click', (e) => {
        if (!calendarContainer.contains(e.target) && e.target !== document.getElementById('open-calendar')) {
          calendarContainer.classList.remove('open');
          document.documentElement.classList.remove('calendar-open');
          updateMainGridMargin();
        }
      });

      calendarContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      document.getElementById('prev-month').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar().then(() => {
          updateMainGridMargin();
        });
      });

      document.getElementById('next-month').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar().then(() => {
          updateMainGridMargin();
        });
      });

      document.getElementById('today-button').addEventListener('click', () => {
        currentCalendarDate = new Date();
        currentDisplayDate = new Date();
        renderCalendar().then(() => {
          updateMainGridMargin();
        });
        updateAllContent();
      });

      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateMainGridMargin, 100);
      });

      // Hamburger menu toggle
      const hamburgerToggle = document.getElementById('hamburger-toggle');
      const hamburgerMenu = document.getElementById('hamburger-menu');
      if (hamburgerToggle && hamburgerMenu) {
        hamburgerToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = hamburgerMenu.getAttribute('aria-hidden') === 'false';
          hamburgerMenu.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
          hamburgerToggle.setAttribute('aria-expanded', !isOpen);
          hamburgerMenu.toggleAttribute('hidden', isOpen);
        });

        document.addEventListener('click', (e) => {
          if (!hamburgerMenu.contains(e.target) && e.target !== hamburgerToggle) {
            hamburgerMenu.setAttribute('aria-hidden', 'true');
            hamburgerToggle.setAttribute('aria-expanded', 'false');
            hamburgerMenu.setAttribute('hidden', '');
          }
        });

        hamburgerMenu.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        window.addEventListener('resize', () => {
          if (window.innerWidth > 640) {
            hamburgerMenu.setAttribute('aria-hidden', 'true');
            hamburgerToggle.setAttribute('aria-expanded', 'false');
            hamburgerMenu.setAttribute('hidden', '');
          }
        });
      }

      // Dropdown toggle
      document.addEventListener('click', (e) => {
        const toggle = e.target.closest('.dropdown-toggle');
        if (toggle) {
          console.log('Dropdown toggle clicked:', toggle);
          e.stopPropagation();
          const menu = toggle.nextElementSibling;
          if (menu && menu.classList.contains('dropdown-menu')) {
            const isOpen = !menu.hasAttribute('hidden');
            menu.toggleAttribute('hidden', isOpen);
            toggle.setAttribute('aria-expanded', !isOpen);
            console.log('Menu toggled, hidden:', menu.hasAttribute('hidden'));
          } else {
            console.warn('Dropdown menu not found for toggle:', toggle);
          }
        } else {
          document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.setAttribute('hidden', '');
            console.log('Closed dropdown menu:', menu);
          });
          document.querySelectorAll('.dropdown-toggle').forEach(tog => {
            tog.setAttribute('aria-expanded', 'false');
          });
        }
      });

      // Specific handlers for dropdown toggles
      document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
          e.stopPropagation();
          const menu = this.nextElementSibling;
          const isHidden = menu.hasAttribute('hidden');
          
          document.querySelectorAll('.dropdown-menu').forEach(m => {
            if (m !== menu) m.setAttribute('hidden', '');
          });
          document.querySelectorAll('.dropdown-toggle').forEach(t => {
            if (t !== this) t.setAttribute('aria-expanded', 'false');
          });
          
          menu.toggleAttribute('hidden', !isHidden);
          this.setAttribute('aria-expanded', isHidden);
          
          console.log('Dropdown clicked:', isHidden ? 'opening' : 'closing', menu);
        });
      });

      // Render track dropdown
      function renderTrackDropdown() {
        const dropdownMenus = document.querySelectorAll('.track-dropdown .dropdown-menu');
        if (!dropdownMenus.length) {
          console.warn('No dropdown menus found');
          return;
        }
        const selectedTrack = parseInt(localStorage.getItem('track') || '1');

        dropdownMenus.forEach(dropdownMenu => {
          dropdownMenu.innerHTML = '';
          for (let i = 1; i <= maxTracks; i++) {
            const li = document.createElement('li');
            li.textContent = `Track ${i}`;
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', i === selectedTrack ? 'true' : 'false');
            li.addEventListener('click', (e) => {
              e.stopPropagation();
              console.log('Track selected:', i);
              localStorage.setItem('track', i);
              dropdownMenus.forEach(menu => {
                menu.querySelectorAll('li').forEach(item => {
                  item.setAttribute('aria-selected', item === li ? 'true' : 'false');
                });
              });
              const toggles = document.querySelectorAll('.dropdown-toggle .dropdown-text');
              toggles.forEach(toggle => {
                if (toggle) toggle.textContent = `Track ${i}`;
              });
              dropdownMenus.forEach(menu => menu.setAttribute('hidden', ''));
              const toggleButtons = document.querySelectorAll('.dropdown-toggle');
              toggleButtons.forEach(tog => tog.setAttribute('aria-expanded', 'false'));
              loadDayOfMonthVerse();
            });
            dropdownMenu.appendChild(li);
          }
        });

        const toggles = document.querySelectorAll('.dropdown-toggle .dropdown-text');
        toggles.forEach(toggle => {
          if (toggle) toggle.textContent = `Track ${selectedTrack}`;
        });
        console.log('Track dropdown rendered with', maxTracks, 'tracks');
      }

      async function fetchMaxTracks() {
        try {
          const response = await fetch('/.netlify/functions/fetch-verse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetchMaxTracks' }),
          });
          const data = await response.json();
          if (!response.ok) {
            console.warn('No valid special values found; defaulting to 1');
            return 1;
          }
          return data.maxTracks;
        } catch (err) {
          console.error('Error fetching max special:', err);
          return 1;
        }
      }

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

      function updateFavoriteState(button, verseId) {
        if (!button) return;
        button.classList.toggle('favorited', isVerseFavourited(verseId));
      }

      function toggleFavourite(cardType, date, verseData) {
        const favourites = getFavourites();
        const verseId = verseData.id;
        const isFavourited = isVerseFavourited(verseId);

        if (isFavourited) {
          const updatedFavourites = favourites.filter(fav => fav.id !== verseId);
          saveFavourites(updatedFavourites);
        } else {
          const favouriteEntry = {
            id: verseData.id,
            verse: verseData.verse,
            text: verseData.text,
            special: verseData.special,
            day_month: verseData.day_month,
            cardType: cardType,
            date: date.toISOString().split('T')[0]
          };
          favourites.push(favouriteEntry);
          saveFavourites(favourites);
        }

        const button = document.querySelector(`[data-card="${cardType}"]`);
        updateFavoriteState(button, verseId);
      }

      function updateAllFavoriteStates(dailyVerse, oddEvenVerse, dayOfWeekVerse, dayMonthVerse) {
        updateFavoriteState(document.querySelector('[data-card="daily"]'), dailyVerse?.id);
        updateFavoriteState(document.querySelector('[data-card="odd-even"]'), oddEvenVerse?.id);
        updateFavoriteState(document.querySelector('[data-card="day-of-week"]'), dayOfWeekVerse?.id);
        updateFavoriteState(document.querySelector('[data-card="day-month"]'), dayMonthVerse?.id);
      }

      // Verse loading functions
      async function loadDailyVerse() {
        const content = document.getElementById('daily-verse-content');
        const reference = document.getElementById('daily-verse-reference');
        const spinner = document.getElementById('daily-spinner');

        if (!content || !reference || !spinner) {
          console.error('Daily verse elements not found');
          return null;
        }

        spinner.style.display = 'block';
        content.style.display = 'none';

        try {
          const response = await fetch('/.netlify/functions/fetch-verse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'loadDailyVerse' }),
          });
          const data = await response.json();
          spinner.style.display = 'none';
          content.style.display = 'block';

          if (!response.ok) {
            content.textContent = 'No daily verse available.';
            reference.textContent = 'N/A';
            return null;
          }

          reference.textContent = data.verse;
          content.innerHTML = `${data.text}`;
          return data;
        } catch (err) {
          spinner.style.display = 'none';
          content.style.display = 'block';
          content.textContent = 'Error loading daily verse.';
          reference.textContent = 'Error';
          console.error('Error in loadDailyVerse:', err);
          return null;
        }
      }

      async function loadOddEvenVerse() {
        const content = document.getElementById('odd-even-verse-content');
        const reference = document.getElementById('odd-even-verse-reference');
        const spinner = document.getElementById('odd-even-spinner');

        if (!content || !reference || !spinner) {
          console.error('Odd/even verse elements not found');
          return null;
        }

        spinner.style.display = 'block';
        content.style.display = 'none';

        try {
          const response = await fetch('/.netlify/functions/fetch-verse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'loadOddEvenVerse',
              day: currentDisplayDate.getDate().toString(),
            }),
          });
          const data = await response.json();
          spinner.style.display = 'none';
          content.style.display = 'block';

          if (!response.ok) {
            const specialValue = currentDisplayDate.getDate() % 2 === 0 ? 'even' : 'odd';
            content.textContent = `No ${specialValue} verse available.`;
            reference.textContent = 'N/A';
            return null;
          }

          reference.textContent = data.verse;
          content.innerHTML = `${data.text}`;
          return data;
        } catch (err) {
          spinner.style.display = 'none';
          content.style.display = 'block';
          content.textContent = 'Error loading odd/even verse.';
          reference.textContent = 'Error';
          console.error('Error in loadOddEvenVerse:', err);
          return null;
        }
      }

      async function loadDayOfWeekVerse() {
        const content = document.getElementById('day-of-week-verse-content');
        const reference = document.getElementById('day-of-week-verse-reference');
        const spinner = document.getElementById('day-of-week-spinner');

        if (!content || !reference || !spinner) {
          console.error('Day-of-week verse elements not found');
          return null;
        }

        spinner.style.display = 'block';
        content.style.display = 'none';

        try {
          const response = await fetch('/.netlify/functions/fetch-verse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'loadDayOfWeekVerse',
              year: currentDisplayDate.getFullYear(),
              month: currentDisplayDate.getMonth(),
              day: currentDisplayDate.getDate(),
            }),
          });
          const data = await response.json();
          spinner.style.display = 'none';
          content.style.display = 'block';

          if (!response.ok) {
            const dayOfWeekMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
            const specialValue = dayOfWeekMap[currentDisplayDate.getDay()];
            content.textContent = `No ${specialValue} verse available.`;
            reference.textContent = 'N/A';
            return null;
          }

          reference.textContent = data.verse;
          content.innerHTML = `${data.text}`;
          return data;
        } catch (err) {
          spinner.style.display = 'none';
          content.style.display = 'block';
          content.textContent = 'Error loading day-of-week verse.';
          reference.textContent = 'Error';
          console.error('Error in loadDayOfWeekVerse:', err);
          return null;
        }
      }

      async function loadDayOfMonthVerse() {
        const content = document.getElementById('verse-content');
        const reference = document.getElementById('verse-reference');
        const spinner = document.getElementById('verse-spinner');
        const toggleButtons = document.getElementById('verse-toggle-buttons');
        const fallbackMessage = document.getElementById('track-fallback-message');

        if (!content || !reference || !spinner || !toggleButtons || !fallbackMessage) {
          console.error('Day-of-month verse elements not found');
          return null;
        }

        spinner.style.display = 'block';
        content.style.display = 'none';
        toggleButtons.innerHTML = '';
        fallbackMessage.hidden = true;

        try {
          const response = await fetch('/.netlify/functions/fetch-verse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'loadDayOfMonthVerse',
              day: currentDisplayDate.getDate().toString(),
            }),
          });
          const data = await response.json();
          spinner.style.display = 'none';
          content.style.display = 'block';

          if (!response.ok) {
            content.textContent = 'No verses available for this day.';
            reference.textContent = 'N/A';
            versesForDay = [];
            fallbackMessage.textContent = 'No verses available for this day.';
            fallbackMessage.hidden = false;
            updateFavoriteState(
              document.querySelector('[data-card="day-month"]'),
              null
            );
            return null;
          }

          versesForDay = data.sort((a, b) => parseInt(a.special) - parseInt(b.special));
          const selectedTrack = parseInt(localStorage.getItem('track') || '1');
          const verse = updateDayOfMonthVerse(selectedTrack, true);
          renderVerseToggleButtons();
          return verse;
        } catch (err) {
          spinner.style.display = 'none';
          content.style.display = 'block';
          content.textContent = 'Error loading verse.';
          reference.textContent = 'Error';
          versesForDay = [];
          fallbackMessage.textContent = 'Error loading verses.';
          fallbackMessage.hidden = false;
          console.error('Error in loadDayOfMonthVerse:', err);
          return null;
        }
      }

      function renderVerseToggleButtons() {
        const toggleButtons = document.getElementById('verse-toggle-buttons');
        if (!toggleButtons) return;
        toggleButtons.innerHTML = '';

        versesForDay.forEach((verse, index) => {
          const trackNum = parseInt(verse.special);
          const button = document.createElement('button');
          button.className = 'button primary-button';
          button.textContent = `Verse ${trackNum}`;
          button.setAttribute('aria-label', `Show verse ${trackNum} for ${currentDisplayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`);
          button.addEventListener('click', () => {
            updateDayOfMonthVerse(trackNum, false);
            toggleButtons.querySelectorAll('.button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            document.getElementById('track-fallback-message').hidden = true;
          });
          if (parseInt(verse.special) === parseInt(currentVerseSpecial)) {
            button.classList.add('active');
          }
          toggleButtons.appendChild(button);
        });
      }

      function updateDayOfMonthVerse(selectedTrack, isInitialLoad) {
        const content = document.getElementById('verse-content');
        const reference = document.getElementById('verse-reference');
        const fallbackMessage = document.getElementById('track-fallback-message');

        if (!content || !reference || !fallbackMessage) {
          console.error('Day-of-month verse update elements not found');
          return null;
        }

        if (versesForDay.length === 0) {
          content.textContent = 'No verses available for this day.';
          reference.textContent = 'N/A';
          fallbackMessage.textContent = 'No verses available for this day.';
          fallbackMessage.hidden = false;
          currentVerseSpecial = null;
          updateFavoriteState(
            document.querySelector('[data-card="day-month"]'),
            null
          );
          return null;
        }

        let verse;
        let effectiveTrack = selectedTrack;
        const verseExists = versesForDay.some(v => parseInt(v.special) === selectedTrack);

        if (!verseExists && isInitialLoad) {
          effectiveTrack = 1;
          verse = versesForDay[0];
          fallbackMessage.textContent = `Track ${selectedTrack} unavailable for this day (${versesForDay.length} verse${versesForDay.length > 1 ? 's' : ''} total). Displaying Verse 1. Use buttons to browse.`;
          fallbackMessage.hidden = false;
        } else {
          verse = versesForDay.find(v => parseInt(v.special) === selectedTrack) || versesForDay[0];
          effectiveTrack = parseInt(verse.special);
          fallbackMessage.hidden = true;
        }

        reference.textContent = verse.verse;
        content.innerHTML = `${verse.text}`;
        currentVerseSpecial = verse.special;

        const toggleButtons = document.getElementById('verse-toggle-buttons');
        if (toggleButtons) {
          toggleButtons.querySelectorAll('.button').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.textContent.replace('Verse ', '')) === effectiveTrack);
          });
        }

        updateFavoriteState(
          document.querySelector('[data-card="day-month"]'),
          verse.id
        );

        return verse;
      }

      async function updateAllContent() {
        maxTracks = await fetchMaxTracks();
        renderTrackDropdown();
        updateDateDisplay();
        const [dailyVerse, oddEvenVerse, dayOfWeekVerse, dayMonthVerse] = await Promise.all([
          loadDailyVerse(),
          loadOddEvenVerse(),
          loadDayOfWeekVerse(),
          loadDayOfMonthVerse()
        ]);
        updateAllFavoriteStates(dailyVerse, oddEvenVerse, dayOfWeekVerse, dayMonthVerse);
      }

      // Favouriting logic
      document.querySelectorAll('.icon-button').forEach(button => {
        const cardType = button.dataset.card;
        button.addEventListener('click', async function () {
          let verseData;
          const date = currentDisplayDate;
          const selectedTrack = parseInt(localStorage.getItem('track') || '1');

          try {
            let payload;
            if (cardType === 'daily') {
              payload = { action: 'fetchVerseForFavorite', special: 'daily' };
            } else if (cardType === 'odd-even') {
              payload = {
                action: 'fetchVerseForFavorite',
                special: 'odd-even',
                day: currentDisplayDate.getDate().toString(),
              };
            } else if (cardType === 'day-of-week') {
              payload = {
                action: 'fetchVerseForFavorite',
                special: 'day-of-week',
                year: currentDisplayDate.getFullYear(),
                month: currentDisplayDate.getMonth(),
                day: currentDisplayDate.getDate(),
              };
            } else if (cardType === 'day-month') {
              payload = {
                action: 'fetchVerseForFavorite',
                special: 'day-month',
                day: currentDisplayDate.getDate().toString(),
                selectedTrack: selectedTrack,
              };
            }

            const response = await fetch('/.netlify/functions/fetch-verse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) {
              console.error('No verse data available to favourite for', cardType, data.error);
              return;
            }

            verseData = data;
          } catch (err) {
            console.error('Error fetching verse for favorite:', err);
            return;
          }

          if (verseData) {
            toggleFavourite(cardType, date, verseData);
          } else {
            console.error('No verse data available to favourite for', cardType);
          }
        });
      });

      // Share buttons
      document.querySelectorAll('.outline-button').forEach(button => {
        button.addEventListener('click', function () {
          const card = this.closest('.card');
          const verseText = card.querySelector('.verse-text, .small-verse-text')?.textContent.trim();
          if (!verseText) return;
          if (navigator.share) {
            navigator.share({
              title: 'Daily Bible Verse',
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

      // Navigation buttons
      document.getElementById('prev-day').addEventListener('click', () => {
        currentDisplayDate.setDate(currentDisplayDate.getDate() - 1);
        updateAllContent();
      });

      document.getElementById('next-day').addEventListener('click', () => {
        currentDisplayDate.setDate(currentDisplayDate.getDate() + 1);
        updateAllContent();
      });

      document.getElementById('today').addEventListener('click', () => {
        currentDisplayDate = new Date();
        updateAllContent();
      });

      updateAllContent();
    });
