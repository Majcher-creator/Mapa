import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';

export default function HomeScreen({ navigation }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
    return status === 'granted';
  };

  const searchByAddress = async () => {
    if (!address.trim()) {
      Alert.alert('Błąd', 'Wprowadź adres do wyszukania');
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim OpenStreetMap API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          address: data[0].display_name,
        };
        navigation.navigate('Map', { location });
      } else {
        Alert.alert('Nie znaleziono', 'Nie udało się znaleźć podanego adresu');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas wyszukiwania: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = async () => {
    let hasPermission = locationPermission;
    
    if (!hasPermission) {
      hasPermission = await requestLocationPermission();
    }

    if (!hasPermission) {
      Alert.alert('Brak uprawnień', 'Aplikacja potrzebuje dostępu do lokalizacji');
      return;
    }

    setLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const location = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: 'Aktualna lokalizacja',
      };
      navigation.navigate('Map', { location });
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się pobrać lokalizacji: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>RoofSketch</Text>
        <Text style={styles.subtitle}>Szkicuj dachy z ortofotomapy</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Wyszukaj adres:</Text>
        <TextInput
          style={styles.input}
          placeholder="np. Plac Defilad 1, Warszawa"
          value={address}
          onChangeText={setAddress}
          onSubmitEditing={searchByAddress}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={searchByAddress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Wyszukaj</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>lub</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]}
          onPress={useCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#4A90E2" />
          ) : (
            <Text style={styles.secondaryButtonText}>Użyj mojej lokalizacji GPS</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Wybierz lokalizację, aby rozpocząć tworzenie szkicu dachu
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});
