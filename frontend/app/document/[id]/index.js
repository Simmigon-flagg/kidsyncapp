import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useAuthStore } from "../../../store/authStore";
import COLORS from "../../../constants/colors";
import EditDocumentModal from "./EditDocumentModal";

export default function DocumentPage() {
  const { id } = useLocalSearchParams();
  const { token } = useAuthStore();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false); // new
  const [modalVisible, setModalVisible] = useState(false);

  const BASE_URL =
    Platform.OS === "android"
      ? "http://10.0.2.2:3000"
      : "http://localhost:3000";

  // Fetch document details
  const fetchDocument = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/documents/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setDocument(data.document || null);
    } catch (err) {
      console.error("Failed to fetch document:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id, token]);

  // Fetch image from GridFS as base64
  const fetchImage = async (doc) => {
    if (!doc?.fileId) return;

    try {
      setImageLoading(true);
      const res = await fetch(`${BASE_URL}/api/v1/documents/${doc._id}/file`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch image");

      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocument((prev) => ({ ...prev, imageUri: reader.result }));
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Failed to load image:", err);
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    if (document?.fileId) fetchImage(document);
  }, [document?.fileId]);

  const closeModal = () => setModalVisible(false);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!document) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>No document found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/(documents)")}
      >
        <Text style={styles.backButtonText}>Back to Documents</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        {imageLoading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.avatar}
          />
        ) : (
          <Image
            source={{
              uri: document.imageUri || document.profileImage || "",
            }}
            style={styles.avatar}
          />
        )}

        <Text style={styles.name}>{document.title}</Text>
        <Text style={styles.text}>
          Uploaded: {new Date(document.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.text}>File: {document.fileName}</Text>
      </View>

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.editButtonText}>Edit Document</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      <EditDocumentModal
        visible={modalVisible}
        onClose={closeModal}
        document={document}
        token={token}
        onSave={async (formData) => {


          try {
            const res = await fetch(
              `${BASE_URL}/api/v1/documents/${document._id}`,
              {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
              }
            );
            const data = await res.json();
            setDocument(data.document);
            if (data.document.fileId) fetchImage(data.document); // refresh image
          } catch (err) {
            console.error("Update failed:", err);
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f7" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundText: { fontSize: 18, color: "#888" },
  backButton: {
    margin: 10,
    padding: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  backButtonText: { color: "#fff", fontWeight: "600" },
  header: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 26, fontWeight: "700", marginTop: 15 },
  text: { fontSize: 18, color: "#333" },
  editButton: {
    margin: 20,
    padding: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: "center",
  },
  editButtonText: { color: "#fff", fontWeight: "600" },
});
