# TaskGraph

TaskGraph is a dependency-aware task management web app that visualizes work as an interactive graph.  
It helps users create tasks, link prerequisites, detect invalid dependency chains, highlight blocked work, and manage progress with Firebase-backed persistence.

## Overview

This project was built as a Task Dependency Visualizer with a professional workflow-oriented UI.  
Each authenticated user gets a private board where tasks are stored as nodes and dependencies are stored as graph edges.

Core outcomes:

- Visualize tasks as graph nodes
- Link tasks through dependency relationships
- Prevent circular and invalid dependencies
- Highlight blocked tasks automatically
- Persist each user board with Firebase Authentication and Cloud Firestore
- Support search, filtering, board export/import, and responsive interaction

## Key Features

### Task and dependency management

- Create tasks as graph nodes
- Link parent and child tasks as dependencies
- Delete tasks and remove linked dependencies
- Mark tasks as complete or pending
- Reset the entire board when needed

### Workflow intelligence

- Detect circular dependencies before saving
- Prevent self-links and duplicate links
- Block completion when prerequisite tasks are still pending
- Highlight blocked tasks in the graph and status summary

### Graph UI

- Interactive React Flow canvas
- MiniMap, zoom controls, and grid background
- Drag-to-connect dependencies directly on the graph
- Saved node positioning
- Layout switching for vertical, sideways, upward, and reverse flow views

### Productivity features

- Search tasks by name
- Filter tasks by workflow status
- Real-time status summary for total, completed, pending, blocked, ready, and unlinked tasks
- Export board data as JSON
- Import board data from JSON with validation

### Authentication and profile

- Sign up with full name, email, and password
- Sign in with Firebase Authentication
- Forgot password email flow
- Profile page for display name updates
- Password change flow with current password confirmation

### UX and presentation

- Light and dark theme support
- Animated auth screens and dashboard welcome banner
- Responsive layout for desktop and mobile
- Professional inline validation and friendly error messaging

## Tech Stack

- React 19
- React Flow
- Firebase Authentication
- Cloud Firestore
- Dagre for graph layout
- TypeScript-ready setup with gradual migration support
- Jest + React Testing Library

## Project Structure

```text
src/
  App.tsx                 Main dashboard and graph experience
  Landing.tsx             Marketing / landing page
  Login.tsx               Sign-in flow and shared auth shell
  Signup.tsx              Sign-up flow
  Profile.tsx             Profile and password management
  taskLogic.ts            Dependency rules and workflow logic
  boardTransfer.ts        Export / import helpers
  authValidation.ts       Auth validation and messaging helpers
  welcomeGreeting.ts      Time-based welcome banner logic
  userDisplay.ts          User name formatting helpers
  themePreference.ts      Theme preference state
  firebase.ts             Firebase app, auth, and Firestore setup
  index.tsx               Main React entry
  index.js                Compatibility shim for CRA entry resolution
```

Important note:

- Some `.js` files remain as lightweight compatibility wrappers while the project transitions to TypeScript.
- The primary implementation lives in `.ts` and `.tsx` files.

## Getting Started

### 1. Prerequisites

Install these first:

- Node.js 18+ recommended
- npm 9+ recommended
- A Firebase project with Authentication and Firestore enabled

### 2. Clone and install

```bash
git clone <your-repository-url>
cd task-visualizer
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

Use the following keys:

```env
REACT_APP_API_KEY=
REACT_APP_AUTH_DOMAIN=
REACT_APP_PROJECT_ID=
REACT_APP_STORAGE_BUCKET=
REACT_APP_MESSAGING_SENDER_ID=
REACT_APP_APP_ID=
```

These values come from your Firebase project settings.

Project code reads them in [src/firebase.ts](src/firebase.ts).

### 4. Configure Firebase Authentication

In Firebase Console:

1. Open **Authentication**
2. Enable **Email/Password**
3. Confirm your users appear under **Authentication > Users**

This app uses:

- sign up
- sign in
- password reset email
- password update

### 5. Configure Firestore

Create a Firestore database in your Firebase project and publish the rules from [firestore.rules](firestore.rules).

This project stores data under:

```text
users/{uid}/nodes
users/{uid}/edges
```

The included rules enforce:

- authenticated access only
- owner-only board access
- node document validation
- edge document validation
- self-link prevention at the rules layer

### 6. Start the development server

```bash
npm start
```

The app runs at:

```text
http://localhost:3000
```

## Available Scripts

### Start the app

```bash
npm start
```

Starts the Create React App development server.

### Run tests

```bash
npm test -- --watchAll=false --runInBand
```

Runs the project test suite once in a stable non-watch mode.

### Type-check the project

```bash
npx tsc --noEmit
```

Validates the TypeScript setup without generating output files.

### Production build

```bash
npm run build
```

Creates an optimized production build in the `build/` folder.

## User Workflow

### Authentication flow

1. Open the landing page
2. Go to sign in or create account
3. Register with full name, email, and password
4. Sign in to access your private board
5. Use `Forgot password?` if needed
6. Update display name or password from the profile page

### Task workflow

1. Add a task
2. Add more tasks
3. Link dependencies
4. Watch blocked tasks update automatically
5. Complete prerequisite tasks to unlock blocked tasks
6. Search, filter, move, or export the board as needed

## Dependency Rules

TaskGraph enforces these core logic rules:

- A task cannot depend on itself
- Duplicate dependency links are blocked
- Circular dependencies are rejected
- A task cannot be completed if prerequisite tasks are still pending
- Imported board files are validated before being accepted

## Board Data Model

### Node shape

```json
{
  "id": "task-id",
  "data": {
    "label": "Task name",
    "completed": false
  },
  "position": {
    "x": 0,
    "y": 0
  }
}
```

### Edge shape

```json
{
  "id": "esource-target",
  "source": "source-task-id",
  "target": "target-task-id",
  "animated": true
}
```

Firestore edge document IDs follow:

```text
sourceId__targetId
```

## Testing Coverage

The test suite currently covers:

- dependency validation
- cycle detection
- blocked-task logic
- status summaries
- auth validation
- export/import validation
- welcome greeting logic

Main test files:

- [src/App.test.tsx](src/App.test.tsx)
- [src/taskLogic.test.ts](src/taskLogic.test.ts)
- [src/boardTransfer.test.ts](src/boardTransfer.test.ts)
- [src/authValidation.test.ts](src/authValidation.test.ts)
- [src/welcomeGreeting.test.ts](src/welcomeGreeting.test.ts)

## Important Files

- [src/App.tsx](src/App.tsx): dashboard, graph canvas, task actions, summaries, filters, import/export
- [src/Login.tsx](src/Login.tsx): shared auth shell and sign-in experience
- [src/Signup.tsx](src/Signup.tsx): account creation and password strength validation
- [src/Profile.tsx](src/Profile.tsx): display name and password management
- [src/taskLogic.ts](src/taskLogic.ts): core dependency engine
- [src/boardTransfer.ts](src/boardTransfer.ts): JSON export/import parsing and validation
- [src/authValidation.ts](src/authValidation.ts): auth field validation and friendly messaging
- [src/firebase.ts](src/firebase.ts): Firebase initialization
- [firestore.rules](firestore.rules): Firestore authorization and document validation

## Troubleshooting

### App starts but authentication fails

Check:

- `.env` values are present
- Firebase Authentication is enabled
- the correct Firebase project is being used

### Password reset email does not arrive

Check:

- the user exists in **Authentication > Users**
- Email/Password sign-in is enabled
- the email inbox spam/promotions folders

### Firestore permission errors

Check:

- published Firestore rules match this repo
- the user is signed in
- writes are going under `users/{uid}/nodes` and `users/{uid}/edges`

### TypeScript editor warnings

This repo uses a gradual migration approach.

- main logic files are TypeScript
- some `.js` wrapper files remain intentionally for compatibility
- run `npx tsc --noEmit` to confirm the project type-checks cleanly

## Security Notes

- Do not commit real Firebase secrets for other environments
- Keep your `.env` file local unless you intentionally want those values in source control
- Firestore rules should be published before using the app in production

## Future Improvements

Potential next steps:

- remove the remaining compatibility `.js` wrappers after a full TS-only entry migration
- add richer graph editing interactions
- add collaboration or shared boards
- add backend-side validation beyond Firestore rules if needed

## License

This project is currently private and intended for project or internship use unless you choose to add a formal license.
