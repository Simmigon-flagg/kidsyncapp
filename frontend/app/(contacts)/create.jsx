import {
  View,
  Text,
  KeyboardAvoidingView,
  Image,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
} from "react-native";
import { useState } from "react";
import styles from "../../assets/styles/create.styles";
import COLORS from "../../constants/colors";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

export default function Create() {
  const [name, setName] = useState("Simmigon");
  const [phone, setPhone] = useState("123456789");
  const [email, setEmail] = useState("email@email.com");
  const [relationship, setRelationship] = useState("Uncle");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Unified image picker
  const pickImage = async (source = "library") => {
    try {
      // Request permissions
      if (Platform.OS !== "web") {
        let permissionResult;
        if (source === "camera") {
          permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        } else {
          permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        }

        if (permissionResult.status !== "granted") {
          Alert.alert(
            "Permission Denied",
            `We need ${source} permissions to upload an image`
          );
          return null;
        }
      }

      // Launch picker
      let result;
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
          base64: true,
        });
      }

      if (result.canceled) return null;

      const pickedImage = result.assets[0];
      return { uri: pickedImage.uri, base64: pickedImage.base64 };
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "There was a problem selecting your image");
      return null;
    }
  };

  // Wrapper to set state
  const handlePickImage = async () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Camera", "Photo Library"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            const picked = await pickImage("camera");
            if (picked) {
              setImage(picked.uri);
              setImageBase64(picked.base64);
            }
          } else if (buttonIndex === 2) {
            const picked = await pickImage("library");
            if (picked) {
              setImage(picked.uri);
              setImageBase64(picked.base64);
            }
          }
        }
      );
    } else {
      // Android or web: just pick from library
      const picked = await pickImage("library");
      if (picked) {
        setImage(picked.uri);
        setImageBase64(picked.base64);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name || !phone) {
      Alert.alert("Error", "Name and phone are required");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const user = JSON.parse(await AsyncStorage.getItem("user"));

      const body = { owner: user._id, name, phone, email, relationship };

      if (imageBase64) {
        body.fileBase64 = imageBase64;
        body.fileName = image.split("/").pop();
        body.fileType = `image/${body.fileName.split(".").pop()}`;
      }

      const response = await fetch(`${BASE_URL}/api/v1/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert("Success", "Your contact was added");
      router.push("/");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Contact</Text>
            <Text style={styles.subtitle}>This contact will be shared</Text>
          </View>

          <View style={styles.form}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter contact name"
                  placeholderTextColor={COLORS.placeholderText}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="###-###-####"
                  placeholderTextColor={COLORS.placeholderText}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="email@gmail.com"
                  placeholderTextColor={COLORS.placeholderText}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Relationship */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Relationship</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Grandma"
                  placeholderTextColor={COLORS.placeholderText}
                  value={relationship}
                  onChangeText={setRelationship}
                />
              </View>
            </View>

            {/* Image */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Image</Text>
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={handlePickImage}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons
                      name="image-outline"
                      size={40}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.placeholderText}>
                      Tap to select image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
