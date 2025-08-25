import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useState } from "react";
import styles from "../../assets/styles/login.styles";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";

export default function ForgotPassword() {
  const [email, setEmail] = useState("kaipherllc@gmail.com");
  const { forgotPassword, isLoading } = useAuthStore();; // grab context fn

  const handleReset = async () => {
    if (!email) {
      if (Platform.OS === "web") {
        window.alert("Missing Email. Please enter your email address.");
      } else {
        Alert.alert("Missing Email", "Please enter your email address.");
      }
      return;
    }

    const result = await forgotPassword(email);

    if (result.success) {
      if (Platform.OS === "web") {
        window.alert(result.message);
      } else {
        Alert.alert("Success", result.message);
      }
    } else {
      if (Platform.OS === "web") {
        window.alert(result.error);
      } else {
        Alert.alert("Error", result.error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Enter your email to reset password</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.placeholderText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleReset}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
