import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export default function MapScreen({ route, navigation }) {
  const { location } = route.params;
  const [loading, setLoading] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState('geoportal');
  const webViewRef = useRef(null);

  const mapLayers = {
    geoportal: {
      name: 'Geoportal PL',
      url: 'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution',
      layers: 'Raster',
      attribution: 'GUGiK',
    },
    esri: {
      name: 'ESRI Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'ESRI',
    },
    google: {
      name: 'Google Satellite',
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      attribution: 'Google',
    },
    osm: {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: 'OpenStreetMap',
    },
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100vw; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', {
          zoomControl: true,
          attributionControl: true,
        }).setView([${location.latitude}, ${location.longitude}], 19);

        let currentLayer = null;

        const layers = {
          geoportal: L.tileLayer.wms('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution', {
            layers: 'Raster',
            format: 'image/jpeg',
            transparent: false,
            attribution: '© GUGiK',
            maxZoom: 21,
          }),
          esri: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© ESRI',
            maxZoom: 20,
          }),
          google: L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            attribution: '© Google',
            maxZoom: 20,
          }),
          osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }),
        };

        function changeLayer(layerName) {
          if (currentLayer) {
            map.removeLayer(currentLayer);
          }
          currentLayer = layers[layerName];
          currentLayer.addTo(map);
        }

        // Set initial layer
        changeLayer('geoportal');

        // Add marker at location
        L.marker([${location.latitude}, ${location.longitude}])
          .addTo(map)
          .bindPopup('${location.address}');

        // Listen for messages from React Native
        window.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.action === 'changeLayer') {
              changeLayer(data.layer);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        });

        document.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.action === 'changeLayer') {
              changeLayer(data.layer);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        });

        // Notify React Native when map is ready
        setTimeout(() => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ready' }));
        }, 1000);
      </script>
    </body>
    </html>
  `;

  const changeMapLayer = (layerKey) => {
    setSelectedLayer(layerKey);
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ action: 'changeLayer', layer: layerKey }));
    }
  };

  const captureRoofImage = async () => {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak uprawnień', 'Aplikacja potrzebuje dostępu do galerii');
        return;
      }

      Alert.alert(
        'Przechwytywanie',
        'Wyśrodkuj dach na mapie i naciśnij OK',
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'OK',
            onPress: async () => {
              // Execute JavaScript to capture the map canvas
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  (function() {
                    const canvas = document.querySelector('.leaflet-tile-pane');
                    if (canvas) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'capture',
                        message: 'Map captured'
                      }));
                    }
                  })();
                  true;
                `);
              }
              
              // Navigate to sketch screen
              setTimeout(() => {
                navigation.navigate('Sketch', { 
                  location,
                  layer: selectedLayer,
                });
              }, 500);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się przechwycić obrazu: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.layerSelector}>
        {Object.entries(mapLayers).map(([key, layer]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.layerButton,
              selectedLayer === key && styles.layerButtonActive,
            ]}
            onPress={() => changeMapLayer(key)}
          >
            <Text
              style={[
                styles.layerButtonText,
                selectedLayer === key && styles.layerButtonTextActive,
              ]}
            >
              {layer.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Ładowanie mapy...</Text>
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'ready') {
                console.log('Map is ready');
              }
            } catch (e) {
              // Ignore
            }
          }}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.instruction}>
          Wyśrodkuj dach na mapie i przechwyt obraz
        </Text>
        <TouchableOpacity style={styles.captureButton} onPress={captureRoofImage}>
          <Text style={styles.captureButtonText}>Przechwyt obraz dachu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  layerSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  layerButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  layerButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  layerButtonText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  layerButtonTextActive: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  instruction: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 10,
  },
  captureButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
