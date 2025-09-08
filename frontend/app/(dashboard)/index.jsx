import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from "react-native";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "@/store/authStore";
import styles from "../../assets/styles/profile.styles";
const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://192.168.1.238:3000";
export default function Dashboard({ contactsCount = 0, recentContacts = [] }) {
  const { user } = useAuthStore();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Welcome Section */}
      <View
        style={{
          backgroundColor: COLORS.primary,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Image
          source={{
            uri:
              Platform.OS === "web"
                ? `${BASE_URL}${user?.profileImage}?t=${Date.now()}`
                : `${BASE_URL}${user?.profileImage}?t=${Date.now()}`,
          }}
          style={styles.profileImage}
        />
        <View>
          <Text
            style={{ color: COLORS.white, fontSize: 22, fontWeight: "bold" }}
          >
            Welcome, {user?.name || "User"}!
          </Text>
          <Text style={{ color: COLORS.white, fontSize: 14, marginTop: 4 }}>
            Here’s a quick overview of your contacts
          </Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.cardBackground,
            borderRadius: 16,
            padding: 16,
            marginRight: 8,
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
            Total Contacts
          </Text>
          <Text
            style={{
              color: COLORS.textPrimary,
              fontSize: 28,
              fontWeight: "bold",
              marginTop: 8,
            }}
          >
            {contactsCount}
          </Text>
          <Ionicons
            name="people-outline"
            size={32}
            color={COLORS.primary}
            style={{ position: "absolute", top: 16, right: 16 }}
          />
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.cardBackground,
            borderRadius: 16,
            padding: 16,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
            Recent Contact
          </Text>
          <Text
            style={{
              color: COLORS.textPrimary,
              fontSize: 28,
              fontWeight: "bold",
              marginTop: 8,
            }}
          >
            {recentContacts[0]?.name || "-"}
          </Text>
          <MaterialIcons
            name="recent-actors"
            size={32}
            color={COLORS.primary}
            style={{ position: "absolute", top: 16, right: 16 }}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 12,
          color: COLORS.textDark,
        }}
      >
        Quick Actions
      </Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: COLORS.primary,
            borderRadius: 16,
            padding: 20,
            marginRight: 8,
            alignItems: "center",
          }}
        >
          <Ionicons name="person-add-outline" size={28} color={COLORS.white} />
          <Text style={{ color: COLORS.white, marginTop: 8 }}>Add Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: COLORS.primary,
            borderRadius: 16,
            padding: 20,
            marginLeft: 8,
            alignItems: "center",
          }}
        >
          <Ionicons name="people-outline" size={28} color={COLORS.white} />
          <Text style={{ color: COLORS.white, marginTop: 8 }}>
            View Contacts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Contacts List */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 12,
          color: COLORS.textDark,
        }}
      >
        Recent Contacts
      </Text>
      {recentContacts.length === 0 ? (
        <Text style={{ color: COLORS.textSecondary }}>No recent contacts</Text>
      ) : (
        recentContacts.map((contact) => (
          <View
            key={contact._id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              marginBottom: 12,
              backgroundColor: COLORS.cardBackground,
              borderRadius: 12,
              shadowColor: COLORS.black,
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Image
              source={{
                uri: contact.profileImage || "https://via.placeholder.com/60",
              }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                marginRight: 12,
              }}
            />
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: COLORS.textPrimary,
                }}
              >
                {contact.name}
              </Text>
              <Text style={{ color: COLORS.textSecondary }}>
                {contact.phone || "-"}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
