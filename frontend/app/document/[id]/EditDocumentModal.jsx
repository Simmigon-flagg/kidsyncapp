import { useState, useEffect } from "react";
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
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../../constants/colors";

import * as DocumentPicker from "expo-document-picker";

export default function EditDocumentModal({
  visible,
  onClose,
  document,
  onSave,
  token,
}) {
  const [title, setTitle] = useState(document?.title || "");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // At the top of your component
  const [documentImage, setDocumentImage] = useState(null);

  // Fetch existing document image if no new image/file is picked
  useEffect(() => {
    if (!document?.fileId) return;

    const fetchDocumentImage = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/v1/documents/${document._id}/file`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch image");

        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentImage(reader.result); // data:image/jpeg;base64,...
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to load document image:", err);
        setDocumentImage(null);
      }
    };

    fetchDocumentImage();
  }, [document, token]);

  const BASE_URL =
    Platform.OS === "android"
      ? "http://10.0.2.2:3000"
      : "http://192.168.1.238:3000";

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      if (document.fileId) {
        setImage(document.fileId.startsWith("blob:") ? document.fileId : null);
      } else {
        setImage(null);
      }
    }
  }, [document]);


  const handlePick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
          "image/*", // allow images
        ],
        copyToCacheDirectory: true,
      });

      if (res.type === "cancel") return;

      const picked = res.assets ? res.assets[0] : res;

      if (
        picked.mimeType?.startsWith("image/") ||
        picked.uri?.endsWith(".png") ||
        picked.uri?.endsWith(".jpg") ||
        picked.uri?.endsWith(".jpeg")
      ) {
        // ✅ Web: wrap into File object
        if (Platform.OS === "web" && picked.file) {
          setSelectedFile({
            uri: URL.createObjectURL(picked.file),
            name: picked.name || "upload.jpg",
            type: picked.mimeType || "image/jpeg",
            isWeb: true,
            file: picked.file,
          });
          setImage(picked.uri); // preview
        } else {
          // ✅ Native: just store uri/type
          setSelectedFile({
            uri: picked.uri,
            name: picked.name || picked.uri.split("/").pop() || "upload.jpg",
            type: picked.mimeType || "image/jpeg",
            isWeb: false,
          });
          setImage(picked.uri);
        }
      } else {
        // Non-image files
        setSelectedFile({
          uri: picked.uri,
          name: picked.name,
          type: picked.mimeType || "application/octet-stream",
          isWeb: Platform.OS === "web",
          file: picked.file || null,
        });
        setImage(null);
      }

      setImageBase64(null);
    } catch (err) {
      console.error("File pick error:", err);
      Alert.alert("Error", "Failed to pick file");
    }
  };


  const handleSave = () => {
    if (!title) {
      Alert.alert("Error", "Title is required");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);

    if (selectedFile) {
      if (selectedFile.isWeb && selectedFile.file) {
        // ✅ On web: append the real File object
        formData.append("file", selectedFile.file, selectedFile.name);
      } else {
        // ✅ On native: use { uri, name, type }
        formData.append("file", {
          uri: selectedFile.uri,
          name: selectedFile.name || "upload",
          type: selectedFile.type || "application/octet-stream",
        });
      }
    } else if (image) {
      if (Platform.OS === "web" && image.startsWith("data:")) {
        // Convert base64 string into Blob
        const byteString = atob(image.split(",")[1]);
        const byteArray = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          byteArray[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: "image/jpeg" });
        formData.append("file", blob, "upload.jpg");
      } else {
        formData.append("file", {
          uri: image,
          name: image.split("/").pop() || "upload.jpg",
          type: "image/jpeg",
        });
      }
    }

    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    onSave(formData);
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
          <Text style={styles.modalTitle}>Edit Document</Text>
          <ScrollView contentContainerStyle={styles.form}>
            {/* PREVIEW */}
            <View style={styles.previewContainer}>
              {image ? (
                // New picked image
                <Image
                  source={{ uri: image }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : selectedFile ? (
                // New picked file (non-image)
                <View style={styles.filePreview}>
                  <Ionicons
                    name="document-outline"
                    size={50}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                </View>
              ) : documentImage ? (
                // Existing image from document
                <Image
                  source={{ uri: documentImage }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.filePreview}>
                  <Ionicons
                    name="image-outline"
                    size={50}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.fileName}>No file selected</Text>
                </View>
              )}
            </View>

            {/* PICK BUTTON */}
            <TouchableOpacity style={styles.pickButton} onPress={handlePick}>
              <Text style={styles.pickButtonText}>Choose File / Image</Text>
            </TouchableOpacity>

            {/* TITLE INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter title"
              />
            </View>

            {/* SAVE / CANCEL */}
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
  previewContainer: { alignItems: "center", marginBottom: 10 },
  previewImage: { width: 100, height: 100, borderRadius: 8 },
  filePreview: {
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#eee",
    padding: 10,
  },
  fileName: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 5,
  },
  pickButton: {
    padding: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  pickButtonText: { color: "#fff", fontWeight: "600" },
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
