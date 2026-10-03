# Component recipes

Poniższe szkielety pokazują strukturę. Nazwy ikon dostosuj do biblioteki już obecnej w projekcie.

## Mobile screen shell

```tsx
export function MobileScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="ft-canvas">
      <main className="ft-app-shell">
        <div className="ft-app-content">{children}</div>
      </main>
    </div>
  );
}
```

## Top bar

```tsx
type TopBarProps = {
  title: string;
  leading: React.ReactNode;
  trailing: React.ReactNode;
};

export function TopBar({ title, leading, trailing }: TopBarProps) {
  return (
    <header className="ft-topbar">
      <div>{leading}</div>
      <h1 className="ft-topbar__title">{title}</h1>
      <div>{trailing}</div>
    </header>
  );
}
```

## Asset field

```tsx
type AssetFieldProps = {
  label: string;
  balance: string;
  symbol: string;
  value: string;
  fiatValue: string;
  icon: React.ReactNode;
  tone: 'success' | 'warning';
};

export function AssetField(props: AssetFieldProps) {
  return (
    <section className="ft-asset-field" aria-label={props.label}>
      <div className="ft-asset-field__meta ft-label">
        <span>{props.label}</span>
        <span className="ft-numeric">Balance: {props.balance}</span>
      </div>
      <div className="ft-asset-field__main">
        <div className="ft-asset-field__asset">
          <span className={`ft-token-icon ft-token-icon--${props.tone}`} aria-hidden="true">
            {props.icon}
          </span>
          <strong>{props.symbol}</strong>
        </div>
        <div className="ft-asset-field__value">
          <div className="ft-value">{props.value}</div>
          <div className="ft-label ft-numeric">≈ {props.fiatValue}</div>
        </div>
      </div>
    </section>
  );
}
```

## Bottom action dock

```tsx
export function BottomActionDock() {
  return (
    <nav className="ft-bottom-dock" aria-label="Primary actions">
      <button className="ft-icon-button" aria-label="Go back">…</button>
      <button className="ft-soft-button ft-soft-button--primary">Confirm transaction</button>
      <button className="ft-icon-button" aria-label="More options">…</button>
    </nav>
  );
}
```

## Screen composition

```tsx
<MobileScreen>
  <TopBar title="Swap Coins" leading={<AvatarButton />} trailing={<NotificationButton />} />

  <section className="ft-section ft-center">
    <h2 className="ft-page-title">Swap Coins</h2>
  </section>

  <section className="ft-section ft-glass-panel" aria-label="Swap details">
    <div className="ft-stack">
      <AssetField {...payAsset} />
      <SwapDirectionButton />
      <AssetField {...receiveAsset} />
    </div>
  </section>

  <section className="ft-section ft-center ft-label">
    <p className="ft-numeric">Fee: 0.30 USDT</p>
    <p className="ft-numeric">1 BNB ≈ 610 USDT</p>
  </section>

  <BottomActionDock />
</MobileScreen>
```

## Reguły kompozycji

- `TopBar` zawsze ma trzy kolumny `44px 1fr 44px`, dzięki czemu tytuł pozostaje naprawdę wycentrowany.
- `AssetField` ma stałą hierarchię: meta u góry, aktywo i wartość na dole.
- Przycisk zmiany kierunku może nachodzić na szczelinę między polami, ale nie może zasłaniać treści.
- `BottomActionDock` nie może przykrywać ostatniej treści; `ft-app-content` zawiera zapas dolny.
- Nie dodawaj obramowania do każdego wrappera. Głębię budują powierzchnie, światło i odstępy.

## Kanoniczny ekran Sleep detail

Struktura pochodzi z pierwszej referencji, ale klasy materiałowe i tokeny z drugiej.

```tsx
export function SleepDetailScreen() {
  return (
    <div className="ft-canvas">
      <main className="ft-app-shell ft-immersive-detail">
        <section
          className="ft-media-hero"
          style={{ backgroundImage: `url(${sleepHero.src})` }}
          aria-labelledby="sleep-title"
        >
          <header className="ft-hero-controls">
            <button className="ft-icon-button" aria-label="Go back"><ArrowLeft /></button>
            <div className="ft-hero-actions">
              <button className="ft-icon-button" aria-label="Add to favorites" aria-pressed={favorite}>
                <Heart />
              </button>
              <button className="ft-icon-button" aria-label="More options"><EllipsisVertical /></button>
            </div>
          </header>

          <div className="ft-hero-copy">
            <h1 id="sleep-title">Sleep</h1>
            <p>Thousands of free music tracks and stories to help you get a better night.</p>
          </div>

          <nav className="ft-category-orbit" aria-label="Sleep content categories">
            {categories.map((category) => (
              <button
                key={category.id}
                className="ft-category"
                aria-current={category.id === activeCategory ? 'true' : undefined}
              >
                <span>{category.label}</span>
                <span className="ft-category__control" aria-hidden="true">{category.icon}</span>
              </button>
            ))}
          </nav>
        </section>

        <section className="ft-content-sheet" aria-labelledby="content-title">
          <div className="ft-sheet-handle" aria-hidden="true" />
          <div className="ft-detail-meta">
            <span>♪ 10 Min.</span><span>·</span><span>Stories</span><span>·</span><span>★ 4.8</span>
          </div>
          <h2 id="content-title" className="ft-detail-title">Drift Into a Deeper,<br />Better Sleep</h2>
          <p className="ft-detail-description">
            Relax your mind with calming stories, soothing sounds and mindful experiences designed to help you unwind.
          </p>
          <div className="ft-sound-rail" aria-label="Available sounds">
            {sounds.map((sound) => (
              <button
                key={sound.id}
                className="ft-sound-chip"
                style={{ backgroundImage: `url(${sound.cover})` }}
                aria-label={`Play ${sound.name}`}
                aria-pressed={sound.id === activeSound}
              >
                <span>{sound.name}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
```

### Pixel-match checkpoints

- Hero: 54–56% wysokości 844 px.
- Category orbit: optycznie osadzony tuż ponad łukiem sheet.
- Sheet: szeroki płytki łuk, nie półkole i nie prosty panel.
- Tytuł: dokładnie dwa wiersze w bazowym viewportcie.
- Sound rail: cztery elementy widoczne jednocześnie, bez ściskania labeli.
- Styl: całość jasna i mleczna zgodnie z drugą referencją; ciemny pozostaje przede wszystkim asset hero.
