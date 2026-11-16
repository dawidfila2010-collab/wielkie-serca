/* =========================================================
   Fundacja Wielkie Serca - skrypt strony
   Każda funkcja odpowiada za jedną rzecz na stronie.
   ========================================================= */

// Informacja dla CSS, że JavaScript działa (potrzebne do animacji)
document.documentElement.classList.add('js');

// Bezpieczny zapis i odczyt z pamięci przeglądarki.
// W trybie prywatnym localStorage może rzucić błąd, wtedy po prostu nie zapamiętujemy.
function zapisz(klucz, wartosc) {
  try { localStorage.setItem(klucz, wartosc); } catch (e) { /* brak pamięci, trudno */ }
}

/* ---------- Menu na telefonie ---------- */
function ustawMenu() {
  const przycisk = document.querySelector('.menu-przycisk');
  const menu = document.getElementById('menu');

  przycisk.addEventListener('click', () => {
    const otwarte = menu.classList.toggle('otwarte');
    przycisk.setAttribute('aria-expanded', otwarte);
    przycisk.setAttribute('aria-label', otwarte ? 'Zamknij menu' : 'Otwórz menu');
  });

  // Po kliknięciu w link zamykamy menu
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('otwarte');
      przycisk.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- 1. Kopiowanie numeru KRS ---------- */
function ustawKopiowanie() {
  const przycisk = document.querySelector('[data-kopiuj]');
  const komunikat = document.querySelector('.krs__komunikat');

  przycisk.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(przycisk.dataset.kopiuj);
      komunikat.textContent = 'Skopiowano!';
    } catch (e) {
      komunikat.textContent = 'Nie udało się skopiować. Zaznacz numer ręcznie.';
    }
    setTimeout(() => { komunikat.textContent = ''; }, 2500);
  });
}

/* ---------- 2. Kalkulator 1,5% ---------- */
const PROCENT_OPP = 0.015;
const MAKS_PODATEK = 100000000;

// Co można kupić za daną kwotę (od najmniejszej)
const ZNACZENIE_KWOT = [
  { od: 0, tekst: 'Każda złotówka się liczy. To dokładka do paczki dla dziecka na oddziale.' },
  { od: 30, tekst: 'Tyle kosztuje paczka z kredkami, blokiem i książką dla dziecka na oddziale.' },
  { od: 100, tekst: 'To zestaw gier i książek do świetlicy na oddziale.' },
  { od: 250, tekst: 'To tydzień dojazdów na chemioterapię dla rodziny spoza Lublina.' },
  { od: 600, tekst: 'To cztery spotkania z psychologiem dla dziecka albo rodzica.' },
  { od: 1500, tekst: 'To dwutygodniowy turnus rehabilitacyjny dla dziecka po leczeniu.' }
];

// Przepis mówi: 1,5% podatku, zaokrąglone w dół do pełnych 10 groszy
function policzOdpis(podatek) {
  return Math.floor(podatek * PROCENT_OPP * 10) / 10;
}

function znajdzZnaczenie(kwota) {
  // Szukamy ostatniego progu, który kwota przekracza
  return ZNACZENIE_KWOT.filter((prog) => kwota >= prog.od).pop().tekst;
}

function formatujZlote(kwota) {
  return kwota.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });
}

function ustawKalkulator() {
  const formularz = document.getElementById('formularz-kalkulator');
  const pole = document.getElementById('podatek');
  const blad = document.getElementById('kalkulator-blad');
  const wynik = document.getElementById('kwota-wynik');
  const znaczenie = document.getElementById('kwota-znaczenie');

  formularz.addEventListener('submit', (e) => e.preventDefault());

  pole.addEventListener('input', () => {
    const tekst = pole.value.trim();
    const podatek = Number(tekst);

    blad.textContent = '';
    pole.removeAttribute('aria-invalid');

    if (tekst === '') {
      wynik.textContent = formatujZlote(0);
      znaczenie.textContent = 'Wpisz kwotę, a pokażemy, na co możemy ją przeznaczyć.';
      return;
    }
    if (Number.isNaN(podatek) || podatek < 0 || podatek > MAKS_PODATEK) {
      blad.textContent = 'Wpisz kwotę podatku jako liczbę większą od zera.';
      pole.setAttribute('aria-invalid', 'true');
      return;
    }

    const odpis = policzOdpis(podatek);
    wynik.textContent = formatujZlote(odpis);
    znaczenie.textContent = znajdzZnaczenie(odpis);
  });
}

/* ---------- 3. Odliczanie do 30 kwietnia ---------- */
function najblizszyTermin() {
  const teraz = new Date();
  // Miesiące w JavaScript liczymy od zera, więc kwiecień to 3
  let termin = new Date(teraz.getFullYear(), 3, 30, 23, 59, 59);
  if (teraz > termin) {
    termin = new Date(teraz.getFullYear() + 1, 3, 30, 23, 59, 59);
  }
  return termin;
}

function ustawOdliczanie() {
  const termin = najblizszyTermin();
  const pola = {
    dni: document.getElementById('dni'),
    godziny: document.getElementById('godziny'),
    minuty: document.getElementById('minuty'),
    sekundy: document.getElementById('sekundy')
  };
  document.getElementById('termin-data').textContent = '30 kwietnia ' + termin.getFullYear();

  function odswiez() {
    const zostalo = Math.max(0, termin - new Date());
    const sekundy = Math.floor(zostalo / 1000);
    pola.dni.textContent = Math.floor(sekundy / 86400);
    pola.godziny.textContent = Math.floor((sekundy % 86400) / 3600);
    pola.minuty.textContent = Math.floor((sekundy % 3600) / 60);
    pola.sekundy.textContent = sekundy % 60;
  }

  odswiez();
  setInterval(odswiez, 1000);
}

/* ---------- 4. Animowane liczniki ---------- */
const CZAS_LICZENIA = 2000; // milisekundy

function animujLicznik(element) {
  const cel = Number(element.dataset.licznik);
  const start = performance.now();

  function krok(teraz) {
    const postep = Math.min((teraz - start) / CZAS_LICZENIA, 1);
    // Wygładzenie: na początku szybko, pod koniec wolniej
    const wygladzony = 1 - Math.pow(1 - postep, 3);
    element.textContent = Math.round(cel * wygladzony).toLocaleString('pl-PL');
    if (postep < 1) requestAnimationFrame(krok);
  }
  requestAnimationFrame(krok);
}

/* ---------- 5. Pasek postępu celu ---------- */
function wypelnijPasek(element) {
  element.style.width = element.dataset.procent + '%';
}

/* ---------- 12. Pojawianie się elementów przy przewijaniu ----------
   IntersectionObserver informuje, kiedy element wchodzi na ekran.
   Wtedy uruchamiamy animację i przestajemy go obserwować. */
function ustawPrzewijanie() {
  const obserwator = new IntersectionObserver((wpisy) => {
    wpisy.forEach((wpis) => {
      if (!wpis.isIntersecting) return;
      const el = wpis.target;

      if (el.dataset.licznik) animujLicznik(el);
      else if (el.dataset.procent) wypelnijPasek(el);
      else el.classList.add('widoczny');

      obserwator.unobserve(el);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.pokaz, [data-licznik], [data-procent]')
    .forEach((el) => obserwator.observe(el));
}

/* ---------- 6. Tryb ciemny ---------- */
function czyCiemny() {
  const ustawiony = document.documentElement.dataset.theme;
  if (ustawiony) return ustawiony === 'ciemny';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function ustawMotyw() {
  const przycisk = document.getElementById('motyw');
  przycisk.setAttribute('aria-pressed', czyCiemny());

  przycisk.addEventListener('click', () => {
    const nowy = czyCiemny() ? 'jasny' : 'ciemny';
    document.documentElement.dataset.theme = nowy;
    przycisk.setAttribute('aria-pressed', nowy === 'ciemny');
    zapisz('motyw', nowy);
  });
}

/* ---------- 7. Dostępność: wielkość tekstu i kontrast ---------- */
const CZCIONKA_MIN = 90;
const CZCIONKA_MAX = 140;
const CZCIONKA_KROK = 10;

function zmienCzcionke(zmiana) {
  const obecna = parseInt(document.documentElement.style.fontSize, 10) || 100;
  const nowa = Math.min(CZCIONKA_MAX, Math.max(CZCIONKA_MIN, obecna + zmiana));
  document.documentElement.style.fontSize = nowa + '%';
  zapisz('czcionka', nowa);
}

function ustawDostepnosc() {
  document.getElementById('czcionka-wiecej').addEventListener('click', () => zmienCzcionke(CZCIONKA_KROK));
  document.getElementById('czcionka-mniej').addEventListener('click', () => zmienCzcionke(-CZCIONKA_KROK));

  const kontrast = document.getElementById('kontrast');
  kontrast.setAttribute('aria-pressed', document.documentElement.dataset.contrast === 'wysoki');

  kontrast.addEventListener('click', () => {
    const wlaczony = document.documentElement.dataset.contrast === 'wysoki';
    if (wlaczony) delete document.documentElement.dataset.contrast;
    else document.documentElement.dataset.contrast = 'wysoki';
    kontrast.setAttribute('aria-pressed', !wlaczony);
    zapisz('kontrast', wlaczony ? 'nie' : 'tak');
  });
}

/* ---------- Start ---------- */
ustawMenu();
ustawKopiowanie();
ustawKalkulator();
ustawOdliczanie();
ustawPrzewijanie();
ustawMotyw();
ustawDostepnosc();
