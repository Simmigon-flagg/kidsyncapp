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
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/home.styles";
import COLORS from "../../constants/colors";
import Loader from "../../components/Loader";

const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://192.168.1.238:3000";

export default function Home() {
  const { token } = useAuthStore();
  const router = useRouter();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef(null);

  const fetchContacts = async (pageNumber = 1, refresh = false, search = "") => {
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
      if (!response.ok) throw new Error(data.message || "Failed to fetch contacts");

      if (refresh || pageNumber === 1) setContacts(data.contacts);
      else {
        setContacts((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const newContacts = data.contacts.filter((c) => !existingIds.has(c._id));
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

  // Fetch on mount
  useEffect(() => {
    fetchContacts(1, true, searchQuery);
  }, []);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchContacts(1, true, searchQuery);
    }, [])
  );

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      fetchContacts(1, true, searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing)
      fetchContacts(page + 1, false, searchQuery);
  };

  const handleRefresh = () => fetchContacts(1, true, searchQuery);

  const handleCall = (phoneNumber) => {
    if (phoneNumber) Linking.openURL(`tel:${phoneNumber.replace(/[^0-9+]/g, "")}`);
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
              ? `${BASE_URL}/api/v1/contacts/${item._id}/image`
              : item.profileImage,
          }}
          style={styles.avatar}
        />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.name || "Unnamed Contact"}
          </Text>
          <Text style={styles.contactSub} numberOfLines={1}>
            {item.phone || item.email || "-"}
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
    <View style={styles.container}>
      <FlatList
        data={contacts}
        renderItem={renderItem}
        keyExtractor={(item) => item?._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Contacts</Text>
            

            {/* Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 8,
                paddingHorizontal: 10,
              }}
            >
              <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Search contacts..."
                placeholderTextColor={COLORS.placeholderText}
                style={{ flex: 1, marginLeft: 8, color: COLORS.textDark }}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        }
        ListFooterComponent={
          hasMore && contacts.length > 0 ? (
            <ActivityIndicator style={{ marginVertical: 10 }} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No Contacts</Text>
          </View>
        }
      />
    </View>
  );
}
