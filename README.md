# FlexTrack 🏋️

An AI-powered workout tracking app built with React Native and Expo. FlexTrack uses Google's Gemini AI to generate personalized workout plans based on your available equipment, preferred training split, and fitness goals.

## Features

- 🤖 **AI-Powered Workout Generation**: Get personalized workout plans using Gemini AI
- 📱 **Cross-Platform**: Built with React Native and Expo for iOS and Android
- 🔐 **Secure Authentication**: Email/password and Google Sign-In via Firebase
- 💾 **Local Storage**: Workout plans cached locally for offline access
- 📊 **Progress Tracking**: Log your workouts and track your fitness journey
- 🎨 **Modern UI**: Sleek dark theme with smooth animations
- ⚙️ **Customizable**: Advanced equipment selection, split preferences, and workout notes

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/FlexTrack.git
cd FlexTrack
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Then fill in your actual API keys and configuration:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Gemini API Key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Google Sign-In Web Client ID
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
```

### 4. Add Firebase Configuration

Download your `google-services.json` file from the [Firebase Console](https://console.firebase.google.com/):

1. Go to Project Settings > General
2. Under "Your apps", select your Android app
3. Download `google-services.json`
4. Place it in the root directory of the project

**Note**: This file is gitignored for security and should never be committed to version control.

### 5. Configure Android Local Properties

Create `android/local.properties` with your Android SDK path:

```properties
sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

**Note**: This file is also gitignored and should not be committed.

## Running the App

### Development Mode

Start the Expo development server:

```bash
npx expo start
```

### Run on Android

```bash
npx expo run:android
```

### Run on iOS (macOS only)

```bash
npx expo run:ios
```

## Project Structure

```
FlexTrack/
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context providers (Auth, etc.)
│   ├── data/           # Static data (equipment list, etc.)
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # App screens
│   ├── services/       # API services (Firebase, Gemini, Storage)
│   └── firebaseConfig.ts
├── assets/             # Images, fonts, icons
├── .env.example        # Environment variables template
├── app.json           # Expo configuration
└── package.json       # Dependencies
```

## Security Notes

⚠️ **IMPORTANT**: Never commit the following files to version control:
- `.env` - Contains your API keys
- `google-services.json` - Contains Firebase configuration
- `android/local.properties` - Contains local SDK paths

These files are already included in `.gitignore` to prevent accidental commits.

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Local Storage**: AsyncStorage
- **AI**: Google Gemini API
- **Navigation**: React Navigation
- **Animations**: React Native Reanimated

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
