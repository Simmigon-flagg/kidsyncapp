import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useEffect, useState } from "react"
export default function HomeScreen() {
  const [contacts, setContacts] = useState([])
  const [contact, setContact] = useState({})
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/contacts")
      const data = await response.json()
      setContacts(data.contacts)
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/contact")
      const data = await response.json()
      setContact(data.contact)
    }
    fetchData()
  }, [])

  return (


    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Kidsycn!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1:</ThemedText>
        <ThemedText>
          <ul>
            {contacts && contacts.map((contact) => <li key={contact?._id}>{contact?.name}</li>)}

          </ul>
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          {contact && <>{contact?.name}</>}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          MY_VALUE:{process.env.MY_VALUE}    
        </ThemedText>
        <ThemedText>          
          EXPO_PUBLIC_VALUE:
          {process.env.EXPO_PUBLIC_VALUE}
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>

  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
