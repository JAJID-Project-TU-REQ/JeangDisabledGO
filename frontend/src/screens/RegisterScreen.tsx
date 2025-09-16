import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { RegisterPayload, useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { UserRole } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const defaultPayload: RegisterPayload = {
  role: 'volunteer',
  fullName: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  skills: [],
  interests: [],
  biography: '',
};

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, isLoading } = useAuth();
  const [payload, setPayload] = useState<RegisterPayload>(defaultPayload);
  const [skillsInput, setSkillsInput] = useState('');
  const [interestsInput, setInterestsInput] = useState('');

  const setField = <Key extends keyof RegisterPayload>(key: Key, value: RegisterPayload[Key]) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    if (!payload.fullName || !payload.email || !payload.password) {
      Alert.alert('Missing information', 'Full name, email, and password are required.');
      return;
    }

    try {
      await register({
        ...payload,
        skills: skillsInput
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        interests: interestsInput
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });
    } catch (error) {
      Alert.alert('Registration failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const renderRoleButton = (role: UserRole, label: string) => {
    const isActive = payload.role === role;
    return (
      <TouchableOpacity
        key={role}
        style={[styles.roleButton, isActive && styles.roleButtonActive]}
        onPress={() => setField('role', role)}
      >
        <Text style={[styles.roleButtonText, isActive && styles.roleButtonTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.wrapper}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        style={{ width: '100%' }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Join Disabled Go</Text>
        <Text style={styles.subheading}>Choose how you want to participate</Text>
        <View style={styles.roleSwitcher}>
          {renderRoleButton('volunteer', 'Volunteer')}
          {renderRoleButton('requester', 'Requester')}
        </View>

        <FormField
          label="Full name"
          value={payload.fullName}
          onChangeText={(text) => setField('fullName', text)}
          placeholder="Your full name"
        />
        <FormField
          label="Email"
          value={payload.email}
          onChangeText={(text) => setField('email', text)}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <FormField
          label="Phone"
          value={payload.phone}
          onChangeText={(text) => setField('phone', text)}
          keyboardType="phone-pad"
        />
        <FormField
          label="Address"
          value={payload.address}
          onChangeText={(text) => setField('address', text)}
        />
        <FormField
          label="Password"
          value={payload.password}
          onChangeText={(text) => setField('password', text)}
          secureTextEntry
        />
        <FormField
          label="Skills"
          value={skillsInput}
          onChangeText={setSkillsInput}
          placeholder="Wheelchair support, Thai, ..."
          helperText="Separate with commas"
        />
        <FormField
          label="Interests"
          value={interestsInput}
          onChangeText={setInterestsInput}
          placeholder="Hospital visits, Transportation"
          helperText="Separate with commas"
        />
        <FormField
          label="About you"
          value={payload.biography}
          onChangeText={(text) => setField('biography', text)}
          multiline
          numberOfLines={4}
          style={styles.multiline}
        />

        <PrimaryButton title="Create account" onPress={handleRegister} loading={isLoading} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
          <Text style={styles.signInLink}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  content: {
    paddingTop: 32,
    paddingBottom: 64,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subheading: {
    textAlign: 'center',
    color: colors.muted,
    marginBottom: 24,
  },
  roleSwitcher: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#e5f3f2',
    borderRadius: 999,
    padding: 6,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 999,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
  },
  roleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  multiline: {
    height: 120,
    textAlignVertical: 'top',
  },
  signInLink: {
    marginTop: 20,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '600',
  },
});
