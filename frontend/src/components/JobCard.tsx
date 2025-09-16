import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { JobSummary } from '../types';
import { colors } from '../theme/colors';

type Props = {
  job: JobSummary;
  onPress?: () => void;
};

export const JobCard: React.FC<Props> = ({ job, onPress }) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityHint="View job details"
      accessibilityLabel={`Job ${job.title}`}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={[styles.badge, styles.status]}>{job.status.toUpperCase()}</Text>
      </View>
      <Text style={styles.meta}>{job.location}</Text>
      <Text style={styles.meta}>{job.scheduledOn}</Text>
      <View style={styles.tagContainer}>
        {job.tags?.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  status: {
    backgroundColor: '#e1f5f2',
    color: colors.primary,
  },
  meta: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  tag: {
    backgroundColor: '#eef5f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});
