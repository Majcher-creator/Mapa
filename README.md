# Mapa - RoofSketch App

Aplikacja mobilna React Native/Expo do tworzenia szkiców dachów z ortofotomapy.

## Funkcjonalności

1. **Wyszukiwanie lokalizacji** - po adresie (Nominatim/OpenStreetMap) lub GPS
2. **Widok mapy z ortofotomapą** - warstwy: Geoportal.gov.pl, ESRI, Google Satellite, OSM
3. **Przechwytywanie zdjęcia dachu** - zrzut ekranu z mapy
4. **Konwersja na szkic** - grayscale, wysoki kontrast
5. **Rysowanie po szkicu** - ołówek, linie, wymiary w metrach
6. **Eksport do galerii** - zapis gotowego szkicu jako PNG

## Instalacja

```bash
# Zainstaluj zależności
npm install

# Uruchom w trybie deweloperskim
npx expo start

# Uruchom na Android
npx expo start --android

# Uruchom na iOS
npx expo start --ios
```

## Budowanie APK

```bash
# Zainstaluj EAS CLI globalnie
npm install -g eas-cli

# Zaloguj się do Expo
eas login

# Zbuduj APK dla Android (preview)
eas build --platform android --profile preview

# Zbuduj APK dla Android (production)
eas build --platform android --profile production
```

## Struktura projektu

```
├── App.js                          # Główny plik aplikacji z nawigacją
├── app.json                        # Konfiguracja Expo
├── package.json                    # Zależności
├── eas.json                        # Konfiguracja budowania
├── assets/                         # Ikony i grafiki
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── src/
    └── screens/
        ├── HomeScreen.js           # Ekran wyszukiwania lokalizacji
        ├── MapScreen.js            # Mapa z ortofotomapą (Leaflet)
        ├── SketchScreen.js         # Przechwytywanie i konwersja
        └── DrawingScreen.js        # Rysowanie wymiarów
```

## Warstwy ortofotomapy

Aplikacja obsługuje następujące warstwy:

- **Geoportal PL** - ortofotomapa Polski z GUGiK
- **ESRI Satellite** - globalna ortofotomapa
- **Google Satellite** - nieoficjalna warstwa Google
- **OpenStreetMap** - mapa bazowa jako fallback

## Technologie

- React Native 0.73.6
- Expo SDK ~50.0.0
- React Navigation 6.x
- React Native WebView (dla Leaflet)
- Expo Location, Media Library, Image Manipulator
- React Native SVG (dla rysowania)
- React Native Gesture Handler

## Uprawnienia

Aplikacja wymaga następujących uprawnień:

### Android
- `ACCESS_FINE_LOCATION` - lokalizacja GPS
- `ACCESS_COARSE_LOCATION` - przybliżona lokalizacja
- `WRITE_EXTERNAL_STORAGE` - zapis do galerii
- `READ_EXTERNAL_STORAGE` - odczyt z galerii
- `READ_MEDIA_IMAGES` - dostęp do zdjęć (Android 13+)

### iOS
- `NSLocationWhenInUseUsageDescription` - lokalizacja
- `NSPhotoLibraryUsageDescription` - dostęp do zdjęć
- `NSPhotoLibraryAddUsageDescription` - zapis do galerii

## Autor

Majcher-creator

## Licencja

MIT
