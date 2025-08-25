import { View, Text } from 'react-native';
import styles from "../../assets/styles/profile.styles.js";

export default function ProfileScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text>Welcome to your profile!</Text>
      {/* Add more profile info/components here */}
    </View>
  );
}
