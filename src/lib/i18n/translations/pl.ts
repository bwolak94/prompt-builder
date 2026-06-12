// Translations interface — all leaf values are `string` so EN can implement it
export interface Translations {
  lang: 'pl' | 'en';
  nav: { templates: string; features: string; pricing: string; login: string; register: string; dashboard: string; settings: string; logout: string; openMenu: string; closeMenu: string };
  langToggle: { label: string; pl: string; en: string };
  auth: { signIn: string; signUp: string; email: string; password: string; confirmPassword: string; rememberMe: string; forgotPassword: string; haveAccount: string; noAccount: string; registerLink: string; loginLink: string; displayName: string; signingIn: string; signingUp: string; errorInvalid: string; errorGeneric: string; passwordMismatch: string; passwordTooShort: string };
  dashboard: { title: string; subtitle: string; newPrompt: string; filterAll: string; filterPublic: string; filterPrivate: string; filterUnscored: string; emptyAll: string; emptyAllSub: string; emptyPublic: string; emptyPublicSub: string; emptyPrivate: string; emptyPrivateSub: string; createFirst: string; statsTotal: string; statsPublic: string; statsViews: string; statsForks: string };
  explore: { title: string; subtitle: string; noResults: string; noResultsSub: string; searchPlaceholder: string; useTemplate: string; errorLoad: string };
  filters: { category: string; difficulty: string; allCategories: string; allDifficulties: string; coding: string; writing: string; analysis: string; roleplay: string; beginner: string; intermediate: string; advanced: string };
  builder: { title: string; untitled: string; titlePlaceholder: string; descriptionPlaceholder: string; save: string; saving: string; saved: string; copy: string; copied: string; preview: string; edit: string; addBlock: string; emptyCanvas: string; emptyCanvasSub: string; variables: string; noVariables: string; noVariablesSub: string; variableDefault: string; variableLabel: string; sectionPaletteTitle: string; sectionPaletteCore: string; sectionPaletteOptional: string; sectionPaletteAdvanced: string; dragHandle: string; deleteBlock: string; scorePrompt: string; public: string; private: string; tags: string; tagsPlaceholder: string };
  sections: { role: { name: string; description: string }; context: { name: string; description: string }; task: { name: string; description: string }; format: { name: string; description: string }; constraints: { name: string; description: string }; examples: { name: string; description: string }; tone: { name: string; description: string }; audience: { name: string; description: string }; chain_of_thought: { name: string; description: string }; output_schema: { name: string; description: string } };
  promptCard: { edit: string; delete: string; fork: string; share: string; public: string; private: string; viewCount: string; forkCount: string; deleteConfirm: string; deleteConfirmSub: string; deleteCancel: string; deleteAction: string };
  templateCard: { use: string; difficulty: { beginner: string; intermediate: string; advanced: string }; featured: string; forks: string };
  settings: { title: string; profileTab: string; preferencesTab: string; accountTab: string; displayName: string; displayNameSub: string; bio: string; bioPlaceholder: string; website: string; saveProfile: string; language: string; aiModel: string; savePreferences: string; changePassword: string; currentPassword: string; newPassword: string; confirmNewPassword: string; updatePassword: string; dangerZone: string; deleteAccount: string; deleteAccountSub: string; deleteAccountConfirm: string };
  aiScore: { title: string; score: string; clarity: string; specificity: string; structure: string; tone: string; completeness: string; excellent: string; good: string; fair: string; poor: string; analyze: string; analyzing: string; suggestions: string; noScore: string; noScoreSub: string };
  sidebar: { dashboard: string; builder: string; explore: string; settings: string; newPrompt: string; chains: string };
  publicPrompt: { fork: string; viewCount: string; forkCount: string; notFound: string; notFoundSub: string };
  landing: { heroTitle: string; heroSubtitle: string; heroCta: string; heroCtaSub: string; featuredTitle: string; featuredSubtitle: string; featuresTitle: string; howItWorksTitle: string; ctaTitle: string; ctaSubtitle: string; ctaButton: string };
  common: { loading: string; error: string; cancel: string; confirm: string; save: string; delete: string; edit: string; close: string; back: string; next: string; yes: string; no: string; or: string; and: string; search: string; filter: string; clear: string; copy: string; copied: string; share: string; notFound: string; forbidden: string; serverError: string; tryAgain: string };
  run: { runPrompt: string; cancel: string; reset: string; provider: string; model: string; keySource: string; keyHosted: string; keyByok: string; responseTitle: string; creditsUnlimited: string; creditsThisMonth: string; limitReached: string; noByokKey: string };
  versions: { title: string; create: string; creating: string; createTitle: string; createDesc: string; summaryPlaceholder: string; empty: string; noSummary: string; restore: string; restoring: string; restoreConfirm: string; restoreConfirmTitle: string; restoreConfirmDesc: string; savedOnSave: string };
  ab: { title: string; enterMode: string; enterModeDesc: string; creating: string; exit: string; variantA: string; variantB: string; scoreOffline: string; scoring: string; runLive: string; tabDiff: string; tabScore: string; tabResponses: string; applyB: string; keepBoth: string; winner: string; tie: string };
  smartVars: { title: string; reset: string; preview: string; copy: string; typeText: string; typeSelect: string; typeNumber: string; typeMultiline: string; typeBoolean: string; validationRequired: string; validationRange: string; on: string; off: string };
  community: { title: string; subtitle: string; tabs: { trending: string; recent: string; topRated: string; featured: string }; period: { h24: string; week: string; month: string; all: string }; forkThis: string; by: string; noResults: string; loadMore: string };
  collections: { title: string; newCollection: string; editCollection: string; deleteCollection: string; deleteConfirm: string; namePlaceholder: string; noCollections: string; noCollectionsSub: string; makePublic: string; copyBundleLink: string };
  challenges: { title: string; subtitle: string; activeChallenge: string; timeRemaining: string; submit: string; submitConfirm: string; submissions: string; noSubmissions: string; vote: string; votes: string; voted: string; propose: string; proposals: string; noProposals: string; proposalThreshold: string; proposalTitlePlaceholder: string; proposalDescPlaceholder: string; leaderboard: string; leaderboardEmpty: string; wins: string; badges: string; noActive: string; statusActive: string; statusVoting: string; statusUpcoming: string; statusCompleted: string };
  ratings: { title: string; yourRating: string; rate: string; loginTo: string; loginLink: string };
  comments: { title: string; add: string; reply: string; edit: string; delete: string; helpful: string; report: string; send: string; sending: string; cancel: string; placeholder: string; replyPlaceholder: string; loadMore: string; loading: string; empty: string; loginTo: string; loginLink: string; reportSpam: string; reportAbuse: string; reportOfftopic: string; reportOther: string };
}

export const pl: Translations = {
  lang: 'pl',

  // ── Navigation ─────────────────────────────────────────────────
  nav: {
    templates: 'Szablony',
    features: 'Funkcje',
    pricing: 'Cennik',
    login: 'Zaloguj',
    register: 'Zarejestruj',
    dashboard: 'Dashboard',
    settings: 'Ustawienia',
    logout: 'Wyloguj',
    openMenu: 'Otwórz menu',
    closeMenu: 'Zamknij menu',
  },

  // ── Language toggle ────────────────────────────────────────────
  langToggle: {
    label: 'Zmień język',
    pl: 'Polski',
    en: 'English',
  },

  // ── Auth ───────────────────────────────────────────────────────
  auth: {
    signIn: 'Zaloguj się',
    signUp: 'Zarejestruj się',
    email: 'Email',
    password: 'Hasło',
    confirmPassword: 'Potwierdź hasło',
    rememberMe: 'Zapamiętaj mnie',
    forgotPassword: 'Zapomniałeś hasła?',
    haveAccount: 'Masz już konto?',
    noAccount: 'Nie masz konta?',
    registerLink: 'Zarejestruj się',
    loginLink: 'Zaloguj się',
    displayName: 'Nazwa wyświetlana',
    signingIn: 'Logowanie…',
    signingUp: 'Rejestracja…',
    errorInvalid: 'Nieprawidłowy email lub hasło',
    errorGeneric: 'Coś poszło nie tak. Spróbuj ponownie.',
    passwordMismatch: 'Hasła nie są zgodne',
    passwordTooShort: 'Hasło musi mieć minimum 8 znaków',
  },

  // ── Dashboard ──────────────────────────────────────────────────
  dashboard: {
    title: 'Moje prompty',
    subtitle: 'Zarządzaj swoją biblioteką promptów',
    newPrompt: 'Nowy prompt',
    filterAll: 'Wszystkie',
    filterPublic: 'Publiczne',
    filterPrivate: 'Prywatne',
    filterUnscored: 'Bez oceny',
    emptyAll: 'Brak promptów',
    emptyAllSub: 'Utwórz swój pierwszy prompt, aby zacząć.',
    emptyPublic: 'Brak publicznych promptów',
    emptyPublicSub: 'Opublikuj prompt, aby pojawił się tutaj.',
    emptyPrivate: 'Brak prywatnych promptów',
    emptyPrivateSub: 'Prywatne prompty są widoczne tylko dla Ciebie.',
    createFirst: 'Utwórz pierwszy prompt',
    statsTotal: 'Wszystkich promptów',
    statsPublic: 'Publicznych',
    statsViews: 'Wyświetleń',
    statsForks: 'Forków',
  },

  // ── Explore ────────────────────────────────────────────────────
  explore: {
    title: 'Explore',
    subtitle: 'Przeglądaj gotowe szablony i twórz na ich podstawie własne prompty',
    noResults: 'Brak wyników',
    noResultsSub: 'Spróbuj zmienić filtry lub wyszukiwaną frazę',
    searchPlaceholder: 'Szukaj szablonów…',
    useTemplate: 'Użyj szablonu',
    errorLoad: 'Nie udało się załadować szablonów',
  },

  // ── Template filters ───────────────────────────────────────────
  filters: {
    category: 'Kategoria',
    difficulty: 'Poziom',
    allCategories: 'Wszystkie kategorie',
    allDifficulties: 'Wszystkie poziomy',
    coding: 'Programowanie',
    writing: 'Pisanie',
    analysis: 'Analiza',
    roleplay: 'Roleplay',
    beginner: 'Początkujący',
    intermediate: 'Średniozaawansowany',
    advanced: 'Zaawansowany',
  },

  // ── Builder ────────────────────────────────────────────────────
  builder: {
    title: 'Kreator promptów',
    untitled: 'Nowy prompt',
    titlePlaceholder: 'Nazwa promptu…',
    descriptionPlaceholder: 'Opis (opcjonalnie)…',
    save: 'Zapisz',
    saving: 'Zapisywanie…',
    saved: 'Zapisano',
    copy: 'Kopiuj',
    copied: 'Skopiowano!',
    preview: 'Podgląd',
    edit: 'Edytuj',
    addBlock: 'Dodaj sekcję',
    emptyCanvas: 'Dodaj sekcje, aby zbudować prompt',
    emptyCanvasSub: 'Wybierz sekcje z palety po lewej stronie',
    variables: 'Zmienne',
    noVariables: 'Brak zmiennych',
    noVariablesSub: 'Użyj {{nazwa}} w blokach, aby dodać zmienne',
    variableDefault: 'Wartość domyślna',
    variableLabel: 'Etykieta',
    sectionPaletteTitle: 'Sekcje',
    sectionPaletteCore: 'Rdzeń',
    sectionPaletteOptional: 'Opcjonalne',
    sectionPaletteAdvanced: 'Zaawansowane',
    dragHandle: 'Przeciągnij aby zmienić kolejność',
    deleteBlock: 'Usuń blok',
    scorePrompt: 'Oceń prompt',
    public: 'Publiczny',
    private: 'Prywatny',
    tags: 'Tagi',
    tagsPlaceholder: 'Dodaj tag i naciśnij Enter…',
  },

  // ── Prompt sections (builder palette) ─────────────────────────
  sections: {
    role: { name: 'Rola', description: 'Zdefiniuj rolę lub personę AI w tym prompcie.' },
    context: { name: 'Kontekst', description: 'Podaj tło i kontekst zadania dla modelu.' },
    task: { name: 'Zadanie', description: 'Opisz główne zadanie do wykonania.' },
    format: { name: 'Format', description: 'Określ oczekiwany format i strukturę odpowiedzi.' },
    constraints: { name: 'Ograniczenia', description: 'Podaj ograniczenia i rzeczy których należy unikać.' },
    examples: { name: 'Przykłady', description: 'Dodaj przykłady wejścia/wyjścia (few-shot).' },
    tone: { name: 'Ton', description: 'Ustal ton i styl odpowiedzi.' },
    audience: { name: 'Odbiorca', description: 'Zdefiniuj docelowego odbiorcę treści.' },
    chain_of_thought: { name: 'Rozumowanie', description: 'Poproś model o stopniowe rozumowanie (chain-of-thought).' },
    output_schema: { name: 'Schema JSON', description: 'Zdefiniuj oczekiwany schemat JSON wyjścia.' },
  },

  // ── Prompt card (dashboard) ────────────────────────────────────
  promptCard: {
    edit: 'Edytuj',
    delete: 'Usuń',
    fork: 'Duplikuj',
    share: 'Udostępnij',
    public: 'Publiczny',
    private: 'Prywatny',
    viewCount: 'wyświetleń',
    forkCount: 'forków',
    deleteConfirm: 'Czy na pewno chcesz usunąć ten prompt?',
    deleteConfirmSub: 'Tej operacji nie można cofnąć.',
    deleteCancel: 'Anuluj',
    deleteAction: 'Usuń',
  },

  // ── Template card (explore) ────────────────────────────────────
  templateCard: {
    use: 'Użyj szablonu',
    difficulty: {
      beginner: 'Początkujący',
      intermediate: 'Średni',
      advanced: 'Zaawansowany',
    },
    featured: 'Wyróżniony',
    forks: 'forków',
  },

  // ── Settings ───────────────────────────────────────────────────
  settings: {
    title: 'Ustawienia',
    profileTab: 'Profil',
    preferencesTab: 'Preferencje',
    accountTab: 'Konto',
    displayName: 'Nazwa wyświetlana',
    displayNameSub: 'Widoczna dla innych użytkowników',
    bio: 'Bio',
    bioPlaceholder: 'Kilka słów o sobie…',
    website: 'Strona WWW',
    saveProfile: 'Zapisz profil',
    language: 'Język interfejsu',
    aiModel: 'Domyślny model AI',
    savePreferences: 'Zapisz preferencje',
    changePassword: 'Zmień hasło',
    currentPassword: 'Aktualne hasło',
    newPassword: 'Nowe hasło',
    confirmNewPassword: 'Potwierdź nowe hasło',
    updatePassword: 'Zaktualizuj hasło',
    dangerZone: 'Strefa niebezpieczna',
    deleteAccount: 'Usuń konto',
    deleteAccountSub: 'Tej operacji nie można cofnąć. Wszystkie dane zostaną trwale usunięte.',
    deleteAccountConfirm: 'Usuń moje konto',
  },

  // ── AI Score ───────────────────────────────────────────────────
  aiScore: {
    title: 'Ocena AI',
    score: 'Wynik',
    clarity: 'Klarowność',
    specificity: 'Konkretność',
    structure: 'Struktura',
    tone: 'Ton',
    completeness: 'Kompletność',
    excellent: 'Doskonały',
    good: 'Dobry',
    fair: 'Średni',
    poor: 'Słaby',
    analyze: 'Analizuj prompt',
    analyzing: 'Analizowanie…',
    suggestions: 'Sugestie',
    noScore: 'Brak oceny',
    noScoreSub: 'Kliknij "Oceń prompt", aby uzyskać szczegółową analizę.',
  },

  // ── Sidebar ────────────────────────────────────────────────────
  sidebar: {
    dashboard: 'Dashboard',
    builder: 'Kreator',
    explore: 'Explore',
    settings: 'Ustawienia',
    newPrompt: 'Nowy prompt',
    chains: 'Łańcuchy',
  },

  // ── Public prompt page ─────────────────────────────────────────
  publicPrompt: {
    fork: 'Użyj tego promptu',
    viewCount: 'wyświetleń',
    forkCount: 'forków',
    notFound: 'Prompt nie został znaleziony',
    notFoundSub: 'Ten prompt nie istnieje lub nie jest publiczny.',
  },

  // ── Landing page ───────────────────────────────────────────────
  landing: {
    heroTitle: 'Twórz doskonałe prompty AI',
    heroSubtitle: 'Wizualny kreator promptów ze strukturą sekcji, zmiennymi i oceną jakości AI.',
    heroCta: 'Zacznij bezpłatnie',
    heroCtaSub: 'Przeglądaj szablony',
    featuredTitle: 'Wyróżnione szablony',
    featuredSubtitle: 'Gotowe do użycia prompty dla każdego zastosowania',
    featuresTitle: 'Wszystko, czego potrzebujesz',
    howItWorksTitle: 'Jak to działa?',
    ctaTitle: 'Gotowy, żeby zacząć?',
    ctaSubtitle: 'Dołącz do tysięcy użytkowników, którzy tworzą lepsze prompty.',
    ctaButton: 'Utwórz darmowe konto',
  },

  // ── Run prompt ─────────────────────────────────────────────────
  run: {
    runPrompt: 'Uruchom prompt',
    cancel: 'Zatrzymaj',
    reset: 'Resetuj',
    provider: 'Dostawca',
    model: 'Model',
    keySource: 'Klucz API',
    keyHosted: 'Platformowy (limit)',
    keyByok: 'Własny klucz (BYOK)',
    responseTitle: 'Odpowiedź',
    creditsUnlimited: 'Bez limitu (Pro)',
    creditsThisMonth: 'uruchomień w tym miesiącu',
    limitReached: 'Limit miesięczny wyczerpany. Uaktualnij plan lub dodaj własny klucz.',
    noByokKey: 'Brak skonfigurowanego klucza BYOK dla tego dostawcy.',
  },

  // ── Smart variables ────────────────────────────────────────────
  smartVars: {
    title: 'Zmienne',
    reset: 'Resetuj',
    preview: 'Podgląd z wartościami',
    copy: 'Kopiuj',
    typeText: 'Tekst',
    typeSelect: 'Wybór',
    typeNumber: 'Liczba',
    typeMultiline: 'Wieloliniowy',
    typeBoolean: 'Przełącznik',
    validationRequired: 'Zmienna "{{name}}" jest wymagana',
    validationRange: 'Wartość {{name}} musi być między {{min}} a {{max}}',
    on: 'Tak',
    off: 'Nie',
  },

  // ── A/B testing ────────────────────────────────────────────────
  ab: {
    title: 'Tryb A/B',
    enterMode: 'Tryb A/B',
    enterModeDesc: 'Porównaj dwa warianty promptu side-by-side.',
    creating: 'Tworzenie testu…',
    exit: 'Wyjdź z A/B',
    variantA: 'Wariant A (oryginalny)',
    variantB: 'Wariant B (edytowalny)',
    scoreOffline: 'Oceń oba',
    scoring: 'Ocenianie…',
    runLive: 'Uruchom oba',
    tabDiff: 'Różnice',
    tabScore: 'Wyniki',
    tabResponses: 'Odpowiedzi',
    applyB: 'Zastąp A przez B',
    keepBoth: 'Zachowaj oba',
    winner: 'Lepszy',
    tie: 'Remis',
  },

  // ── Version history ────────────────────────────────────────────
  versions: {
    title: 'Historia wersji',
    create: 'Zapisz wersję',
    creating: 'Zapisywanie…',
    createTitle: 'Zapisz wersję',
    createDesc: 'Opcjonalnie dodaj opis zmian.',
    summaryPlaceholder: 'Opis zmian (opcjonalnie)',
    empty: 'Brak zapisanych wersji.',
    noSummary: 'Brak opisu',
    restore: 'Przywróć tę wersję',
    restoring: 'Przywracanie…',
    restoreConfirm: 'Tak, przywróć',
    restoreConfirmTitle: 'Przywrócić wersję?',
    restoreConfirmDesc: 'Obecna zawartość promptu zostanie zastąpiona tą wersją. Aktualna wersja zostanie zachowana w historii.',
    savedOnSave: 'Wersja zapisana automatycznie',
  },

  // ── Collections ────────────────────────────────────────────────
  collections: {
    title: 'Kolekcje',
    newCollection: 'Nowa kolekcja',
    editCollection: 'Edytuj kolekcję',
    deleteCollection: 'Usuń kolekcję',
    deleteConfirm: 'Usunąć kolekcję i wszystkie podkolekcje?',
    namePlaceholder: 'Nazwa kolekcji…',
    noCollections: 'Brak kolekcji',
    noCollectionsSub: 'Utwórz folder, aby organizować prompty',
    makePublic: 'Udostępnij jako bundle',
    copyBundleLink: 'Kopiuj link do bundle',
  },

  // ── Challenges ─────────────────────────────────────────────────
  challenges: {
    title: 'Wyzwania',
    subtitle: 'Tygodniowe wyzwania promptów dla społeczności',
    activeChallenge: 'Aktywne wyzwanie',
    timeRemaining: 'Pozostało',
    submit: 'Wyślij swój prompt',
    submitConfirm: 'Wyślij',
    submissions: 'Zgłoszenia',
    noSubmissions: 'Brak zgłoszeń. Bądź pierwszy!',
    vote: 'Głosuj',
    votes: 'głosów',
    voted: 'Zagłosowano',
    propose: 'Zaproponuj temat',
    proposals: 'Propozycje tematów',
    noProposals: 'Brak propozycji.',
    proposalThreshold: 'Potrzeba {{n}} głosów, aby przejść do kolejki',
    proposalTitlePlaceholder: 'Tytuł wyzwania (min. 5 znaków)…',
    proposalDescPlaceholder: 'Opis wyzwania (min. 20 znaków)…',
    leaderboard: 'Ranking',
    leaderboardEmpty: 'Ranking jest pusty.',
    wins: 'Wygrane',
    badges: 'Odznaki',
    noActive: 'Brak aktywnego wyzwania. Zaproponuj temat poniżej!',
    statusActive: 'Trwa',
    statusVoting: 'Głosowanie',
    statusUpcoming: 'Nadchodzi',
    statusCompleted: 'Zakończone',
  },

  // ── Community feed ─────────────────────────────────────────────
  community: {
    title: 'Społeczność',
    subtitle: 'Odkrywaj i remixuj prompty stworzone przez innych',
    tabs: {
      trending: 'Trending',
      recent: 'Najnowsze',
      topRated: 'Najlepiej oceniane',
      featured: 'Wyróżnione',
    },
    period: {
      h24: 'Ostatnie 24h',
      week: 'Ten tydzień',
      month: 'Ten miesiąc',
      all: 'Wszystkie',
    },
    forkThis: 'Remixuj',
    by: 'przez',
    noResults: 'Brak wyników dla tych filtrów',
    loadMore: 'Załaduj więcej',
  },

  // ── Ratings ────────────────────────────────────────────────────
  ratings: {
    title: 'Ocena',
    yourRating: 'Twoja ocena: {{value}}★',
    rate: 'Oceń ten prompt:',
    loginTo: 'aby ocenić',
    loginLink: 'Zaloguj się',
  },

  // ── Comments ───────────────────────────────────────────────────
  comments: {
    title: 'Komentarze',
    add: 'Dodaj komentarz',
    reply: 'Odpowiedz',
    edit: 'Edytuj',
    delete: 'Usuń',
    helpful: 'Pomocny',
    report: 'Zgłoś',
    send: 'Wyślij',
    sending: 'Wysyłanie…',
    cancel: 'Anuluj',
    placeholder: 'Dodaj komentarz…',
    replyPlaceholder: 'Odpowiedz na komentarz…',
    loadMore: 'Załaduj więcej',
    loading: 'Ładowanie…',
    empty: 'Brak komentarzy. Bądź pierwszy!',
    loginTo: 'aby komentować',
    loginLink: 'Zaloguj się',
    reportSpam: 'spam',
    reportAbuse: 'nadużycie',
    reportOfftopic: 'nie na temat',
    reportOther: 'inne',
  },

  // ── Common ─────────────────────────────────────────────────────
  common: {
    loading: 'Ładowanie…',
    error: 'Błąd',
    cancel: 'Anuluj',
    confirm: 'Potwierdź',
    save: 'Zapisz',
    delete: 'Usuń',
    edit: 'Edytuj',
    close: 'Zamknij',
    back: 'Wróć',
    next: 'Dalej',
    yes: 'Tak',
    no: 'Nie',
    or: 'lub',
    and: 'i',
    search: 'Szukaj',
    filter: 'Filtruj',
    clear: 'Wyczyść',
    copy: 'Kopiuj',
    copied: 'Skopiowano',
    share: 'Udostępnij',
    notFound: 'Nie znaleziono',
    forbidden: 'Brak dostępu',
    serverError: 'Błąd serwera',
    tryAgain: 'Spróbuj ponownie',
  },
};
