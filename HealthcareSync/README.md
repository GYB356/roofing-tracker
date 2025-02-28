# HealthcareSync Platform

HealthcareSync is a full-stack healthcare synchronization platform built with Node.js/TypeScript, Prisma, Express, and React/Next.js.

## Development Setup

### Local Development

1. Clone the repository
2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env` in the backend directory
- Update the following variables:
  ```
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthcare
  PORT=5000
  NODE_ENV=development
  ```

4. Start the development servers:
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm run dev
```

The backend will be available at `http://localhost:5000` and the frontend at `http://localhost:3000`.

### Replit Development

When developing on Replit:
1. The platform will automatically install dependencies
2. Environment variables are managed through Replit's Secrets system
3. The server must be run through Replit's workflow system
4. Access the application through your Replit URL

## Features

- User authentication and authorization
- Patient management
- Appointment scheduling
- Health metrics tracking
- Medical records management
- WebSocket real-time updates

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy the `.env.example` file to `.env` and update the variables as needed.

4. Set up the database:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

## Backend Architecture

The backend follows a modular architecture:

- **API Routes**: Entry points for the REST API
- **Services**: Business logic for each domain
- **Middleware**: Authentication, error handling, etc.
- **Utils**: Reusable utilities and helpers
- **Prisma Schema**: Database models and relationships

## Frontend Architecture

The frontend is built with React and follows a component-based architecture:

- **Pages**: Main application views (auth, dashboard, etc.)
- **Components**: Reusable UI elements
- **Hooks**: Custom React hooks for data fetching, etc.
- **Lib**: Utilities for API calls, authentication, etc.

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/logout` - Logout a user
- `GET /api/auth/me` - Get current user profile

### Patients

- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get a patient by ID
- `POST /api/patients` - Create a new patient
- `PUT /api/patients/:id` - Update a patient
- `DELETE /api/patients/:id` - Delete a patient
- `GET /api/patients/:id/health-metrics` - Get patient health metrics
- `GET /api/patients/:id/medical-records` - Get patient medical records

### Appointments

- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get an appointment by ID
- `POST /api/appointments` - Create a new appointment
- `PUT /api/appointments/:id` - Update an appointment
- `DELETE /api/appointments/:id` - Delete an appointment
- `GET /api/appointments/patient/:patientId` - Get appointments by patient
- `GET /api/appointments/doctor/:doctorId` - Get appointments by doctor

### Health Metrics

- `GET /api/health-metrics` - Get all health metrics
- `GET /api/health-metrics/:id` - Get a health metric by ID
- `POST /api/health-metrics` - Create a new health metric
- `PUT /api/health-metrics/:id` - Update a health metric
- `DELETE /api/health-metrics/:id` - Delete a health metric
- `GET /api/health-metrics/patient/:patientId` - Get health metrics by patient
- `GET /api/health-metrics/patient/:patientId/type/:type` - Get health metrics by type

## Testing

Run unit tests:

```bash
npm test
```

## Deployment

The application can be deployed to Replit by clicking the Run button or using the deployment configuration.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request