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
  Linking,
} from "react-native";
import { useState } from "react";
import styles from "../../assets/styles/create.styles";
import COLORS from "../../constants/colors";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useAuthStore } from "../../store/authStore";
import { useEffect } from "react";

// In your component
const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://192.168.1.238:3000";
export default function Create() {
  const { token } = useAuthStore();
  const [selectedChild, setSelectedChild] = useState({ _id: "", name: "" });
  const [childrenList, setChildrenList] = useState([]);
  const [title, setTitle] = useState("");
  const [fileUri, setFileUri] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [fileName, setFileName] = useState(null);

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/v1/children/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        console.log("data.children:", data.children);
        setChildrenList(data.children || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChildren();
  }, []);

  // Pick file (image or document)
  const pickFile = async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "*/*";
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (!file) return;

          setFileUri(URL.createObjectURL(file));
          setFileName(file.name);

          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(",")[1];
            setFileBase64(base64);
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "image/*",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      });

      if (result.type === "success") {
        setFileUri(result.uri);
        setFileName(result.name);
        setFileBase64(null);
      }
    } catch (err) {
      Alert.alert("Error", "Could not pick file.");
    }
  };

  // Open file externally
  const openFile = () => {
    if (!fileUri) return;
    if (Platform.OS === "web") {
      window.open(fileUri, "_blank");
    } else {
      Linking.openURL(fileUri);
    }
  };

  const handleSubmit = async () => {
    console.log("childrenList", childrenList);
    if (!title) {
      Alert.alert("Error", "Title is required");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("child", JSON.stringify(selectedChild));


      if (fileUri) {
        const title = fileName || fileUri.split("/").pop() || "file"; // fallback title
        const match = /\.(\w+)$/.exec(title); // removed the `!`
        const fileType = match
          ? match[1].toLowerCase() === "pdf"
            ? "application/pdf"
            : match[1].toLowerCase() === "doc" ||
              match[1].toLowerCase() === "docx"
            ? "application/msword"
            : match[1].toLowerCase() === "xls" ||
              match[1].toLowerCase() === "xlsx"
            ? "application/vnd.ms-excel"
            : `image/${match[1]}`
          : "application/octet-stream";

        if (Platform.OS === "web" && fileBase64) {
          const byteCharacters = atob(fileBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileType });
          formData.append("file", blob, title);
        } else {
          formData.append("file", {
            uri: fileUri,
            title,
            child:  JSON.stringify(selectedChild),
            type: fileType,
          });
        }
      }
      const view = formData.get("child")


      const response = await fetch(`${BASE_URL}/api/v1/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to upload document");

      Alert.alert("Success", "Document uploaded successfully");
      setTitle("");
      setSelectedChild({ _id: "", name: "" });
      setFileUri(null);
      setFileBase64(null);
      setFileName(null);
      router.push("/");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        style={styles.scrollViewStyle}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Document</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Child</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <Picker
                  selectedValue={selectedChild._id}
                  onValueChange={(itemValue, itemIndex) =>
                    setSelectedChild({
                      _id: itemValue,
                      name: childrenList[itemIndex - 1]?.name || "", // -1 because of the first placeholder
                    })
                  }
                >
                  <Picker.Item label="Select a child..." value="" />
                  {childrenList.map((child) => (
                    <Picker.Item
                      key={child._id}
                      label={child.name}
                      value={child._id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter document title"
                  placeholderTextColor={COLORS.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* File Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>File / Image</Text>

              <TouchableOpacity style={styles.imagePicker} onPress={pickFile}>
                {fileUri ? (
                  <>
                    {fileName?.match(/\.(pdf|docx?|xlsx?)$/i) ? (
                      <View
                        style={[
                          styles.filePreview,
                          { alignItems: "center", justifyContent: "center" },
                        ]}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={50}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.fileName}>{fileName}</Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: fileUri }}
                        style={styles.previewImage}
                      />
                    )}
                  </>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={40}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.placeholderText}>
                      Tap to select file
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Upload button - only show if file exists */}
            {fileUri && (
              <TouchableOpacity
                onPress={openFile}
                style={styles.button}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Tap to open</Text>
              </TouchableOpacity>
            )}

            {/* Always show Upload button */}
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
                  <Text style={styles.buttonText}>Upload</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
