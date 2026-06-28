# Fake Film Roll

A tiny Expo React Native app that turns camera shots or uploaded photos into nostalgic 35mm film frames.

## Features

- Take a photo with the device camera or pick up to 6 images
- Film looks: Kodak summer, Tokyo night, Noir diary
- Templates: Film stamp, 3D pull roll, fake roll, instant cover, film strip, contact sheet
- Native React Native layouts for 2D exports
- Three.js scene via `@react-three/fiber/native` and `expo-gl`
- PNG export/share via `react-native-view-shot` and `expo-sharing`

## Run locally

```bash
npm install
npm start
```

Open the project in Expo Go, an iOS simulator, an Android emulator, or a development build.

Useful scripts:

```bash
npm run ios
npm run android
npm run web
npm run typecheck
```

## Notes

- Rendering is local to the device.
- The export button captures the preview surface and opens the native share sheet.
- Current dependencies target Expo 56 / React Native 0.86.
