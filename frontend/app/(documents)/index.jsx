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
import React, { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/home.styles";
import COLORS from "../../constants/colors";
import Loader from "../../components/Loader";
import { router } from "expo-router";

const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://192.168.1.238:3000";

export default function Documents() {
  const { token } = useAuthStore();

  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");

  const filterDocuments = (doc) => {
    const query = searchQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(query) ||
      doc.fileName?.toLowerCase().includes(query)
    );
  };

  const fetchDocuments = async (pageNumber = 1, refresh = false) => {
    try {
      if (refresh || pageNumber === 1) setLoadingInitial(true);
      else setLoadingMore(true);

      const response = await fetch(
        `${BASE_URL}/api/v1/documents?page=${pageNumber}&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      const docs = data.documents || [];

      const newDocs =
        refresh || pageNumber === 1
          ? docs
          : [
              ...documents,
              ...docs.filter((d) => !documents.some((p) => p._id === d._id)),
            ];

      setDocuments(newDocs);
      setFilteredDocuments(newDocs.filter(filterDocuments));
      setHasMore(pageNumber < data.totalPages);
      setPage(pageNumber);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDocuments(1, true);
    }, [])
  );

  useEffect(() => {
    setFilteredDocuments(documents.filter(filterDocuments));
  }, [searchQuery, documents]);

  const handleRefresh = () => fetchDocuments(1, true);
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) fetchDocuments(page + 1);
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
    setEditedTitle(doc.title || "");
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/documents/${editingDocument._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: editedTitle }),
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to update document");

      setDocuments((prev) =>
        prev.map((d) => (d._id === data.document._id ? data.document : d))
      );
      setFilteredDocuments((prev) =>
        prev.map((d) => (d._id === data.document._id ? data.document : d))
      );
      setEditModalVisible(false);
      setEditingDocument(null);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const renderItem = ({ item }) => {
    const isImage = item.contentType?.startsWith("image/");

    return (
      <View style={styles.contactRow}>
        <TouchableOpacity
          style={{ flexDirection: "row", flex: 1, alignItems: "center" }}
        >
          {isImage ? (
            <Image
              source={{
                uri: `${BASE_URL}/api/v1/documents/${
                  item._id
                }/file?ts=${Date.now()}`,
              }}
              style={styles.avatar}
            />
          ) : (
            <Ionicons
              name="document-outline"
              size={50}
              color={COLORS.textSecondary}
            />
          )}
          <View style={styles.contactInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item?.child?.name || "Unnamed Child"}
            </Text>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.title || "Unnamed Document"}
            </Text>
            <Text style={styles.text}>File: {item.fileName}</Text>
            <Text numberOfLines={1}>
              Uploaded: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push(`/document/${item._id}`)}>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loadingInitial) return <Loader size="large" />;

  return (
    <View style={[styles.container, { flex: 1 }]}>
      <TextInput
        style={[styles.input, { margin: 10 }]}
        placeholder="Search by title or file name"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {Platform.OS === "web" ? (
        <FlatList
          data={filteredDocuments}
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
              <Text style={styles.headerTitle}>Documents</Text>
              <Text style={styles.headerSubtitle}>Documents</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <FlatList
          data={filteredDocuments}
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
              <Text style={styles.headerTitle}>Documents</Text>
              <Text style={styles.headerSubtitle}>Shared Documents</Text>
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
            <Text>Edit Document Title</Text>
            <TextInput
              placeholder="Title"
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
