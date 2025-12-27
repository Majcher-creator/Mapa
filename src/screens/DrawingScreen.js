import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Svg, { Path, Line, Text as SvgText, G } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

const { width, height } = Dimensions.get('window');
const CANVAS_HEIGHT = height * 0.65;

export default function DrawingScreen({ route, navigation }) {
  const { sketchImage, location } = route.params;
  const [tool, setTool] = useState('pencil'); // pencil, line, dimension
  const [color, setColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [paths, setPaths] = useState([]);
  const [lines, setLines] = useState([]);
  const [dimensions, setDimensions] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [currentLine, setCurrentLine] = useState(null);
  const [currentDimension, setCurrentDimension] = useState(null);
  const viewShotRef = useRef(null);

  // Approximate scale: 1 pixel ≈ 0.1 meter at zoom level 20
  const PIXELS_TO_METERS = 0.1;

  const onGestureEvent = (event) => {
    const { x, y } = event.nativeEvent;

    if (tool === 'pencil') {
      if (currentPath === '') {
        setCurrentPath(`M ${x},${y}`);
      } else {
        setCurrentPath(currentPath + ` L ${x},${y}`);
      }
    } else if (tool === 'line' || tool === 'dimension') {
      if (!currentLine && !currentDimension) {
        // Start line/dimension
        if (tool === 'line') {
          setCurrentLine({ x1: x, y1: y, x2: x, y2: y });
        } else {
          setCurrentDimension({ x1: x, y1: y, x2: x, y2: y });
        }
      } else {
        // Update end point
        if (tool === 'line') {
          setCurrentLine({ ...currentLine, x2: x, y2: y });
        } else {
          setCurrentDimension({ ...currentDimension, x2: x, y2: y });
        }
      }
    }
  };

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === 5) { // END state
      if (tool === 'pencil' && currentPath) {
        setPaths([...paths, { path: currentPath, color, strokeWidth }]);
        setCurrentPath('');
      } else if (tool === 'line' && currentLine) {
        setLines([...lines, { ...currentLine, color, strokeWidth }]);
        setCurrentLine(null);
      } else if (tool === 'dimension' && currentDimension) {
        const distance = calculateDistance(
          currentDimension.x1,
          currentDimension.y1,
          currentDimension.x2,
          currentDimension.y2
        );
        const meters = (distance * PIXELS_TO_METERS).toFixed(2);
        setDimensions([
          ...dimensions,
          { ...currentDimension, color, strokeWidth, meters },
        ]);
        setCurrentDimension(null);
      }
    }
  };

  const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  const undo = () => {
    if (tool === 'pencil' && paths.length > 0) {
      setPaths(paths.slice(0, -1));
    } else if (tool === 'line' && lines.length > 0) {
      setLines(lines.slice(0, -1));
    } else if (tool === 'dimension' && dimensions.length > 0) {
      setDimensions(dimensions.slice(0, -1));
    }
  };

  const clear = () => {
    Alert.alert(
      'Wyczyść wszystko',
      'Czy na pewno chcesz usunąć wszystkie rysunki?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyczyść',
          style: 'destructive',
          onPress: () => {
            setPaths([]);
            setLines([]);
            setDimensions([]);
            setCurrentPath('');
            setCurrentLine(null);
            setCurrentDimension(null);
          },
        },
      ]
    );
  };

  const exportToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak uprawnień', 'Aplikacja potrzebuje dostępu do galerii');
        return;
      }

      const uri = await viewShotRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      
      Alert.alert(
        'Sukces',
        'Szkic zapisany w galerii',
        [
          { text: 'OK' },
          {
            text: 'Powrót do początku',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zapisać: ' + error.message);
    }
  };

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#000000', '#FFFFFF'];
  const strokeWidths = [2, 3, 5, 8];

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView style={styles.container}>
        {/* Drawing Canvas */}
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <View style={styles.canvasContainer}>
            <Image source={{ uri: sketchImage }} style={styles.backgroundImage} />
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
            >
              <View style={styles.drawingLayer}>
                <Svg width={width} height={CANVAS_HEIGHT}>
                  {/* Render saved paths */}
                  {paths.map((item, index) => (
                    <Path
                      key={`path-${index}`}
                      d={item.path}
                      stroke={item.color}
                      strokeWidth={item.strokeWidth}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                  
                  {/* Render current path */}
                  {currentPath && (
                    <Path
                      d={currentPath}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Render saved lines */}
                  {lines.map((line, index) => (
                    <Line
                      key={`line-${index}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={line.color}
                      strokeWidth={line.strokeWidth}
                      strokeLinecap="round"
                    />
                  ))}

                  {/* Render current line */}
                  {currentLine && (
                    <Line
                      x1={currentLine.x1}
                      y1={currentLine.y1}
                      x2={currentLine.x2}
                      y2={currentLine.y2}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Render saved dimensions */}
                  {dimensions.map((dim, index) => (
                    <G key={`dim-${index}`}>
                      <Line
                        x1={dim.x1}
                        y1={dim.y1}
                        x2={dim.x2}
                        y2={dim.y2}
                        stroke={dim.color}
                        strokeWidth={dim.strokeWidth}
                        strokeLinecap="round"
                      />
                      <SvgText
                        x={(dim.x1 + dim.x2) / 2}
                        y={(dim.y1 + dim.y2) / 2 - 10}
                        fill={dim.color}
                        fontSize="16"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {dim.meters}m
                      </SvgText>
                    </G>
                  ))}

                  {/* Render current dimension */}
                  {currentDimension && (
                    <G>
                      <Line
                        x1={currentDimension.x1}
                        y1={currentDimension.y1}
                        x2={currentDimension.x2}
                        y2={currentDimension.y2}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                      />
                      <SvgText
                        x={(currentDimension.x1 + currentDimension.x2) / 2}
                        y={(currentDimension.y1 + currentDimension.y2) / 2 - 10}
                        fill={color}
                        fontSize="16"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {(calculateDistance(
                          currentDimension.x1,
                          currentDimension.y1,
                          currentDimension.x2,
                          currentDimension.y2
                        ) * PIXELS_TO_METERS).toFixed(2)}m
                      </SvgText>
                    </G>
                  )}
                </Svg>
              </View>
            </PanGestureHandler>
          </View>
        </ViewShot>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          {/* Tool Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Narzędzie:</Text>
            <View style={styles.toolButtons}>
              <TouchableOpacity
                style={[styles.toolButton, tool === 'pencil' && styles.toolButtonActive]}
                onPress={() => setTool('pencil')}
              >
                <Text style={styles.toolButtonText}>✏️ Ołówek</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolButton, tool === 'line' && styles.toolButtonActive]}
                onPress={() => setTool('line')}
              >
                <Text style={styles.toolButtonText}>📏 Linia</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolButton, tool === 'dimension' && styles.toolButtonActive]}
                onPress={() => setTool('dimension')}
              >
                <Text style={styles.toolButtonText}>📐 Wymiar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kolor:</Text>
            <View style={styles.colorButtons}>
              {colors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorButton,
                    { backgroundColor: c },
                    color === c && styles.colorButtonActive,
                    c === '#FFFFFF' && styles.colorButtonWhite,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </View>

          {/* Stroke Width Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Grubość:</Text>
            <View style={styles.widthButtons}>
              {strokeWidths.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[
                    styles.widthButton,
                    strokeWidth === w && styles.widthButtonActive,
                  ]}
                  onPress={() => setStrokeWidth(w)}
                >
                  <Text style={styles.widthButtonText}>{w}px</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={undo}>
              <Text style={styles.actionButtonText}>↶ Cofnij</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={clear}>
              <Text style={styles.actionButtonText}>🗑️ Wyczyść</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton} onPress={exportToGallery}>
              <Text style={styles.exportButtonText}>💾 Zapisz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  canvasContainer: {
    width: width,
    height: CANVAS_HEIGHT,
    position: 'relative',
    backgroundColor: '#fff',
  },
  backgroundImage: {
    width: width,
    height: CANVAS_HEIGHT,
    position: 'absolute',
  },
  drawingLayer: {
    width: width,
    height: CANVAS_HEIGHT,
    position: 'absolute',
  },
  toolbar: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  toolButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  toolButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toolButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90E2',
  },
  toolButtonText: {
    fontSize: 13,
    color: '#333',
  },
  colorButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  colorButtonActive: {
    borderColor: '#4A90E2',
    borderWidth: 3,
  },
  colorButtonWhite: {
    borderColor: '#999',
  },
  widthButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  widthButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  widthButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90E2',
  },
  widthButtonText: {
    fontSize: 13,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  exportButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});
