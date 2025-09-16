export type UserRole = 'volunteer' | 'requester';

export type UserProfile = {
  id: string;
  role: UserRole;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  skills: string[];
  interests: string[];
  biography: string;
  rating: number;
  completedJobs: number;
  createdAt: string;
};

export type JobSummary = {
  id: string;
  title: string;
  requesterId: string;
  scheduledOn: string;
  location: string;
  distanceKm: number;
  tags: string[];
  status: string;
};

export type JobDetail = JobSummary & {
  description: string;
  meetingPoint: string;
  requirements: string[];
  latitude: number;
  longitude: number;
  contactName: string;
  contactNumber: string;
};

export type LoginResponse = {
  token: string;
  user: UserProfile;
};

export type Application = {
  id: string;
  jobId: string;
  volunteerId: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type VolunteerApplication = {
  application: Application;
  job: JobSummary;
};
