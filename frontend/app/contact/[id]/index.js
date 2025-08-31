import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  Image,
  Linking,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useAuthStore } from "../../../store/authStore";
import COLORS from "../../../constants/colors";
import EditContactModal from "./EditContactModal"; // modal component from previous example

export const unstable_skipLayout = true;

export default function ContactPage() {
  const { id } = useLocalSearchParams();
  const { token } = useAuthStore();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const BASE_URL =
    Platform.OS === "android"
      ? "http://10.0.2.2:3000"
      : "http://localhost:3000";

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    const fetchContact = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/v1/contacts/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setContact(data.contact);
      } catch (error) {
        console.error("Failed to load contact", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id, token]);

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, "")}`);
  };

  const closeModal = () => {
    setModalVisible(false)
  }
  const handleEmail = (email) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>No contact found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/(contacts)")}
      >
        <Text style={styles.backButtonText}>Back to Contacts</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{
            uri: contact.imageFileId
              ? `${BASE_URL}/api/v1/contacts/${contact._id}/image`
              : contact.profileImage,
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.role}>{contact.relationship}</Text>
      </View>

      {/* Contact Info Card */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => handleCall(contact.phone)}
        >
          <Text style={styles.icon}>📞</Text>
          <Text style={styles.text}>{contact.phone || "-"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => handleEmail(contact.email)}
        >
          <Text style={styles.icon}>✉️</Text>
          <Text style={styles.text}>{contact.email || "-"}</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.icon}>👥</Text>
          <Text style={styles.text}>{contact.relationship || "-"}</Text>
        </View>
      </View>

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.editButtonText}>Edit Contact</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      <EditContactModal
        visible={modalVisible}
        onClose={closeModal}        
        contact={contact}
        onSave={async (updated) => {
          // call API to update
          try {
            const response = await fetch(`${BASE_URL}/api/v1/contacts/${contact._id}`, {
              method: "PUT",
              headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(updated),
            });
            const data = await response.json();
            setContact(data.contact); // immediately reflect updated info
          } catch (err) {
            console.error("Update failed", err);
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
  avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: "#eee" },
  name: { fontSize: 26, fontWeight: "700", marginTop: 15 },
  role: { fontSize: 16, color: "#666", marginTop: 5 },
  card: { backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 15, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  icon: { fontSize: 22, marginRight: 15 },
  text: { fontSize: 18, color: "#333" },
  editButton: { margin: 20, padding: 15, backgroundColor: COLORS.primary, borderRadius: 10, alignItems: "center" },
  editButtonText: { color: "#fff", fontWeight: "600" },
});
