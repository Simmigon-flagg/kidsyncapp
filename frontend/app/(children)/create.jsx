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
import React, { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import styles from "../../assets/styles/create.styles";
import COLORS from "../../constants/colors";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://192.168.1.238:3000";

function parseDateFromMDY(input) {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  // Accept MM/DD/YYYY or M/D/YYYY
  const m = String(input).trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const month = parseInt(m[1], 10);
    const day = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }
  // Try ISO / Date constructor fallback
  const iso = new Date(input);
  return isNaN(iso.getTime()) ? null : iso;
}

function formatDate(value) {
  if (!value && value !== 0) return "";
  const d = value instanceof Date ? value : parseDateFromMDY(value);
  if (!d) return String(value);
  return d.toLocaleDateString();
}

export default function Create() {
  const [name, setName] = useState("Daril Flagg");

  // keep state flexible: can be Date (mobile picker) or string (web input)
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    // parse initial string into Date if possible, else keep string
    const init = "09/06/1980";
    const parsed = parseDateFromMDY(init);
    return parsed || init;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickImage = async (source = "library") => {
    try {
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
      const picked = await pickImage("library");
      if (picked) {
        setImage(picked.uri);
        setImageBase64(picked.base64);
      }
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      // Android: dismiss picker after selection/dismiss
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert("Error", "Name is required");
      return;
    }

    // convert dateOfBirth (Date or string) into an ISO string if possible
    let dobIso;
    if (dateOfBirth instanceof Date) {
      dobIso = dateOfBirth.toISOString();
    } else {
      const parsed = parseDateFromMDY(dateOfBirth);
      if (parsed) dobIso = parsed.toISOString();
      else dobIso = null; // invalid date input
    }

    if (!dobIso) {
      Alert.alert("Error", "Please enter a valid date of birth");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const user = JSON.parse(await AsyncStorage.getItem("user"));

      const body = { owner: user._id, name, dateOfBirth: dobIso };

      if (imageBase64) {
        body.fileBase64 = imageBase64;
        body.fileName = image.split("/").pop();
        body.fileType = `image/${body.fileName.split(".").pop()}`;
      }

      const response = await fetch(`${BASE_URL}/api/v1/children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert("Success", "Your child was added");
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
            <Text style={styles.title}>Add Child</Text>
          </View>

          <View style={styles.form}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Child Name</Text>
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

            {/* Date of Birth */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date of Birth</Text>

              {Platform.OS === "web" ? (
                // simple text input fallback on web (user types MM/DD/YYYY)
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={COLORS.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={COLORS.placeholderText}
                    value={
                      // show formatted if Date, else raw string
                      dateOfBirth instanceof Date ? formatDate(dateOfBirth) : String(dateOfBirth || "")
                    }
                    onChangeText={(t) => setDateOfBirth(t)}
                  />
                </View>
              ) : (
                // mobile: show a pressable row that opens native picker
                <>
                  <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={COLORS.textSecondary}
                      style={styles.inputIcon}
                    />
                    <Text style={[styles.input, { paddingVertical: 12 }]}>
                      {formatDate(dateOfBirth)}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={dateOfBirth instanceof Date ? dateOfBirth : new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      maximumDate={new Date()}
                      onChange={handleDateChange}
                    />
                  )}
                </>
              )}
            </View>

            {/* Image */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Child Image</Text>
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
                    <Text style={styles.placeholderText}>Tap to select image</Text>
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
