import { Canvas, useFrame } from '@react-three/fiber/native';
import Slider from '@react-native-community/slider';
import { Download } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import * as THREE from 'three';

export type FilmLook = 'gold' | 'tokyo' | 'noir';
export type Photo = { id: string; uri: string; name: string };

type Props = {
  photos: Photo[];
  look: FilmLook;
  caption: string;
  onSave: () => void;
};

const lookColors: Record<FilmLook, { label: string; rim: string; labelColor: string; strip: string }> = {
  gold: { label: 'KODAK SUMMER', rim: '#ffb24a', labelColor: '#f7c84d', strip: '#161310' },
  tokyo: { label: 'TOKYO NIGHT', rim: '#36e0c3', labelColor: '#47d8c2', strip: '#10161a' },
  noir: { label: 'NOIR DIARY', rim: '#f0e7d5', labelColor: '#d8d0c1', strip: '#111111' },
};

function Dust() {
  const dots = useMemo(() => Array.from({ length: 70 }, () => ({
    position: [
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 5 + 0.4,
      (Math.random() - 0.5) * 4,
    ] as [number, number, number],
    size: Math.random() * 0.012 + 0.004,
    opacity: Math.random() * 0.45 + 0.12,
  })), []);

  return (
    <group>
      {dots.map((dot, index) => (
        <mesh key={index} position={dot.position}>
          <sphereGeometry args={[dot.size, 8, 8]} />
          <meshBasicMaterial color="#ffe2aa" transparent opacity={dot.opacity} />
        </mesh>
      ))}
    </group>
  );
}

function FilmScene({ look, pull, rotation }: { look: FilmLook; pull: number; rotation: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const canRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Group>(null);
  const colors = lookColors[look];
  const stripScale = 0.42 + (pull / 100) * 0.78;

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation + state.clock.elapsedTime * 0.16;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.035;
    }
    if (canRef.current) {
      canRef.current.rotation.x += delta * (1.4 + pull / 45);
    }
    if (dustRef.current) {
      dustRef.current.rotation.y -= delta * 0.18;
    }
  });

  return (
    <>
      <color attach="background" args={['#0b0907']} />
      <fog attach="fog" args={['#0b0907', 7, 15]} />
      <hemisphereLight args={['#ffefd0', '#161616', 1.35]} />
      <directionalLight position={[-3.5, 6, 5]} intensity={4.5} castShadow />
      <pointLight position={[3.4, 2.2, 2.2]} intensity={18} distance={8} color={colors.rim} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#3a2416" roughness={0.72} metalness={0.04} />
      </mesh>

      <group ref={groupRef} rotation={[-0.15, 0, 0]}>
        <mesh
          position={[0, 2.65, 0.03]}
          rotation={[0, 0, Math.PI / 2]}
          ref={canRef}
          castShadow
        >
          <cylinderGeometry args={[0.76, 0.76, 2.55, 80]} />
          <meshPhysicalMaterial color="#15110e" roughness={0.28} metalness={0.78} clearcoat={0.65} />
        </mesh>
        <mesh position={[0, 2.65, 0.04]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.775, 0.775, 1.72, 80, 1, true, 0.2, Math.PI * 1.35]} />
          <meshStandardMaterial color={colors.labelColor} roughness={0.48} side={THREE.DoubleSide} />
        </mesh>
        {[-1.36, 1.36].map((x) => (
          <mesh key={x} position={[x, 2.65, 0.03]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 0.14, 80]} />
            <meshStandardMaterial color="#050505" roughness={0.35} metalness={0.55} />
          </mesh>
        ))}

        <group position={[0, 1.15 - (pull / 100) * 1.9, -0.25 + (pull / 100) * 0.5]} rotation={[-0.08, 0, 0]} scale={[1, stripScale, 1]}>
          <mesh castShadow receiveShadow>
            <planeGeometry args={[2.25, 6.9, 18, 80]} />
            <meshPhysicalMaterial color={colors.strip} side={THREE.DoubleSide} roughness={0.35} clearcoat={0.82} clearcoatRoughness={0.18} />
          </mesh>
          {Array.from({ length: 7 }).map((_, index) => {
            const y = 2.72 - index * 0.86;
            return (
              <mesh key={index} position={[0, y, 0.012]}>
                <planeGeometry args={[1.35, 0.62]} />
                <meshBasicMaterial color={index % 2 ? colors.labelColor : '#f5e0b3'} transparent opacity={0.9} />
              </mesh>
            );
          })}
          {Array.from({ length: 18 }).map((_, index) => {
            const y = 3.15 - index * 0.37;
            return (
              <group key={index}>
                <mesh position={[-0.97, y, 0.018]}>
                  <boxGeometry args={[0.18, 0.12, 0.02]} />
                  <meshBasicMaterial color="#020202" />
                </mesh>
                <mesh position={[0.97, y, 0.018]}>
                  <boxGeometry args={[0.18, 0.12, 0.02]} />
                  <meshBasicMaterial color="#020202" />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      <group ref={dustRef}>
        <Dust />
      </group>
    </>
  );
}

export default function ThreeRoll({ photos, look, caption, onSave }: Props) {
  const [pull, setPull] = useState(62);
  const [rotation, setRotation] = useState(0);
  const lastXRef = useRef(0);
  const colors = lookColors[look];
  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        lastXRef.current = event.nativeEvent.pageX;
      },
      onPanResponderMove: (event) => {
        const x = event.nativeEvent.pageX;
        const dx = x - lastXRef.current;
        lastXRef.current = x;
        setRotation((current) => current + dx * 0.008);
      },
    }),
    [],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Canvas shadows camera={{ position: [0.2, 2.0, 8.2], fov: 35 }}>
          <FilmScene look={look} pull={pull} rotation={rotation} />
        </Canvas>
      </View>
      <View style={styles.hud}>
        <View style={styles.hudTextWrap}>
          <Text style={styles.hudTitle}>{colors.label}</Text>
          <Text style={styles.hudMeta}>{photos.length} frame reel / {caption || 'memory roll'}</Text>
        </View>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Pull film</Text>
          <Slider
            style={styles.slider}
            minimumValue={18}
            maximumValue={100}
            value={pull}
            minimumTrackTintColor={colors.labelColor}
            maximumTrackTintColor="rgba(255,255,255,0.22)"
            thumbTintColor={colors.labelColor}
            onValueChange={setPull}
          />
        </View>
        <Pressable style={styles.saveButton} onPress={onSave}>
          <Download color="#190f05" size={16} />
          <Text style={styles.saveText}>Save 3D</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 0.72,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#090806',
  },
  canvas: {
    ...StyleSheet.absoluteFill,
  },
  hud: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 18,
    padding: 12,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  hudTextWrap: {
    gap: 2,
  },
  hudTitle: {
    color: '#fff4e6',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  hudMeta: {
    color: 'rgba(255,244,230,0.68)',
    fontSize: 12,
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderLabel: {
    width: 72,
    color: '#ffdf9e',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  slider: {
    flex: 1,
    height: 34,
  },
  saveButton: {
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ffcf5d',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveText: {
    color: '#190f05',
    fontSize: 14,
    fontWeight: '900',
  },
});
