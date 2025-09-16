# Disabled Go Platform

Mobile-first volunteering platform connecting disabled community members with trained volunteers. The project contains a Go (Gin) API and a React Native (Expo, TypeScript) client that mirrors the wireframes shared in the spec.

## Project structure

- `backend/` – Gin server with in-memory storage, seed data, and REST APIs for authentication, jobs, applications, and feedback.
- `frontend/` – Expo app with React Navigation, role-aware flows for volunteers/requesters, and integration with the backend.

## Backend (Go + Gin)

### Requirements

- Go 1.21+

### Run locally

```bash
cd backend
go run main.go
```

The server starts on `http://localhost:8080` and exposes:

- `POST /api/auth/login` – Email based login (password accepted for flow validation only).
- `POST /api/auth/register` – Register volunteer/requester profiles.
- `GET /api/profiles/:id` – Fetch profile information.
- `GET /api/jobs` – Browse job summaries.
- `GET /api/jobs/:id` – Detailed job view with requirements and contact info.
- `POST /api/jobs` – Create jobs for a requester profile.
- `POST /api/jobs/:id/apply` – Submit a volunteer application.
- `POST /api/jobs/:id/feedback` – Mark a job completed with feedback.
- `GET /api/volunteers/:id/applications` – View volunteer applications.
- `GET /api/requesters/:id/jobs` – List jobs created by a requester.

The store is in-memory only. Restarting the server resets all data except for the seeded demo accounts and jobs.

## Frontend (React Native + Expo)

### Requirements

- Node 18+
- npm 9+
- Expo CLI

### Environment

The client reads `process.env.EXPO_PUBLIC_API_URL` to reach the API. Set it to your machine's LAN address so the mobile runtime can reach the Go server, e.g.

```bash
# from the frontend folder
EXPO_PUBLIC_API_URL=http://192.168.1.42:8080/api npm run start
```

Without the variable it defaults to `http://localhost:8080/api`, which only works in a simulator running on the same machine.

### Start Expo

```bash
cd frontend
npm install
npm run start
```

Open the project with iOS Simulator, Android emulator, or Expo Go.

### Demo credentials

- Volunteer: `anya.volunteer@example.com`
- Requester: `mali.nimman@example.com`
- Use any password for demo login (the backend matches by email for the prototype).

### App highlights

- **Authentication** – Login/registration flow with volunteer or requester roles.
- **Explore tab** – Browse jobs, open detailed views, launch directions in maps.
- **My Applications/Requests** – Volunteers see submissions; requesters can publish new requests and review existing ones.
- **Profile** – View role-specific information, refresh the profile, and sign out.

## Next steps

- Persist data with PostgreSQL or another database.
- Replace mock authentication with secure credential storage and hashing.
- Integrate push notifications for job updates.
- Add real maps (e.g., react-native-maps) and geolocation features.
