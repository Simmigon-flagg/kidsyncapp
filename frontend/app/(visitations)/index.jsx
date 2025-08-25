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
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import styles from '../../assets/styles/home.styles';
import COLORS from '../../constants/colors';
import Loader from '../../components/Loader';

export default function Home() {
    const { token } = useAuthStore();

    const [visitations, setVisitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Modal state for editing contact
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [editedName, setEditedName] = useState('');
    const [editedPhone, setEditedPhone] = useState('');

    // Example modal state for adding contact (you need to add this UI yourself)
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    // Fetch visitations
    const fetchVisitations = async (pageNumber = 1, refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
            } else if (pageNumber === 1) {
                setLoading(true);
            }

            const response = await fetch(
                `http://192.168.1.238:3000/api/v1/visitations?page=${pageNumber}&limit=5`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch visitations');

            if (refresh || pageNumber === 1) {
                setVisitations(data.visitations);
            } else {
                setVisitations((prev) => {
                    const existingIds = new Set(prev.map((visitation) => visitation._id));
                    const newVisitation = data.visitations.filter((visitation) => !existingIds.has(visitation._id));
                    return [...prev, ...newVisitation];
                });
            }

            setHasMore(pageNumber < data.totalPages);
            setPage(pageNumber);
        } catch (error) {
            console.log('Error fetching visitations:', error);

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchVisitations();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchVisitations(1, true);
        }, [])
    );

    const handleLoadMore = () => {
        if (hasMore && !loading && !refreshing) {
            fetchVisitations(page + 1);
        }
    };

    const handleRefresh = () => {
        fetchVisitations(1, true);
    };

    // Edit contact modal handlers
    const handleEditPress = (contact) => {
        setEditingContact(contact);
        setEditedName(contact.name || '');
        setEditedPhone(contact.phone || '');
        setEditModalVisible(true);
    };

    const handleUpdate = async () => {
        try {
            const response = await fetch(`http://192.168.1.238:3000/api/v1/visitations/${editingContact._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: editedName, phone: editedPhone }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update contact');

            setEditModalVisible(false);
            setEditingContact(null);

            // Update UI immediately by updating the contact in the list
            setVisitations((prev) =>
                prev.map((c) => (c._id === data.contact._id ? data.contact : c))
            );
        } catch (err) {
            console.error('Update error:', err);
        }
    };

    // Add contact handler, updates UI immediately
    const handleAddContact = async () => {
        try {
            const newContactData = { name: newName, phone: newPhone };

            const response = await fetch('http://192.168.1.238:3000/api/v1/visitations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newContactData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to add contact');

            // Prepend new contact to visitations state
            setVisitations((prev) => [data.contact, ...prev]);

            // Reset form and close modal
            setNewName('');
            setNewPhone('');
            setAddModalVisible(false);
        } catch (err) {
            console.error('Add contact error:', err);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleEditPress(item)} style={styles.contactCard}>
            <View style={styles.row}>
                <Image
                    source={{ uri: item.owner?.profileImage || 'https://via.placeholder.com/60' }}
                    style={styles.avatar}
                />
                <View style={styles.mainInfo}>
                    <Text style={styles.contactName}>{item.name || 'Unnamed Contact'}</Text>

                    <View style={styles.infoRow}>
                        <View style={styles.infoBlock}>
                            <Text style={styles.label}>Phone</Text>
                            <Text style={styles.value}>{item.phone || '-'}</Text>
                        </View>
                        <View style={styles.infoBlock}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{item.email || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoBlock}>
                            <Text style={styles.label}>Relationship</Text>
                            <Text style={styles.value}>{item.relationship || '-'}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) return <Loader size='large' />

    return (
        <View style={styles.container}>


         
            {loading && page === 1 ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={visitations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item?._id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.1}
                    // refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListHeaderComponent={<View
                        style={styles.header}>
                        <Text
                            style={styles.headerTitle}>Visitations
                        </Text>
                        <Text
                            style={styles.headerSubtitle}>Shared Visitations</Text>
                    </View>
                    }
                    ListFooterComponent={hasMore && visitations.length > 0 ? <ActivityIndicator style={{ marginVertical: 10 }} /> : null}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="book-outline" size={60} color={COLORS.textSecondary} />
                            <Text style={styles.emptyText}>No Visitations</Text>
                        </View>
                    }

                />  
            )}

            {/* Edit Contact Modal */}
            <Modal visible={editModalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text>Edit Contact</Text>
                        <TextInput
                            placeholder="Name"
                            style={styles.input}
                            value={editedName}
                            onChangeText={setEditedName}
                        />
                        <TextInput
                            placeholder="Phone"
                            style={styles.input}
                            value={editedPhone}
                            onChangeText={setEditedPhone}
                            keyboardType="phone-pad"
                        />
                        <View style={styles.modalButtons}>
                            <Button title="Update" onPress={handleUpdate} />
                            <Button title="Cancel" color="red" onPress={() => setEditModalVisible(false)} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Contact Modal */}
            <Modal visible={addModalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text>Add New Contact</Text>
                        <TextInput
                            placeholder="Name"
                            style={styles.input}
                            value={newName}
                            onChangeText={setNewName}
                        />
                        <TextInput
                            placeholder="Phone"
                            style={styles.input}
                            value={newPhone}
                            onChangeText={setNewPhone}
                            keyboardType="phone-pad"
                        />
                        <View style={styles.modalButtons}>
                            <Button title="Add" onPress={handleAddContact} />
                            <Button title="Cancel" color="red" onPress={() => setAddModalVisible(false)} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
