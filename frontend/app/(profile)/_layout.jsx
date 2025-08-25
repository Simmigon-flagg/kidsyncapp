import { View } from 'react-native';
import ProfileHeader from '../../components/ProfileHeader.jsx';
import LogoutButton from '../../components/LogoutButton.jsx';
import styles from "../../assets/styles/profile.styles.js";

export default function ProfileLayout({ children }) {
  return (
    <View style={styles.container}>
      <ProfileHeader />
      <LogoutButton />
      {/* Render the nested screen here */}
      {children}
    </View>
  );
}
