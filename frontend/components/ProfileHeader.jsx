import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Button,
  Alert,
  Platform,
} from "react-native";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import styles from "../assets/styles/profile.styles";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import dateUtils  from "../lib/utils";
const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://192.168.1.238:3000";

async function uriToBase64(uri) {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
}

export default function ProfileHeader() {
  const { user, token, setUser } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localImage, setLocalImage] = useState(null); // <-- local preview

  const updateProfileImage = async (newUri) => {
    try {
      const base64 = await uriToBase64(newUri);

      const response = await fetch(`${BASE_URL}/api/v1/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileBase64: base64,
          fileName: "profile.png",
          fileType: "image/png",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user); // sync backend update
      } else {
        Alert.alert("Error", data.message || "Failed to update profile image");
      }
    } catch (err) {
      console.error("Upload failed", err);
      Alert.alert("Error", "Upload failed");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUri = result.assets[0].uri;
      setLocalImage(newUri); // show immediately
      setLoading(true);
      try {
        await updateProfileImage(newUri);
      } finally {
        setLoading(false);
        setModalVisible(false);
      }
    }
  };

  const displayedImage = localImage || `${BASE_URL}${user?.profileImage}?ts=${Date.now()}`;

  return (
    <View style={styles.profileHeader}>
      {/* Profile Image with Edit Icon */}
      <View style={{ position: "relative" }}>
        <Image source={{ uri: displayedImage }} style={styles.profileImage} />

        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            backgroundColor: "white",
            borderRadius: 20,
            padding: 4,
          }}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="pencil" size={16} color="black" />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Text style={styles.name}>{user?.name.toUpperCase()}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.memberSince}>
          Joined {dateUtils.formatDate(user?.createdAt)}
        </Text>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 12,
              width: "80%",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 10 }}>
              Update Profile Image
            </Text>
            <Image source={{ uri: displayedImage }} style={styles.profileImage} />
            <Button
              title="Choose New Image"
              onPress={pickImage}
              disabled={loading}
            />
            <View style={{ marginTop: 10 }}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
