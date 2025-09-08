import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Button,
  Platform,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/home.styles";
import dateUtils  from "../../lib/utils";
import COLORS from "../../constants/colors";
import Loader from "../../components/Loader";
import { router } from "expo-router";

const BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

export default function Children() {
  const { token } = useAuthStore();

  const [children, setChildren] = useState([]);
  const [filteredChildren, setFilteredChildren] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");

  const filterChildren = (doc) => {
    const query = searchQuery.toLowerCase();
    return (
      doc.name?.toLowerCase().includes(query) ||
      doc.fileName?.toLowerCase().includes(query)
    );
  };

  const fetchChildren = async (pageNumber = 1, refresh = false) => {
    try {
      if (refresh || pageNumber === 1) setLoadingInitial(true);
      else setLoadingMore(true);

      const response = await fetch(
        `${BASE_URL}/api/v1/children?page=${pageNumber}&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      const docs = data.children || [];

      const newDocs =
        refresh || pageNumber === 1
          ? docs
          : [
              ...children,
              ...docs.filter((d) => !children.some((p) => p._id === d._id)),
            ];

      setChildren(newDocs);
      setFilteredChildren(newDocs.filter(filterChildren));
      setHasMore(pageNumber < data.totalPages);
      setPage(pageNumber);
    } catch (err) {
      console.error("Error fetching children:", err);
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchChildren(1, true);
    }, [])
  );

  useEffect(() => {
    setFilteredChildren(children.filter(filterChildren));
  }, [searchQuery, children]);

  const handleRefresh = () => fetchChildren(1, true);
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) fetchChildren(page + 1);
  };

  const handleWebScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20 &&
      !loadingMore &&
      hasMore
    ) {
      handleLoadMore();
    }
  };

  const handleEditPress = (doc) => {
    setEditingDocument(doc);
    setEditedTitle(doc.name || "");
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/children/${editingDocument._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: editedTitle }),
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to update children");

      setChildren((prev) =>
        prev.map((d) => (d._id === data.children._id ? data.children : d))
      );
      setFilteredChildren((prev) =>
        prev.map((d) => (d._id === data.children._id ? data.children : d))
      );
      setEditModalVisible(false);
      setEditingDocument(null);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.contactRow}>
      {console.log(item)}
      <Image
        source={{
          uri: item.imageFileId
            ? `${BASE_URL}/api/v1/children/${item._id}/image?ts=${Date.now()}`
            : item.profileImage,
        }}
        style={styles.avatar}
      />

      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>
          {item.name ? String(item.name) : "Unnamed Child"}
        </Text>
        <Text style={styles.contactSub} numberOfLines={1}>
          {item.dateOfBirth ? dateUtils.formatDate(item.dateOfBirth) : "-"}
        </Text>
      </View>

      <TouchableOpacity onPress={() => router.push(`/children/${item._id}`)}>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    </View>
  );

  if (loadingInitial) return <Loader size="large" />;

  return (
    <View style={[styles.container, { flex: 1 }]}>
      <TextInput
        style={[styles.input, { margin: 10 }]}
        placeholder="Search by name or file name"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {Platform.OS === "web" ? (
        <FlatList
          data={filteredChildren}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 10 }}
          style={{ height: "80vh" }} // ensures FlatList has height to scroll
          showsVerticalScrollIndicator={true}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 10 }} />
            ) : null
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Children</Text>
              <Text style={styles.headerSubtitle}>Children</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <FlatList
          data={filteredChildren}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Children</Text>
              <Text style={styles.headerSubtitle}>Children</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 10 }} />
            ) : null
          }
        />
      )}

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Edit Children Title</Text>
            <TextInput
              placeholder="Name"
              style={styles.input}
              value={editedTitle}
              onChangeText={setEditedTitle}
            />
            <View style={styles.modalButtons}>
              <Button title="Update" onPress={handleUpdate} />
              <Button
                title="Cancel"
                color="red"
                onPress={() => setEditModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
