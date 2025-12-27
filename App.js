import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import SketchScreen from './src/screens/SketchScreen';
import DrawingScreen from './src/screens/DrawingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'RoofSketch - Wyszukaj lokalizację' }}
          />
          <Stack.Screen 
            name="Map" 
            component={MapScreen}
            options={{ title: 'Wybierz dach' }}
          />
          <Stack.Screen 
            name="Sketch" 
            component={SketchScreen}
            options={{ title: 'Szkic dachu' }}
          />
          <Stack.Screen 
            name="Drawing" 
            component={DrawingScreen}
            options={{ title: 'Rysuj wymiary' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
