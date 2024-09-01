
---

# Hydroponic Monitoring App

This project is a mobile application built using **React Native**, with **Firebase** integration and **Android Studio** for development. It also includes an **app-server** using **Node.js** and a **model-server** using **Flask**. The app is designed to monitor and control hydroponic farming systems in real-time.

## Features

- Real-time monitoring of hydroponic parameters
- Anomaly detection with a machine learning model
- Node.js app-server for backend communication
- Flask model-server for ML-based processing
- Firebase integration for authentication and cloud database

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Mobile App Setup (React Native)](#2-mobile-app-setup-react-native)
  - [3. App-Server Setup (Node.js)](#3-app-server-setup-nodejs)
  - [4. Model-Server Setup (Flask)](#4-model-server-setup-flask)
  - [5. Firebase Setup](#5-firebase-setup)
  - [6. Running the Entire Project](#6-running-the-entire-project)
- [Contributing](#contributing)
- [License](#license)

---

## Prerequisites

Ensure the following are installed on your system:

- [Node.js](https://nodejs.org/) (for the app-server)
- [Python 3.x](https://www.python.org/downloads/) (for the Flask model-server)
- [Android Studio](https://developer.android.com/studio) (for mobile app development)
- [React Native CLI](https://reactnative.dev/docs/environment-setup)
- [Firebase Account](https://firebase.google.com/) (for backend services)
- [Git](https://git-scm.com/) (for cloning the repository)
- **A Firebase project** created in the Firebase Console with Authentication and Firestore enabled

---

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jjchan02/firebase-hydroponic-app.git
cd firebase-hydroponic-app
```

### 2. Mobile App Setup (React Native)

1. **Navigate to the app directory:**

   ```bash
   cd app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Firebase:**

   - Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
   - Enable **Authentication** and **Firestore**.
   - Download the `google-services.json` file and place it in the `android/app/` directory.

4. **Amend Firebase Configuration:**

   - Copy the `firebase.example.js` file to `firebase.js`:

     ```bash
     cp src/firebase.example.js src/firebase.js
     ```

   - Open `src/firebase.js` and update the `firebaseConfig` object with your Firebase project details. Replace the placeholder values with your actual Firebase configuration values:

     ```js
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       databaseURL: "YOUR_DATABASE_URL",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID",
       measurementId: "YOUR_MEASUREMENT_ID",
     };
     ```

5. **Launch the Android Emulator:**

   Open Android Studio, start an Android Virtual Device (AVD), and make sure it's running.

6. **Run the React Native App:**

   ```bash
   npx react-native run-android
   ```

   This will build and launch the mobile app on the emulator.

---

### 3. App-Server Setup (Node.js)

1. **Navigate to the app-server directory:**

   ```bash
   cd app-server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Firebase Admin SDK Configuration:**

   - In the `app-server` directory, create a `creds.json` file with your Firebase service account credentials (you can obtain these from the Firebase Console under "Service Accounts").
   - Example `creds.json` content (replace with your values):

     ```json
     {
       "type": "service_account",
       "project_id": "your_project_id",
       "private_key_id": "your_private_key_id",
       "private_key": "your_private_key",
       "client_email": "firebase-adminsdk-xxx@your_project_id.iam.gserviceaccount.com",
       "client_id": "your_client_id",
       "auth_uri": "https://accounts.google.com/o/oauth2/auth",
       "token_uri": "https://oauth2.googleapis.com/token",
       "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
       "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx@your_project_id.iam.gserviceaccount.com"
     }
     ```

4. **Configure Firebase Storage Bucket:**

   - Open `app-server/firebase.js` and locate the `initializeApp` function call.
   - Update the `storageBucket` parameter to match your Firebase Storage URL (you can obtain this from the Firebase Storage). For example:

     ```js
     initializeApp({
       credential: cert(serviceAccount),
       storageBucket: "gs://your-custom-storage-bucket-url.appspot.com",
     });
     ```

5. **Start the App-Server:**

   ```bash
   npm start
   ```

   The app-server should be running on `http://localhost:3000`.

---

### 4. Model-Server Setup (Flask)

1. **Navigate to the model-server directory:**

   ```bash
   cd model-server
   ```

2. **Create a virtual environment:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # For macOS/Linux
   venv\Scripts\activate  # For Windows
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask server:**

   ```bash
   flask run
   ```

   The model-server should be running on `http://localhost:5000`.

---

### 5. Firebase Setup

1. In the Firebase Console, go to **Project Settings** and download the `google-services.json` file for Android.
2. Add the Firebase configuration to both the **app-server** and **mobile app**.
3. Enable **Firestore**, **Authentication**, and **Firebase Storage** as required for the project.

---

### 6. Running the Entire Project

To run the full system:

1. **Start the Mobile App:**

   ```bash
   npx react-native run-android
   ```

2. **Start the App-Server:**

   ```bash
   cd app-server
   npm start
   ```

3. **Start the Model-Server:**

   ```bash
   cd model-server
   flask run
   ```

Now, the app should be fully operational, with the mobile app communicating with the app-server and model-server.

---
