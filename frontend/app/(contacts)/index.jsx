import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  Linking,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/home.styles";
import COLORS from "../../constants/colors";
import Loader from "../../components/Loader";

const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://192.168.1.238:3000";

export default function Contacts() {
  const { token } = useAuthStore();
  const router = useRouter();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef(null);

  const fetchContacts = async (
    pageNumber = 1,
    refresh = false,
    search = ""
  ) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNumber === 1) setLoading(true);

      const response = await fetch(
        `${BASE_URL}/api/v1/contacts?page=${pageNumber}&limit=5&search=${encodeURIComponent(
          search
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch contacts");

      if (refresh || pageNumber === 1) setContacts(data.contacts);
      else {
        setContacts((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const newContacts = data.contacts.filter(
            (c) => !existingIds.has(c._id)
          );
          return [...prev, ...newContacts];
        });
      }

      setHasMore(pageNumber < data.totalPages);
      setPage(pageNumber);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContacts(1, true, searchQuery);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchContacts(1, true, searchQuery);
    }, [])
  );

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchContacts(1, true, searchQuery);
    }, 500);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing)
      fetchContacts(page + 1, false, searchQuery);
  };

  const handleRefresh = () => fetchContacts(1, true, searchQuery);

  const handleCall = (phoneNumber) => {
    if (phoneNumber)
      Linking.openURL(`tel:${phoneNumber.toString().replace(/[^0-9+]/g, "")}`);
  };

  const renderItem = ({ item }) => (
    <View style={styles.contactRow}>
      <TouchableOpacity
        style={{ flexDirection: "row", flex: 1, alignItems: "center" }}
        onPress={() => handleCall(item.phone)}
      >
        <Image
          source={{
            uri: item.imageFileId
              ? `${BASE_URL}/api/v1/contacts/${item._id}/image?ts=${Date.now()}`
              : item.profileImage,
          }}
          style={styles.avatar}
        />

        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item?.child?.name || "Unnamed Child"}
          </Text>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.name ? String(item.name) : "Unnamed Contact"}
          </Text>
          <Text style={styles.contactSub} numberOfLines={1}>
            {item.phone
              ? String(item.phone)
              : item.email
              ? String(item.email)
              : "-"}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push(`/contact/${item._id}`)}>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    </View>
  );

  if (loading && page === 1) return <Loader size="large" />;

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={[styles.input, { margin: 10 }]}
        placeholder="Search by title or file name"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={contacts}
          renderItem={renderItem}
          keyExtractor={(item) => item?._id}
          style={Platform.OS === "web" ? { height: "80vh" } : { flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          showsVerticalScrollIndicator
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Contacts</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && contacts.length > 0 ? (
              <ActivityIndicator style={{ marginVertical: 10 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="book-outline"
                size={60}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyText}>No Contacts</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}
