import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../api/client';
import { FormField } from '../components/FormField';
import { JobCard } from '../components/JobCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { JobSummary, VolunteerApplication } from '../types';
import { RootStackParamList } from '../navigation/types';

const defaultJobForm = {
  title: '',
  scheduledOn: '',
  location: '',
  meetingPoint: '',
  description: '',
  requirements: '',
  latitude: '',
  longitude: '',
};

export const MyJobsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [jobForm, setJobForm] = useState(defaultJobForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'volunteer') {
        const response = await api.getVolunteerApplications(user.id);
        setApplications(response.items);
      } else {
        const response = await api.getRequesterJobs(user.id);
        setJobs(response.jobs);
      }
    } catch (error) {
      Alert.alert('Unable to load data', error instanceof Error ? error.message : 'Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const setField = (field: keyof typeof jobForm, value: string) => {
    setJobForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateJob = async () => {
    if (!user) return;
    if (!jobForm.title || !jobForm.description) {
      Alert.alert('Missing information', 'Title and description are required.');
      return;
    }

    const latitude = Number(jobForm.latitude || '0');
    const longitude = Number(jobForm.longitude || '0');

    setSubmitting(true);
    try {
      await api.createJob({
        requesterId: user.id,
        title: jobForm.title,
        description: jobForm.description,
        meetingPoint: jobForm.meetingPoint,
        scheduledOn: jobForm.scheduledOn,
        location: jobForm.location,
        requirements: jobForm.requirements
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        latitude: Number.isNaN(latitude) ? 0 : latitude,
        longitude: Number.isNaN(longitude) ? 0 : longitude,
      });
      Alert.alert('Request created', 'Volunteers will now be able to view your request.');
      setJobForm(defaultJobForm);
      await loadData();
    } catch (error) {
      Alert.alert('Unable to create request', error instanceof Error ? error.message : 'Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (user.role === 'volunteer') {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>My applications</Text>
        <FlatList
          data={applications}
          keyExtractor={(item) => item.application.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>No applications yet.</Text> : null}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.job.title}</Text>
              <Text style={styles.cardMeta}>Status: {item.application.status}</Text>
              <Text style={styles.cardMeta}>Submitted on {new Date(item.application.createdAt).toLocaleDateString()}</Text>
              <PrimaryButton
                title="View details"
                onPress={() => navigation.navigate('JobDetail', { jobId: item.job.id })}
                variant="secondary"
              />
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.requesterContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Text style={styles.heading}>Create a new request</Text>
        <FormField label="Title" value={jobForm.title} onChangeText={(text) => setField('title', text)} />
        <FormField
          label="Scheduled on"
          value={jobForm.scheduledOn}
          onChangeText={(text) => setField('scheduledOn', text)}
          placeholder="2025-02-15"
        />
        <FormField
          label="Location"
          value={jobForm.location}
          onChangeText={(text) => setField('location', text)}
          placeholder="Hospital, district"
        />
        <FormField
          label="Meeting point"
          value={jobForm.meetingPoint}
          onChangeText={(text) => setField('meetingPoint', text)}
        />
        <FormField
          label="Requirements"
          value={jobForm.requirements}
          onChangeText={(text) => setField('requirements', text)}
          placeholder="Wheelchair handling, Thai language"
          helperText="Separate with commas"
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          value={jobForm.description}
          onChangeText={(text) => setField('description', text)}
          placeholder="Share details for volunteers"
          placeholderTextColor={colors.muted}
        />
        <View style={styles.inlineFields}>
          <FormField
            label="Latitude"
            value={jobForm.latitude}
            onChangeText={(text) => setField('latitude', text)}
            keyboardType="decimal-pad"
            containerStyle={styles.inlineField}
          />
          <FormField
            label="Longitude"
            value={jobForm.longitude}
            onChangeText={(text) => setField('longitude', text)}
            keyboardType="decimal-pad"
            containerStyle={styles.inlineField}
          />
        </View>
        <PrimaryButton title="Publish request" onPress={handleCreateJob} loading={submitting} />

        <Text style={[styles.heading, { marginTop: 32 }]}>Your requests</Text>
        {jobs.length === 0 ? (
          <Text style={styles.empty}>No requests yet. Create one above to get started.</Text>
        ) : (
          jobs.map((job) => (
            <JobCard key={job.id} job={job} onPress={() => navigation.navigate('JobDetail', { jobId: job.id })} />
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 16,
    color: colors.text,
  },
  listContent: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardMeta: {
    color: colors.muted,
    marginBottom: 4,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 24,
  },
  requesterContent: {
    paddingBottom: 64,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.card,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  inlineFields: {
    flexDirection: 'row',
    columnGap: 12,
  },
  inlineField: {
    flex: 1,
  },
});
