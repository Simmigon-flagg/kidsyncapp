import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Button,
  Platform,
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import styles from '../../assets/styles/home.styles';
import COLORS from '../../constants/colors';
import Loader from '../../components/Loader';
import { router } from 'expo-router';

const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://192.168.1.238:3000";

export default function Home() {
  const { token } = useAuthStore();

  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state for editing document title
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');

  // Fetch documents
  const fetchDocuments = async (pageNumber = 1, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNumber === 1) setLoading(true);

      const response = await fetch(
        `${BASE_URL}/api/v1/documents?page=${pageNumber}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch documents');

      const docs = data.documents || [];
      const newDocs =
        refresh || pageNumber === 1
          ? docs
          : [...documents, ...docs.filter(d => !documents.some(p => p._id === d._id))];

      setDocuments(newDocs);
      setFilteredDocuments(newDocs.filter(filterDocuments));
      setHasMore(pageNumber < data.totalPages);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
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

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) fetchDocuments(page + 1);
  };

  const handleRefresh = () => fetchDocuments(1, true);

  // Edit document title modal handlers
  const handleEditPress = (doc) => {
    setEditingDocument(doc);
    setEditedTitle(doc.title || '');
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/documents/${editingDocument._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editedTitle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update document');

      setDocuments(prev =>
        prev.map(d => (d._id === data.document._id ? data.document : d))
      );
      setFilteredDocuments(prev =>
        prev.map(d => (d._id === data.document._id ? data.document : d))
      );
      setEditModalVisible(false);
      setEditingDocument(null);
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  // Filter function for search
  const filterDocuments = (doc) => {
    const query = searchQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(query) ||
      doc.fileName?.toLowerCase().includes(query)
    );
  };

  // Update filtered documents whenever searchQuery or documents change
  useEffect(() => {
    setFilteredDocuments(documents.filter(filterDocuments));
  }, [searchQuery, documents]);

  // Render each document item
  const renderItem = ({ item }) => {
    const isImage = item.contentType?.startsWith("image/");

    return (
      <View style={styles.contactRow}>
        <TouchableOpacity style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
          {isImage ? (
            <Image
              source={{ uri: `${BASE_URL}/api/v1/documents/${item._id}/file?ts=${Date.now()}` }}
              style={styles.avatar}
            />
          ) : (
            <Ionicons name="document-outline" size={50} color={COLORS.textSecondary} />
          )}
          <View style={styles.contactInfo}>
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

  if (loading) return <Loader size="large" />;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={[styles.input, { margin: 10 }]}
        placeholder="Search by title or file name"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredDocuments}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Documents</Text>
            <Text style={styles.headerSubtitle}>Shared Documents</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && filteredDocuments.length > 0 ? <ActivityIndicator style={{ marginVertical: 10 }} /> : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No Documents</Text>
          </View>
        }
      />

      {/* Edit Document Modal */}
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
              <Button title="Cancel" color="red" onPress={() => setEditModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
