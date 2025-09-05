import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../../constants/colors";
import * as ImagePicker from "expo-image-picker";

export default function EditContactModal({
  visible,
  onClose,
  contact,
  onSave
}) {
  const [name, setName] = useState(contact?.name || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [email, setEmail] = useState(contact?.email || "");
  const [relationship, setRelationship] = useState(contact?.relationship || "");
  const [image, setImage] = useState(contact?.profileImage || null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  const BASE_URL =
    Platform.OS === "android"
      ? "http://10.0.2.2:3000"
      : "http://localhost:3000";

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setPhone(contact.phone);
      setEmail(contact.email);
      setRelationship(contact.relationship);

      // Show uploaded image if it exists, otherwise fallback
      if (contact.imageFileId) {
        setImage(`${BASE_URL}/api/v1/contacts/${contact._id}/image`);
      } else {
        setImage(contact.profileImage); // fallback DiceBear avatar
      }
    }
  }, [contact]);

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

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.5,
              base64: true,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.5,
              base64: true,
            });

      if (result.canceled) return null;

      const pickedImage = result.assets[0];
      setImage(pickedImage.uri);
      setImageBase64(pickedImage.base64);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Camera", "Photo Library"],
          cancelButtonIndex: 0,
        },
        async (index) => {
          if (index === 1) await pickImage("camera");
          else if (index === 2) await pickImage("library");
        }
      );
    } else {
      await pickImage("library");
    }
  };

  const handleSave = async () => {
    if (!name || !phone) {
      Alert.alert("Error", "Name and phone are required");
      return;
    }
    setLoading(true);
    const updated = { name, phone, email, relationship };
    if (imageBase64) {
      updated.fileBase64 = imageBase64;
      updated.fileName = image.split("/").pop();
      updated.fileType = `image/${updated.fileName.split(".").pop()}`;
    }

    await onSave(updated);
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Contact</Text>
          <ScrollView contentContainerStyle={styles.form}>
            {/* Image */}
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
                    size={50}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.placeholderText}>
                    Tap to select image
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter name"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="123-456-7890"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
              />
            </View>

            {/* Relationship */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship</Text>
              <TextInput
                style={styles.input}
                value={relationship}
                onChangeText={setRelationship}
                placeholder="Friend, Uncle..."
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancel]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.save]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },
  form: { paddingBottom: 20 },
  imagePicker: { alignSelf: "center", marginBottom: 20 },
  previewImage: { width: 100, height: 100, borderRadius: 50 },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
  },
  placeholderText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 5,
  },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancel: { backgroundColor: "#aaa" },
  save: { backgroundColor: COLORS.primary },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
