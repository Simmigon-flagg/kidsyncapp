import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export function CustomDrawerContent(props) {
  const navigation = useNavigation();

  return (
    <DrawerContentScrollView {...props}>
      {/* Home / Tabs */}
      <DrawerItem
        label="Home"
        icon={({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />}
        onPress={() => navigation.push("/(tabs)")}
      />

      {/* Profile inside tabs */}
      <DrawerItem
        label="Profile"
        icon={({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />}
        onPress={() => navigation.push("/(tabs)/profile")}
      />

      {/* Documents */}
      <DrawerItem
        label="Documents"
        icon={({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />}
        onPress={() => navigation.push("/(documents)")}
      />
    </DrawerContentScrollView>
  );
}
