module.exports = () => ({
  expo: {
    name: "kidsyncapp",
    slug: "kidsyncapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "kidsyncapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to upload images.",
        NSCameraUsageDescription: "This app needs access to your camera to take photos.",
        NSPhotoLibraryAddUsageDescription: "This app needs permission to save photos to your library."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      [
        "expo-router",
        {
          origin: process.env.NODE_ENV === "development"
            ? "http://localhost:8081"
            : "https://kidsyncapp.expo.app"
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "003ed8b5-4bfa-4907-b5b8-61fb557a7a65"
      }
    }
  }
})
