import { View, Text, KeyboardAvoidingView, Image, Platform, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import styles from "../../assets/styles/create.styles"
import COLORS from '../../constants/colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system"
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Create() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [relationship, setRelationship] = useState("");
    const [rating, setRating] = useState(3);
    const [image, setImage] = useState(null); // to display the selected image
    const [imageBase64, setImageBase64] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const pickImage = async () => {
        try {
            // request permission if needed
            if (Platform.OS !== "web") {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("Permission Denied", "We need camera roll permissions to upload an image");
                    return;
                }
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["livePhotos", "images"],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true,
            })
            if (!result.canceled) {
                setImage(result.assets[0].uri)
            }
            if (result.assets[0].base64) {
                setImageBase64(result.assets[0].base64)
            } else {
                const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                setImageBase64(base64);
            }
        }
        catch (error) {
            Alert.alert("Error", "There was a problem selecting your image")
        }
    }

    const handleSubmit = async () => {
        if (!name || !phone) {
            Alert.alert("Error", "Name and phone are required")
            
        } else {
            try {
                setLoading(true)
                const token = await AsyncStorage.getItem("token")
          
                // const uriParts = image - split(".");
                // const fileType = uriParts[uriParts.length - 1];
                // const imageType = fileType ? `image/${fileType.toLowerCase()}` : "image/jpeg";
                // const imageDataUrl = `data:${imageType}; base64, ${imageBase64}`;
                const response = await fetch(`http://192.168.1.238:3000/api/v1/contacts`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        phone,
                        relationship,
                        email
                    })
                })
                const data = response.json()
                if (!response.ok) throw new Error(data.message || "Something went wrong")
                // Alert.alert("Success", "Your document was added")
                console.log("data", data)
                setName("")
                router.push("/")
            } catch (error) {
                setLoading(false)
                Alert.alert("Error", error)
            } finally {
                setLoading(false)
            }

        }

    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.container} style={styles.scrollViewStyle}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Contact</Text>
                        <Text style={styles.subtitle}> This contact will be shared</Text >
                    </View >
                    <View style={styles.form}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Contact Name</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="book-outline"
                                    size={20}
                                    color={COLORS.textSecondary}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter contact name"
                                    placeholderTextColor={COLORS.placeholderText}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Phone</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="call-outline"
                                    size={20}
                                    color={COLORS.textSecondary}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="###-###-####"
                                    placeholderTextColor={COLORS.placeholderText}
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>

                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color={COLORS.textSecondary}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="email@gmail.com"
                                    placeholderTextColor={COLORS.placeholderText}
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Relationship</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color={COLORS.textSecondary}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Grandma"
                                    placeholderTextColor={COLORS.placeholderText}
                                    value={relationship}
                                    onChangeText={setRelationship}
                                />
                            </View>

                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Contact Image</Text>
                            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                {image ? (
                                    <Image
                                        source={{ uri: image }}
                                        style={styles.previewImage} />
                                ) : (
                                    < View style={styles.placeholderContainer}>
                                        <Ionicons
                                            name="image-outline"
                                            size={40}
                                            color={COLORS.textSecondary} />
                                        <Text style={styles.placeholderText}>Tap to select image</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>



                        <TouchableOpacity style={styles.button} onPress={handleSubmit}
                            disabled={loading}>
                            {loading ? (
                                < ActivityIndicator color={COLORS.white} />) : (
                                <>
                                    <Ionicons
                                        name="cloud-upload-outline"
                                        size={20}
                                        color={COLORS.white} style={styles.buttonIcon}
                                    />
                                    <Text style={styles.buttonText}>Share</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>



                </View >
            </ScrollView >

        </KeyboardAvoidingView >
    )
}