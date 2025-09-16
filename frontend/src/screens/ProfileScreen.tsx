import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';

export const ProfileScreen: React.FC = () => {
  const { user, refreshProfile, logout, isLoading } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{user.fullName}</Text>
        <Text style={styles.role}>{user.role === 'volunteer' ? 'Volunteer' : 'Requester'}</Text>
        <Text style={styles.meta}>{user.email}</Text>
        <Text style={styles.meta}>{user.phone}</Text>
        <Text style={styles.meta}>{user.address}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.body}>{user.biography || 'No biography provided yet.'}</Text>
      </View>

      {user.role === 'volunteer' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recognitions</Text>
          <Text style={styles.body}>Completed jobs: {user.completedJobs}</Text>
          <Text style={styles.body}>Rating: {user.rating.toFixed(1)}</Text>
          {!!user.skills?.length && <Text style={styles.body}>Skills: {user.skills.join(', ')}</Text>}
        </View>
      ) : null}

      {user.role === 'requester' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <Text style={styles.body}>
            {user.interests?.length ? user.interests.join(', ') : 'No specific interests recorded yet.'}
          </Text>
        </View>
      ) : null}

      <PrimaryButton title="Refresh profile" onPress={refreshProfile} disabled={isLoading} variant="secondary" />
      <PrimaryButton title="Log out" onPress={logout} variant="danger" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  role: {
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  meta: {
    color: colors.muted,
    marginBottom: 4,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
});
