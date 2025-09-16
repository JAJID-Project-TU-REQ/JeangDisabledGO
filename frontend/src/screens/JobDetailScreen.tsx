import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '../api/client';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { JobDetail } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

export const JobDetailScreen: React.FC<Props> = ({ route }) => {
  const { user } = useAuth();
  const [job, setJob] = useState<JobDetail>();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Ready to support you!');
  const [volunteerId, setVolunteerId] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  useEffect(() => {
    const loadJob = async () => {
      setLoading(true);
      try {
        const response = await api.getJob(route.params.jobId);
        setJob(response);
      } catch (error) {
        Alert.alert('Failed to load job', error instanceof Error ? error.message : 'Please try again later');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [route.params.jobId]);

  const handleApply = async () => {
    if (!user) return;
    try {
      await api.applyToJob(route.params.jobId, {
        volunteerId: user.id,
        message,
      });
      Alert.alert('Application sent', 'The requester has been notified of your interest.');
    } catch (error) {
      Alert.alert('Could not apply', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleComplete = async () => {
    if (!volunteerId.trim()) {
      Alert.alert('Volunteer required', 'Enter the volunteer ID to record feedback.');
      return;
    }
    const ratingValue = Number(rating);
    if (Number.isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
      Alert.alert('Invalid rating', 'Rating should be between 0 and 5.');
      return;
    }

    try {
      await api.completeJob(route.params.jobId, {
        volunteerId: volunteerId.trim(),
        rating: ratingValue,
        comment,
      });
      Alert.alert('Job closed', 'Feedback saved successfully.');
    } catch (error) {
      Alert.alert('Unable to close job', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const openMap = () => {
    if (!job) return;
    const { latitude, longitude } = job;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open maps');
    });
  };

  if (loading || !job) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isVolunteer = user?.role === 'volunteer';
  const isRequester = user?.role === 'requester';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}> 
      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.meta}>{job.location}</Text>
      <Text style={styles.meta}>Scheduled on {job.scheduledOn}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.bodyText}>{job.description}</Text>
        <Text style={styles.bodyText}>Meeting point: {job.meetingPoint}</Text>
        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Requirements</Text>
        {job.requirements.map((item) => (
          <Text key={item} style={styles.bullet}>• {item}</Text>
        ))}
      </View>
      <PrimaryButton title="Open in Maps" onPress={openMap} variant="secondary" />

      {isVolunteer ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply now</Text>
          <Text style={styles.bodyText}>Let the requester know how you can help.</Text>
          <TextInput
            style={[styles.textArea, styles.input]}
            placeholder="Message for requester"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />
          <PrimaryButton title="Send application" onPress={handleApply} />
        </View>
      ) : null}

      {isRequester ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Complete job</Text>
          <Text style={styles.bodyText}>
            Enter the volunteer ID and share a quick rating once the support has been provided.
          </Text>
          <FormField
            label="Volunteer ID"
            value={volunteerId}
            onChangeText={setVolunteerId}
            placeholder="volunteer-1"
          />
          <FormField
            label="Rating (0-5)"
            value={rating}
            onChangeText={setRating}
            keyboardType="decimal-pad"
          />
          <FormField
            label="Comment"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
          <PrimaryButton title="Record feedback" onPress={handleComplete} variant="secondary" />
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    color: colors.muted,
    marginBottom: 8,
  },
  section: {
    marginTop: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    borderColor: colors.border,
  },
  textArea: {
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: colors.card,
  },
});
