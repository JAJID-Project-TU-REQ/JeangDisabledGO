import { Application, JobDetail, JobSummary, LoginResponse, UserProfile, VolunteerApplication } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...jsonHeaders,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload?.error ?? message;
    } catch (error) {
      // ignore json parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: Partial<UserProfile> & { role: UserProfile['role']; password: string }) =>
    request<UserProfile>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getJobs: () => request<{ jobs: JobSummary[] }>('/jobs'),

  getJob: (id: string) => request<JobDetail>(`/jobs/${id}`),

  createJob: (payload: {
    requesterId: string;
    title: string;
    scheduledOn: string;
    location: string;
    meetingPoint: string;
    description: string;
    requirements: string[];
    latitude: number;
    longitude: number;
  }) =>
    request<JobDetail>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  applyToJob: (jobId: string, payload: { volunteerId: string; message: string }) =>
    request<{ id: string }>(`/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  completeJob: (jobId: string, payload: { volunteerId: string; rating: number; comment: string }) =>
    request(`/jobs/${jobId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getProfile: (id: string) => request<UserProfile>(`/profiles/${id}`),

  getVolunteerApplications: (id: string) =>
    request<{ items: VolunteerApplication[] }>(`/volunteers/${id}/applications`),

  getRequesterJobs: (id: string) => request<{ jobs: JobSummary[] }>(`/requesters/${id}/jobs`),
};

export { API_BASE_URL };
