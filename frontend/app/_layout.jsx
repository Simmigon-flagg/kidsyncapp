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
  const [authChecked, setAuthChecked] = useState(false);

  const [show, setShow] = useState("none");

  // Bootstrap auth once
  useEffect(() => {
    const bootstrap = async () => {
      try {
        await checkAuth();
      } catch (err) {
        console.error("checkAuth failed:", err);
      } finally {
        setAuthChecked(true);
      }
    };
    bootstrap();
  }, []);

  // Show/hide drawer items based on login
  useEffect(() => {
    if (user && token) setShow("block");
    else setShow("none");
  }, [user, token]);

useEffect(() => {
  if (!authChecked || segments.length === 0) return;

  const inAuthGroup = segments[0] === "(auth)";
  const isSignedIn = !!user && !!token;

  // Only redirect to auth if not signed in and trying to access protected route
  if (!isSignedIn && !inAuthGroup) {
    router.replace("/(auth)");
    return;
  }

  // Optional: block login page if signed in
  if (isSignedIn && inAuthGroup) {
    router.replace("/(dashboard)");
    return;
  }

  // Otherwise, do nothing and stay on current page
}, [authChecked, segments, user, token]);


  if (!authChecked) {
    return (
      <SafeAreaProvider>
        <SafeScreen>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
              <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
                <DrawerItemList {...props} />
              </DrawerContentScrollView>

              {user && token && (
                <View style={{ padding: 16, borderTopWidth: 1, borderColor: "#ccc" }}>
                  <LogoutButton />
                </View>
              )}
            </View>

          )}
        >
          {/* Dashboard & other screens */}
          <Drawer.Screen
            name="(dashboard)/index"
            options={{
              drawerLabel: "Dashboard",
              title: "Dashboard",
              drawerIcon: ({ size, color }) => <Ionicons name="home-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="(dashboard)/create"
            options={{
              drawerLabel: "Dashboard",
              title: "Dashboard",
               drawerItemStyle: { display: "none" },
              drawerIcon: ({ size, color }) => <Ionicons name="home-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="(profile)"
            options={{
              drawerLabel: "Profile",
              title: "Profile",
              drawerItemStyle: { display: show },
              drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="(documents)"
            options={{
              drawerLabel: "Documents",
              title: "Documents",
              drawerItemStyle: { display: show },
              drawerIcon: ({ size, color }) => <Ionicons name="document-text-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="(visitations)"
            options={{
              drawerLabel: "Visitations",
              title: "Visitations",
              drawerItemStyle: { display: show },
              drawerIcon: ({ size, color }) => <Ionicons name="calendar-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="(messages)"
            options={{
              drawerLabel: "Messages",
              title: "Messages",
              drawerItemStyle: { display: show },
              drawerIcon: ({ size, color }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="(contacts)"
            options={{
              drawerLabel: "Contacts",
              title: "Contacts",
              drawerItemStyle: { display: show },
              drawerIcon: ({ size, color }) => <Ionicons name="people-outline" size={size} color={color} />,
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
          <Drawer.Screen
            name="contact/[id]"
            options={{
              drawerLabel: "Contact",
              title: "Contact",
              drawerItemStyle: { display: "none" },
            }}
          />
          <Drawer.Screen
            name="contact/[id]/index"
            options={{
              drawerLabel: "Contact",
              title: "Contact",
              drawerItemStyle: { display: "none" },
            }}
          />
          <Drawer.Screen
            name="contact/[id]/EditContactModal"
            options={{
              drawerLabel: "Contact",
              title: "Contact",
              drawerItemStyle: { display: "none" },
            }}
          />
        </Drawer>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
