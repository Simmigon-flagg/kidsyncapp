import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore'; // import your Zustand store
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ResetPasswordScreen() {
  const resetPassword = useAuthStore(state => state.resetPassword); // or forgotPassword if that’s what you named it
  const router = useRouter();
  
 
 const { token } = useLocalSearchParams()
  console.log("token", token)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid password reset link');
    }
  }, [token]);

  const handleSubmit = async () => {
    if (!token) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setMessage('');

    try {
      const data = await resetPassword(token, password); // call Zustand store function
      setMessage(data.message || 'Password reset successful');
      setTimeout(() => router.replace("/(auth)"), 2000);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button title="Reset Password" onPress={handleSubmit} disabled={!token} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#f3f4f6' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  success: { color: 'green', textAlign: 'center', marginBottom: 12 },
  error: { color: 'red', textAlign: 'center', marginBottom: 12 },
});
