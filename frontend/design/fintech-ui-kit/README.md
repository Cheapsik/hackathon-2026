# Fintech Soft Glass UI Kit

Pakiet łączy dwie referencje: strukturę ekranu Sleep z `references/reference-layout-sleep.jpg` oraz globalny soft-glass język wizualny z `references/reference-style-fintech.jpg`.

## Pliki

- `DESIGN.md` — źródło prawdy: kierunek, tokeny, układ, komponenty i kryteria odbioru.
- `CLAUDE-PROMPT.md` — gotowy prompt do wklejenia do Claude/Cursor.
- `styles/fintech-theme.css` — tokeny i bazowe klasy komponentów.
- `styles/tailwind-v4.css` — mapowanie najważniejszych tokenów dla Tailwind CSS v4.
- `templates/component-recipes.md` — szkielety JSX i reguły składania ekranów.
- `references/reference-layout-sleep.jpg` — źródło prawdy dla kompozycji i hierarchii pierwszego ekranu.
- `references/reference-style-fintech.jpg` — źródło prawdy dla materiałów, kolorów, typografii i komponentów całej aplikacji.

## Jak użyć

1. Skopiuj cały katalog do repozytorium.
2. Dodaj `styles/fintech-theme.css` po globalnym resecie CSS.
3. Dołącz referencję do kontekstu Claude/Cursor.
4. Wklej `CLAUDE-PROMPT.md` i uzupełnij sekcję `KONTEKST PROJEKTU`.
5. Buduj najpierw jeden ekran wzorcowy, porównaj go z referencją przy 390 × 844 px, a dopiero potem propaguj system.

## Ważne

To jest rekonstrukcja z rastrowej referencji, nie eksport z Figmy. Idealne 1:1 wymaga oryginalnych fontów, assetów, wymiarów i pliku źródłowego; pakiet definiuje jednak mierzalne zasady pozwalające dojść bardzo blisko przez screenshot-diff.
