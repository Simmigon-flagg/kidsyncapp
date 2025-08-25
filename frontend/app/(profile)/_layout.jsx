import { View, Text } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore.js';
import styles from "../../assets/styles/profile.styles.js"
import ProfileHeader from '../../components/ProfileHeader.jsx';
import LogoutButton from '../../components/LogoutButton.jsx';

export default function ProfileLayout() {
  const {token} = useAuthStore()

  return (
    <View style={styles.container}>
      <ProfileHeader />
      <LogoutButton />
    </View>
  )
}