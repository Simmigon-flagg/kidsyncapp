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
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../../constants/colors";
import * as ImagePicker from "expo-image-picker";
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
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileUri, setFileUri] = useState(""); // for web base64
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
      : "http://localhost:3000";
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

  // const handleFileChange = (e) => {
  //   const f = e.target.files[0];
  //   if (!f) return;
  //   const reader = new FileReader();
  //   reader.onload = () => {
  //     setFileUri(reader.result); // data:<mime>;base64,...
  //     setFileName(f.name);
  //     setFileType(f.type);
  //   };
  //   reader.readAsDataURL(f);
  // };

  // const handlePickFile = async () => {
  //   let result = await DocumentPicker.getDocumentAsync({});
  //   if (result.type === "success") {
  //     setFile(result); // { uri, name, size, mimeType }
  //     setFileName(result.name);
  //     setFileType(result.mimeType || "application/octet-stream");
  //   }
  // };

  // /** --- PICK IMAGE --- */
  // const pickImage = async (source = "library") => {
  //   try {
  //     // Request permission on mobile
  //     if (Platform.OS !== "web") {
  //       const perm =
  //         source === "camera"
  //           ? await ImagePicker.requestCameraPermissionsAsync()
  //           : await ImagePicker.requestMediaLibraryPermissionsAsync();
  //       if (perm.status !== "granted") {
  //         Alert.alert("Permission denied", `Need ${source} access`);
  //         return;
  //       }
  //     }

  //     const result =
  //       source === "camera"
  //         ? await ImagePicker.launchCameraAsync({
  //             mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //             allowsEditing: true,
  //             aspect: [4, 3],
  //             quality: 0.5,
  //             base64: true,
  //           })
  //         : await ImagePicker.launchImageLibraryAsync({
  //             mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //             allowsEditing: true,
  //             aspect: [4, 3],
  //             quality: 0.5,
  //             base64: true,
  //           });

  //     if (result.canceled) return;
  //     const picked = result.assets[0];
  //     setImage(picked.uri);
  //     setImageBase64(picked.base64);
  //     setSelectedFile(null); // clear file if image chosen
  //   } catch (err) {
  //     console.error("pickImage error:", err);
  //     Alert.alert("Error", "Failed to pick image");
  //   }
  // };

  // /** --- PICK FILE --- */
  // const pickFile = async () => {
  //   try {
  //     if (Platform.OS === "web") {
  //       const input = document.createElement("input");
  //       input.type = "file";
  //       input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"; // allow image & docs
  //       input.onchange = (e) => {
  //         const f = e.target.files && e.target.files[0];
  //         if (!f) return;
  //         const previewUri = URL.createObjectURL(f);
  //         setSelectedFile({
  //           uri: previewUri,
  //           name: f.name,
  //           type: f.type || "application/octet-stream",
  //           isWeb: true,
  //           file: f,
  //         });
  //         setImage(null);
  //         setImageBase64(null);
  //       };
  //       input.click();
  //       return;
  //     }

  //     const res = await DocumentPicker.getDocumentAsync({
  //       type: [
  //         "application/pdf",
  //         "application/msword",
  //         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  //         "application/vnd.ms-excel",
  //         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //         "text/plain",
  //         "image/*",
  //       ],
  //       copyToCacheDirectory: true,
  //     });

  //     if (!res || res.canceled) return;
  //     const asset = res.assets ? res.assets[0] : res;
  //     setSelectedFile({
  //       uri: asset.uri,
  //       name: asset.name || asset.uri.split("/").pop(),
  //       type: asset.mimeType || asset.type || "application/octet-stream",
  //       isWeb: false,
  //     });
  //     setImage(null);
  //     setImageBase64(null);
  //   } catch (err) {
  //     console.error("pickFile error:", err);
  //     Alert.alert("Error", "Failed to pick file");
  //   }
  // };

  /** --- CHOOSE PICK --- */
  // --- PICK FILE OR IMAGE ---
  // const handlePick = async () => {
  //   try {
  //     // Use Expo DocumentPicker for all platforms
  //     const res = await DocumentPicker.getDocumentAsync({
  //       type: [
  //         "application/pdf",
  //         "application/msword",
  //         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  //         "application/vnd.ms-excel",
  //         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //         "text/plain",
  //         "image/*",
  //       ],
  //       copyToCacheDirectory: true,
  //     });

  //     if (res.type === "cancel") return;

  //     const picked = res.assets ? res.assets[0] : res;

  //     // If it's an image, try to show a preview
  //     if (
  //       picked.mimeType?.startsWith("image/") ||
  //       picked.uri?.endsWith(".png") ||
  //       picked.uri?.endsWith(".jpg")
  //     ) {
  //       setImage(picked.uri);
  //       setImageBase64(null); // could convert to base64 if needed
  //     } else {
  //       setSelectedFile({
  //         uri: picked.uri,
  //         name: picked.name,
  //         type: picked.mimeType || "application/octet-stream",
  //         isWeb: Platform.OS === "web",
  //         file: picked.file || null,
  //       });
  //       setImage(null);
  //       setImageBase64(null);
  //     }
  //   } catch (err) {
  //     console.error("File pick error:", err);
  //     Alert.alert("Error", "Failed to pick file");
  //   }
  // };
  // const handlePick = async () => {
  //   try {
  //     const res = await DocumentPicker.getDocumentAsync({
  //       type: [
  //         "application/pdf",
  //         "application/msword",
  //         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  //         "application/vnd.ms-excel",
  //         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //         "text/plain",
  //         "image/*", // allow images
  //       ],
  //       copyToCacheDirectory: true,
  //     });

  //     if (res.type === "cancel") return;

  //     const picked = res.assets ? res.assets[0] : res;

  //     // Images → show preview
  //     if (
  //       picked.mimeType?.startsWith("image/") ||
  //       picked.uri?.endsWith(".png") ||
  //       picked.uri?.endsWith(".jpg") ||
  //       picked.uri?.endsWith(".jpeg")
  //     ) {
  //       setImage(picked.uri);
  //       setSelectedFile(null);
  //     }
  //     // Other files → keep metadata
  //     else {
  //       setSelectedFile({
  //         uri: picked.uri,
  //         name: picked.name,
  //         type: picked.mimeType || "application/octet-stream",
  //         isWeb: Platform.OS === "web",
  //         file: picked.file || null, // only available on web
  //       });
  //       setImage(null);
  //     }

  //     setImageBase64(null); // reset base64 unless you need to encode later
  //   } catch (err) {
  //     console.error("File pick error:", err);
  //     Alert.alert("Error", "Failed to pick file");
  //   }
  // };
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

  /** --- SAVE --- */
  // const handleSave = () => {
  //   if (!title) {
  //     Alert.alert("Error", "Title is required");
  //     return;
  //   }
  //   setLoading(true);

  //   const formData = new FormData();
  //   formData.append("title", title);

  //   // Image (mobile or web)
  //   if (image) {
  //     if (Platform.OS === "web") {
  //       // Web: convert base64 to Blob
  //       const byteCharacters = atob(imageBase64);
  //       const byteNumbers = new Array(byteCharacters.length);
  //       for (let i = 0; i < byteCharacters.length; i++) {
  //         byteNumbers[i] = byteCharacters.charCodeAt(i);
  //       }
  //       const byteArray = new Uint8Array(byteNumbers);
  //       const blob = new Blob([byteArray], { type: "image/jpeg" });
  //       formData.append("file", blob, image.split("/").pop() || "upload.jpg");
  //     } else {
  //       // Mobile: use local URI
  //       formData.append("file", {
  //         uri: image,
  //         name: image.split("/").pop() || "upload.jpg",
  //         type: "image/jpeg",
  //       });
  //     }
  //   } else if (selectedFile) {
  //     if (selectedFile.isWeb && selectedFile.file) {
  //       formData.append("file", selectedFile.file, selectedFile.name);
  //     } else {
  //       formData.append("file", {
  //         uri: selectedFile.uri,
  //         name: selectedFile.name || "upload",
  //         type: selectedFile.type || "application/octet-stream",
  //       });
  //     }
  //   }
  //   console.log("selectedFile from EditDocument");
  //   for (let [key, value] of formData.entries()) {
  //     console.log(key, value);
  //   }
  //   onSave(formData);
  //   setLoading(false);
  //   onClose();
  // };

  // const handleSave = () => {
  //   if (!title) {
  //     Alert.alert("Error", "Title is required");
  //     return;
  //   }
  //   setLoading(true);

  //   const formData = new FormData();
  //   formData.append("title", title);

  //   // ---- Images from camera/gallery ----
  //   if (image && imageBase64) {
  //     if (Platform.OS === "web") {
  //       // Convert base64 → Blob (web only)
  //       const byteCharacters = atob(imageBase64);
  //       const byteNumbers = new Array(byteCharacters.length);
  //       for (let i = 0; i < byteCharacters.length; i++) {
  //         byteNumbers[i] = byteCharacters.charCodeAt(i);
  //       }
  //       const byteArray = new Uint8Array(byteNumbers);
  //       const blob = new Blob([byteArray], { type: "image/jpeg" });
  //       formData.append("file", blob, image.split("/").pop() || "upload.jpg");
  //     } else {
  //       // React Native expects { uri, name, type }
  //       formData.append("file", {
  //         uri: `data:image/jpeg;base64,${imageBase64}`,
  //         name: image.split("/").pop() || "upload.jpg",
  //         type: "image/jpeg",
  //       });
  //     }
  //   }

  //   // ---- Selected file (docs / pdf) ----
  //   else if (selectedFile) {
  //     if (selectedFile.isWeb && selectedFile.file) {
  //       // Web: real File object
  //       formData.append("file", selectedFile.file, selectedFile.name);
  //     } else {
  //       // React Native: file picked from FS
  //       formData.append("file", {
  //         uri: selectedFile.uri,
  //         name: selectedFile.name || "upload",
  //         type: selectedFile.type || "application/octet-stream",
  //       });
  //     }
  //   }

  //   // Debug: log FormData contents
  //   for (let pair of formData.entries()) {
  //     console.log(pair[0], pair[1]);
  //   }

  //   // Send to parent
  //   onSave(formData);
  //   setLoading(false);
  //   onClose()
  // };

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
