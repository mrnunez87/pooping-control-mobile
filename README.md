# 💩 Pooping Control Mobile App

A React Native mobile app for tracking daily pooping habits with visual calendar indicators.

## Features

- 📅 Visual calendar with emoji indicators
- ✅ Track successful poops
- 💩 Track accidents
- ✗ Track failed attempts
- 📱 Offline-first with local storage
- 🎨 Beautiful, intuitive interface

## Quick Start

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npx expo start
   ```

3. **Test on iPhone:**
   - Install Expo Go from App Store
   - Scan QR code with iPhone Camera app
   - App opens in Expo Go

### Building for Production

#### Option 1: EAS Build (Recommended)
```bash
# Login to EAS
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

#### Option 2: Local Build
```bash
# Build for iOS (requires Xcode)
npx expo run:ios

# Build for Android (requires Android Studio)
npx expo run:android
```

## Project Structure

```
pooping-control-mobile/
├── App.js                 # Main app component
├── app.json              # Expo configuration
├── eas.json              # EAS build configuration
├── assets/               # Images and icons
└── .github/workflows/    # GitHub Actions
```

## Data Storage

- **Local Storage**: Uses AsyncStorage for offline data
- **No Backend Required**: All data stored on device
- **Export Option**: Can export data when needed

## Deployment

### GitHub Actions
- Automatic builds on every push
- Deploys to GitHub Pages for web version
- Ready for TestFlight deployment

### TestFlight
1. Build with EAS: `eas build --platform ios`
2. Upload to App Store Connect
3. Add to TestFlight
4. Install on iPhone

## Technologies Used

- **React Native** - Mobile app framework
- **Expo** - Development platform
- **AsyncStorage** - Local data storage
- **react-native-calendars** - Calendar component
- **EAS Build** - Cloud building service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use for your own pooping tracking needs! 💩
