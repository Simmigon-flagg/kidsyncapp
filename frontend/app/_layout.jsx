import { Drawer } from "expo-router/drawer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import LogoutButton from "../components/LogoutButton";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, token, checkAuth } = useAuthStore();
  const [show, setShow] = useState("none");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await checkAuth(); // might throw
      } catch (err) {
        console.error("checkAuth failed:", err);
      } finally {
        setAuthChecked(true);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!authChecked || segments.length === 0) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isSignedIn = !!user && !!token;

    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)"); // default landing after login
    }
  }, [user, token, segments, authChecked]);

  useEffect(() => {
    if (user && token) {
      setShow("block");
    } else {
      setShow("none");
    }
  }, [user, token]);

  if (!authChecked) {
    return (
      <SafeAreaProvider>
        <SafeScreen>
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" />
          </View>
        </SafeScreen>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Drawer
          screenOptions={{ headerShown: true }}
          drawerContent={(props) => (
            <View style={{ flex: 1 }}>
              <DrawerContentScrollView
                {...props}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <DrawerItemList {...props} />
              </DrawerContentScrollView>

              {/* Stick logout button at bottom */}
              {user && token ? (
                <View
                  style={{
                    padding: 16,
                    borderTopWidth: 1,
                    borderColor: "#ccc",
                  }}
                >
                  <LogoutButton />
                </View>
              ) : null}
            </View>
          )}
        >
          {/* Tabs (home/dashboard area) */}
          <Drawer.Screen
            name="(tabs)"
            options={{
              drawerLabel: "Home",
              title: "Home",
              drawerIcon: ({ size, color }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="(profile)"
            options={{
              drawerLabel: "Profile",
              title: "Profile",
              drawerItemStyle: { display: `${show}` },
              drawerIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="(documents)"
            options={{
              drawerLabel: "Documents",
              title: "Documents",
              drawerItemStyle: { display: `${show}` },
              drawerIcon: ({ size, color }) => (
                <Ionicons
                  name="document-text-outline"
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="(visitations)"
            options={{
              drawerLabel: "Visitations",
              title: "Visitations",
              drawerItemStyle: { display: `${show}` },
              drawerIcon: ({ size, color }) => (
                <Ionicons name="calendar-outline" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="(messages)"
            options={{
              drawerLabel: "Messages",
              title: "Messages",
              drawerItemStyle: { display: `${show}` },
              drawerIcon: ({ size, color }) => (
                <Ionicons name="chatbubble-outline" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="(contacts)"
            options={{
              drawerLabel: "Contacts",
              title: "Contacts",
              drawerItemStyle: { display: `${show}` },
              drawerIcon: ({ size, color }) => (
                <Ionicons name="people-outline" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="(auth)"
            options={{
              drawerLabel: "Login",
              title: "Login",
              drawerItemStyle: { display: "none" },
            }}
          />
        </Drawer>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
