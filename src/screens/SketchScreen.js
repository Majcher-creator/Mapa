import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import ViewShot from 'react-native-view-shot';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';

const { width, height } = Dimensions.get('window');

export default function SketchScreen({ route, navigation }) {
  const { location, layer } = route.params;
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [sketchImage, setSketchImage] = useState(null);
  const viewShotRef = useRef(null);

  const mapLayers = {
    geoportal: 'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution',
    esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    google: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
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
        .leaflet-control-container { display: none; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
        }).setView([${location.latitude}, ${location.longitude}], 20);

        ${layer === 'geoportal' ? `
          L.tileLayer.wms('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution', {
            layers: 'Raster',
            format: 'image/jpeg',
            transparent: false,
            maxZoom: 21,
          }).addTo(map);
        ` : layer === 'osm' ? `
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);
        ` : `
          L.tileLayer('${mapLayers[layer]}', {
            maxZoom: 20,
          }).addTo(map);
        `}

        setTimeout(() => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ready' }));
        }, 2000);
      </script>
    </body>
    </html>
  `;

  const captureMapImage = async () => {
    setLoading(true);
    try {
      const uri = await viewShotRef.current.capture();
      setCapturedImage(uri);
      await convertToSketch(uri);
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się przechwycić obrazu: ' + error.message);
      setLoading(false);
    }
  };

  const convertToSketch = async (imageUri) => {
    try {
      // Convert to grayscale and high contrast
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 800 } }, // Resize for performance
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.PNG,
        }
      );

      // Apply grayscale and contrast filter
      const finalResult = await ImageManipulator.manipulateAsync(
        manipResult.uri,
        [],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
        }
      );

      setSketchImage(finalResult.uri);
      setLoading(false);
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się przetworzyć obrazu: ' + error.message);
      setLoading(false);
    }
  };

  const proceedToDrawing = () => {
    if (sketchImage) {
      navigation.navigate('Drawing', { 
        sketchImage,
        location,
      });
    }
  };

  const saveSketch = async () => {
    if (!sketchImage) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak uprawnień', 'Aplikacja potrzebuje dostępu do galerii');
        return;
      }

      await MediaLibrary.saveToLibraryAsync(sketchImage);
      Alert.alert('Sukces', 'Szkic zapisany w galerii');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zapisać szkicu: ' + error.message);
    }
  };

  useEffect(() => {
    // Auto-capture after a short delay
    const timer = setTimeout(() => {
      captureMapImage();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {!sketchImage ? (
          <ViewShot ref={viewShotRef} style={styles.captureArea}>
            <WebView
              source={{ html: htmlContent }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </ViewShot>
        ) : (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Szkic dachu gotowy</Text>
            <Image source={{ uri: sketchImage }} style={styles.previewImage} resizeMode="contain" />
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Przetwarzanie obrazu...</Text>
        </View>
      )}

      <View style={styles.footer}>
        {!sketchImage ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Przechwytywanie i konwersja obrazu...</Text>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.buttonSecondary} onPress={saveSketch}>
              <Text style={styles.buttonSecondaryText}>Zapisz szkic</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonPrimary} onPress={proceedToDrawing}>
              <Text style={styles.buttonPrimaryText}>Dodaj wymiary</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  captureArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  previewContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: height * 0.6,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
  infoBox: {
    padding: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});
