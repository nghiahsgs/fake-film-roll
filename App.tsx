import { captureRef } from 'react-native-view-shot';
import { Camera, Download, ImagePlus, RefreshCw, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  DimensionValue,
} from 'react-native';
import ThreeRoll, { FilmLook, Photo } from './src/ThreeRoll';

type Template = 'stamp' | 'roll3d' | 'roll' | 'cover' | 'strip' | 'contact';

const looks: Record<FilmLook, { name: string; bg: string; ink: string; wash: string; warm: string; accent: string }> = {
  gold: { name: 'Kodak summer', bg: '#ead2a2', ink: '#22170d', wash: 'rgba(255,184,74,0.26)', warm: 'rgba(255,126,45,0.18)', accent: '#ffcf5d' },
  tokyo: { name: 'Tokyo night', bg: '#11131b', ink: '#f6ead9', wash: 'rgba(81,202,168,0.24)', warm: 'rgba(255,64,129,0.16)', accent: '#52d3bd' },
  noir: { name: 'Noir diary', bg: '#d9d2c4', ink: '#171513', wash: 'rgba(0,0,0,0.18)', warm: 'rgba(255,255,255,0.08)', accent: '#e1d8c8' },
};

const templates: Record<Template, string> = {
  stamp: 'Film stamp',
  roll3d: '3D pull roll',
  roll: 'Fake roll',
  cover: 'Instant cover',
  strip: 'Film strip',
  contact: 'Contact sheet',
};

const grainDots = Array.from({ length: 90 }, (_, index) => ({
  id: index,
  left: `${Math.random() * 100}%` as DimensionValue,
  top: `${Math.random() * 100}%` as DimensionValue,
  opacity: Math.random() * 0.16 + 0.03,
  size: Math.random() * 2.2 + 0.8,
}));

function id() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function dateLabel() {
  return new Date().toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' });
}

function FilmHoles({ count = 12, vertical = false }: { count?: number; vertical?: boolean }) {
  return (
    <View pointerEvents="none" style={vertical ? styles.verticalHoles : styles.horizontalHoles}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={vertical ? styles.vHolePair : styles.hHolePair}>
          <View style={vertical ? styles.vHole : styles.hHole} />
          <View style={vertical ? styles.vHole : styles.hHole} />
        </View>
      ))}
    </View>
  );
}

function Grain() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {grainDots.map((dot) => (
        <View
          key={dot.id}
          style={[
            styles.grain,
            { left: dot.left, top: dot.top, width: dot.size, height: dot.size, opacity: dot.opacity },
          ]}
        />
      ))}
    </View>
  );
}

function PhotoFrame({ photo, look, small = false }: { photo: Photo; look: FilmLook; small?: boolean }) {
  const palette = looks[look];

  return (
    <View style={[styles.photoFrame, small && styles.photoFrameSmall]}>
      <View style={styles.photoWindow}>
        <Image source={{ uri: photo.uri }} style={styles.photo} />
        <View style={[styles.wash, { backgroundColor: palette.wash }]} />
      </View>
      <Text style={styles.frameMeta}>35MM / {dateLabel()}</Text>
    </View>
  );
}

function StampTemplate({ photos, look, caption }: { photos: Photo[]; look: FilmLook; caption: string }) {
  const photo = photos[0];
  const palette = looks[look];

  return (
    <ImageBackground source={{ uri: photo.uri }} resizeMode="cover" style={styles.artwork}>
      <View style={[styles.wash, { backgroundColor: palette.wash }]} />
      <LinearGradient colors={['rgba(0,0,0,0.68)', 'rgba(0,0,0,0)']} style={styles.topFade} />
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.78)']} style={styles.bottomFade} />
      <View style={styles.stampBorder} />
      <View style={styles.stampInnerBorder} />
      <View style={styles.stampMeta}>
        <Text style={styles.stampTitle}>35MM</Text>
        <Text style={styles.stampLine}>{new Date().toLocaleString().toUpperCase()}</Text>
        <Text style={styles.stampLine}>ISO 400   F/2.8   1/125</Text>
      </View>
      <Text style={styles.sideCode}>FAKE FILM ROLL / EXP. 27 / NO. 04</Text>
      <View style={styles.barcode}>
        {Array.from({ length: 34 }).map((_, index) => (
          <View key={index} style={[styles.bar, { height: index % 4 === 0 ? 58 : 42, opacity: index % 3 === 0 ? 0.9 : 0.48 }]} />
        ))}
      </View>
      <View style={styles.captionBlock}>
        <Text numberOfLines={2} adjustsFontSizeToFit style={styles.stampCaption}>
          {(caption || 'shot on fake film').toUpperCase()}
        </Text>
        <Text style={styles.footerCode}>FRAME 01 / LIGHT LEAK VERIFIED / FAKEFILMROLL.APP</Text>
      </View>
      <Grain />
    </ImageBackground>
  );
}

function StripTemplate({ photos, look, caption }: { photos: Photo[]; look: FilmLook; caption: string }) {
  const palette = looks[look];
  const frames = photos.slice(0, 3);

  return (
    <View style={[styles.artwork, { backgroundColor: palette.bg }]}>
      <Text style={[styles.artTitle, { color: palette.ink }]}>FILM ROLL</Text>
      <Text style={[styles.artMeta, { color: palette.ink }]}>{palette.name.toUpperCase()} / FRAME {String(frames.length).padStart(2, '0')}</Text>
      <View style={styles.stripBand}>
        <FilmHoles count={12} />
        <View style={styles.stripFrames}>
          {frames.map((photo, index) => (
            <View key={photo.id} style={styles.stripFrame}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <View style={[styles.wash, { backgroundColor: palette.wash }]} />
              <Text style={styles.stripNumber}>0{index + 1}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.artCaption, { color: palette.ink }]}>{caption || 'shot on fake film'}</Text>
      <Text style={[styles.artFooter, { color: palette.ink }]}>FAKEFILMROLL.APP</Text>
      <Grain />
    </View>
  );
}

function ContactTemplate({ photos, look, caption }: { photos: Photo[]; look: FilmLook; caption: string }) {
  const palette = looks[look];
  const frames = photos.slice(0, 6);

  return (
    <View style={[styles.artwork, { backgroundColor: palette.bg }]}>
      <Text style={[styles.artTitle, { color: palette.ink }]}>FILM ROLL</Text>
      <Text style={[styles.artMeta, { color: palette.ink }]}>{palette.name.toUpperCase()} / CONTACT SHEET</Text>
      <View style={styles.contactGrid}>
        {frames.map((photo) => (
          <PhotoFrame key={photo.id} photo={photo} look={look} small />
        ))}
      </View>
      <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.artCaption, { color: palette.ink }]}>{caption || 'shot on fake film'}</Text>
      <Grain />
    </View>
  );
}

function RollTemplate({ photos, look, caption }: { photos: Photo[]; look: FilmLook; caption: string }) {
  const palette = looks[look];

  return (
    <LinearGradient colors={['#e3c993', '#b88b52', '#6f4729']} style={styles.artwork}>
      <View style={styles.canisterShadow} />
      <View style={styles.canister}>
        <View style={styles.canCap} />
        <View style={[styles.canLabel, { backgroundColor: palette.accent }]}>
          <Text style={styles.canBig}>250D</Text>
          <Text style={styles.canSmall}>FAKE COLOR NEGATIVE</Text>
        </View>
        <View style={styles.canCap} />
      </View>
      <View style={styles.verticalStrip}>
        <FilmHoles count={15} vertical />
        {photos.slice(0, 4).map((photo, index) => (
          <View key={photo.id} style={styles.verticalFrame}>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <View style={[styles.wash, { backgroundColor: palette.wash }]} />
            <Text style={styles.verticalFrameText}>FRAME {index + 1}</Text>
          </View>
        ))}
      </View>
      <View style={styles.rollLabel}>
        <Text style={styles.rollLabelBig}>UNDEVELOPED</Text>
        <Text style={styles.rollLabelSmall}>3D FILM OBJECT / 36 EXP</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.rollLabelSmall}>{(caption || 'memory roll').toUpperCase()}</Text>
      </View>
      <Grain />
    </LinearGradient>
  );
}

function FilmArtwork({ photos, look, template, caption }: { photos: Photo[]; look: FilmLook; template: Template; caption: string }) {
  const photo = photos[0];
  const palette = looks[look];

  if (template === 'stamp') {
    return <StampTemplate photos={photos} look={look} caption={caption} />;
  }

  if (template === 'roll') {
    return <RollTemplate photos={photos} look={look} caption={caption} />;
  }

  if (template === 'strip' && photos.length > 1) {
    return <StripTemplate photos={photos} look={look} caption={caption} />;
  }

  if (template === 'contact' && photos.length > 1) {
    return <ContactTemplate photos={photos} look={look} caption={caption} />;
  }

  return (
    <View style={[styles.artwork, { backgroundColor: palette.bg }]}>
      <Text style={[styles.artTitle, { color: palette.ink }]}>FILM ROLL</Text>
      <Text style={[styles.artMeta, { color: palette.ink }]}>{palette.name.toUpperCase()} / FRAME 01</Text>
      <View style={styles.coverFrameWrap}>
        <PhotoFrame photo={photo} look={look} />
      </View>
      <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.artCaption, { color: palette.ink }]}>{caption || 'shot on fake film'}</Text>
      <Text style={[styles.artFooter, { color: palette.ink }]}>FAKEFILMROLL.APP</Text>
      <Grain />
    </View>
  );
}

function Segment<T extends string>({
  title,
  options,
  value,
  labels,
  onChange,
}: {
  title: string;
  options: T[];
  value: T;
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.controlGroup}>
      <Text style={styles.controlTitle}>{title}</Text>
      <View style={styles.segmentGrid}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <Pressable key={option} style={[styles.segmentButton, selected && styles.segmentButtonOn]} onPress={() => onChange(option)}>
              <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>{labels[option]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [look, setLook] = useState<FilmLook>('gold');
  const [template, setTemplate] = useState<Template>('stamp');
  const [caption, setCaption] = useState('today felt like a movie');
  const exportRef = useRef<View>(null);
  const lookLabels = useMemo(() => Object.fromEntries(Object.entries(looks).map(([key, value]) => [key, value.name])) as Record<FilmLook, string>, []);

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to take a film photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.92,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPhotos([{ id: id(), uri: asset.uri, name: asset.fileName || 'camera.jpg' }]);
    setTemplate('stamp');
  }

  async function pickPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission needed', 'Allow photo library access to build a film roll.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.92,
    });
    if (result.canceled) return;
    const next = result.assets.slice(0, 6).map((asset) => ({
      id: id(),
      uri: asset.uri,
      name: asset.fileName || 'photo.jpg',
    }));
    setPhotos(next);
    setTemplate(next.length > 1 ? 'roll3d' : 'stamp');
  }

  async function saveImage() {
    if (!photos.length || !exportRef.current) return;
    try {
      const uri = await captureRef(exportRef, {
        format: 'png',
        quality: 1,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Save Fake Film Roll',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Export ready', uri);
      }
    } catch (error) {
      Alert.alert('Could not export image', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.shell} keyboardShouldPersistTaps="handled">
          <View style={styles.top}>
            <View style={styles.mark}>
              <Sparkles color="#ffdd97" size={16} />
              <Text style={styles.markText}>fake film roll</Text>
            </View>
            <Text style={styles.title}>Shoot it. Make it look like film.</Text>
            <Text style={styles.subtitle}>Take one photo or upload a small dump, then export a retro frame from your phone.</Text>
            <View style={styles.quick}>
              <Pressable style={styles.primaryButton} onPress={takePhoto}>
                <Camera color="#180f06" size={20} />
                <Text style={styles.primaryText}>Take photo</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={pickPhotos}>
                <ImagePlus color="#fff4e6" size={20} />
                <Text style={styles.secondaryText}>Upload photos</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.previewShell}>
            <View ref={exportRef} collapsable={false} style={styles.exportSurface}>
              {!photos.length ? (
                <View style={styles.placeholder}>
                  <Camera color="#ffcf5d" size={54} />
                  <Text style={styles.placeholderTitle}>Tap Take photo</Text>
                  <Text style={styles.placeholderText}>or upload images. The film preview appears here instantly.</Text>
                </View>
              ) : template === 'roll3d' ? (
                <ThreeRoll photos={photos} look={look} caption={caption} onSave={saveImage} />
              ) : (
                <FilmArtwork photos={photos} look={look} template={template} caption={caption} />
              )}
            </View>
          </View>

          <View style={styles.controls}>
            <Segment title="1. Pick a vibe" options={Object.keys(looks) as FilmLook[]} value={look} labels={lookLabels} onChange={setLook} />
            <Segment title="2. Pick format" options={Object.keys(templates) as Template[]} value={template} labels={templates} onChange={setTemplate} />
            <View style={styles.controlGroup}>
              <Text style={styles.controlTitle}>3. Caption</Text>
              <TextInput
                value={caption}
                maxLength={38}
                onChangeText={setCaption}
                placeholder="today felt like a movie"
                placeholderTextColor="rgba(255,244,230,0.42)"
                style={styles.captionInput}
              />
            </View>
            <Pressable style={[styles.downloadButton, !photos.length && styles.disabled]} disabled={!photos.length} onPress={saveImage}>
              <Download color="#190f05" size={18} />
              <Text style={styles.downloadText}>Save image</Text>
            </Pressable>
            <Pressable style={[styles.resetButton, !photos.length && styles.disabled]} disabled={!photos.length} onPress={() => setPhotos([])}>
              <RefreshCw color="#fff4e6" size={18} />
              <Text style={styles.resetText}>Start over</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#090806',
  },
  shell: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 38,
    gap: 18,
  },
  top: {
    alignItems: 'center',
    gap: 14,
  },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,221,151,0.22)',
    backgroundColor: 'rgba(255,221,151,0.12)',
  },
  markText: {
    color: '#ffdd97',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    maxWidth: 520,
    color: '#fff4e6',
    fontSize: 46,
    lineHeight: 46,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 430,
    color: 'rgba(255,244,230,0.72)',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: '600',
  },
  quick: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    height: 58,
    borderRadius: 19,
    backgroundColor: '#ffcf5d',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  secondaryButton: {
    flex: 1,
    height: 58,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryText: {
    color: '#180f06',
    fontWeight: '900',
    fontSize: 16,
  },
  secondaryText: {
    color: '#fff4e6',
    fontWeight: '900',
    fontSize: 16,
  },
  previewShell: {
    borderRadius: 34,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.065)',
  },
  exportSurface: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#090806',
  },
  placeholder: {
    aspectRatio: 0.75,
    borderRadius: 28,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,221,151,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 28,
    backgroundColor: 'rgba(255,221,151,0.055)',
  },
  placeholderTitle: {
    color: '#fff4e6',
    fontSize: 26,
    fontWeight: '900',
  },
  placeholderText: {
    maxWidth: 260,
    color: 'rgba(255,244,230,0.65)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  controls: {
    borderRadius: 26,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  controlGroup: {
    gap: 9,
  },
  controlTitle: {
    color: 'rgba(255,244,230,0.56)',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  segmentGrid: {
    gap: 8,
  },
  segmentButton: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  segmentButtonOn: {
    backgroundColor: '#fff0cf',
    borderColor: '#fff0cf',
  },
  segmentText: {
    color: '#fff4e6',
    fontSize: 15,
    fontWeight: '900',
  },
  segmentTextOn: {
    color: '#1b1208',
  },
  captionInput: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#fff4e6',
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
  },
  downloadButton: {
    height: 54,
    borderRadius: 17,
    backgroundColor: '#ffcf5d',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  downloadText: {
    color: '#190f05',
    fontWeight: '900',
    fontSize: 16,
  },
  resetButton: {
    height: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  resetText: {
    color: '#fff4e6',
    fontWeight: '900',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.45,
  },
  artwork: {
    width: '100%',
    aspectRatio: 0.75,
    overflow: 'hidden',
    borderRadius: 28,
  },
  wash: {
    ...StyleSheet.absoluteFill,
  },
  topFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '25%',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
  },
  stampBorder: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: 22,
    bottom: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,238,198,0.78)',
  },
  stampInnerBorder: {
    position: 'absolute',
    left: 35,
    right: 35,
    top: 35,
    bottom: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,238,198,0.34)',
  },
  stampMeta: {
    position: 'absolute',
    top: 52,
    left: 42,
    gap: 4,
  },
  stampTitle: {
    color: 'rgba(255,238,198,0.94)',
    fontSize: 30,
    fontWeight: '900',
  },
  stampLine: {
    color: 'rgba(255,238,198,0.9)',
    fontSize: 12,
    fontWeight: '900',
  },
  sideCode: {
    position: 'absolute',
    right: -124,
    top: 176,
    width: 320,
    color: 'rgba(255,238,198,0.86)',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    transform: [{ rotate: '90deg' }],
  },
  barcode: {
    position: 'absolute',
    left: 42,
    bottom: 86,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
  },
  bar: {
    width: 4,
    backgroundColor: 'rgba(255,238,198,0.88)',
  },
  captionBlock: {
    position: 'absolute',
    left: 42,
    right: 42,
    bottom: 30,
    gap: 8,
  },
  stampCaption: {
    color: 'rgba(255,238,198,0.96)',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  footerCode: {
    color: 'rgba(255,238,198,0.88)',
    fontSize: 10,
    fontWeight: '900',
  },
  grain: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  artTitle: {
    marginTop: 36,
    marginLeft: 28,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
  },
  artMeta: {
    marginLeft: 30,
    marginTop: 3,
    opacity: 0.72,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  coverFrameWrap: {
    marginTop: 44,
    paddingHorizontal: 30,
  },
  photoFrame: {
    borderRadius: 22,
    padding: 12,
    paddingBottom: 40,
    backgroundColor: '#f8f0df',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  photoFrameSmall: {
    width: '48%',
    padding: 8,
    paddingBottom: 25,
    borderRadius: 16,
  },
  photoWindow: {
    aspectRatio: 0.86,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#20170f',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  frameMeta: {
    position: 'absolute',
    left: 16,
    bottom: 12,
    color: '#2d2118',
    fontSize: 11,
    fontWeight: '900',
  },
  artCaption: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 54,
    textAlign: 'center',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
  },
  artFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    textAlign: 'center',
    opacity: 0.55,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stripBand: {
    marginTop: 52,
    marginHorizontal: 24,
    height: 220,
    borderRadius: 20,
    backgroundColor: '#12100e',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  horizontalHoles: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  hHolePair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  hHole: {
    width: 20,
    height: 13,
    borderRadius: 4,
    backgroundColor: '#080705',
  },
  stripFrames: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 40,
    height: 142,
  },
  stripFrame: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2d2118',
  },
  stripNumber: {
    position: 'absolute',
    left: 8,
    bottom: 6,
    color: '#f3dbae',
    fontSize: 11,
    fontWeight: '900',
  },
  contactGrid: {
    marginTop: 28,
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  canisterShadow: {
    position: 'absolute',
    top: 142,
    alignSelf: 'center',
    width: 250,
    height: 88,
    borderRadius: 80,
    backgroundColor: 'rgba(0,0,0,0.22)',
    transform: [{ scaleX: 1.25 }],
  },
  canister: {
    marginTop: 84,
    alignSelf: 'center',
    width: 288,
    height: 96,
    borderRadius: 40,
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 13 },
  },
  canCap: {
    width: 34,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#050505',
  },
  canLabel: {
    flex: 1,
    height: 68,
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  canBig: {
    color: '#111',
    fontSize: 34,
    fontWeight: '900',
  },
  canSmall: {
    color: '#111',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  verticalStrip: {
    alignSelf: 'center',
    marginTop: 12,
    width: 176,
    height: 350,
    borderRadius: 16,
    backgroundColor: '#101010',
    overflow: 'hidden',
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
  },
  verticalHoles: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  vHolePair: {
    justifyContent: 'space-between',
  },
  vHole: {
    width: 13,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#030303',
  },
  verticalFrame: {
    width: 108,
    height: 66,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#332211',
  },
  verticalFrameText: {
    position: 'absolute',
    left: 6,
    bottom: 5,
    color: '#ffe1aa',
    fontSize: 8,
    fontWeight: '900',
  },
  rollLabel: {
    position: 'absolute',
    left: 72,
    right: 72,
    bottom: 48,
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#17110b',
    transform: [{ rotate: '3deg' }],
  },
  rollLabelBig: {
    color: '#f7c543',
    fontSize: 27,
    fontWeight: '900',
  },
  rollLabelSmall: {
    color: '#fff1ce',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
