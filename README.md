# YouTube Backend Clone

A backend server that mimics core functionalities of YouTube, allowing users to upload videos, subscribe to channels, like/dislike content, and fetch video feeds. Built with Node.js, Express, and MongoDB.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture & Database Schema](#architecture--database-schema)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Environment Variables](#environment-variables)
7. [Running the Server](#running-the-server)
8. [API Endpoints](#api-endpoints)
9. [Project Structure](#project-structure)
10. [Contributing](#contributing)

---

## Features

* **User Management**: Register, login, update profile
* **Subscriptions**: Subscribe/unsubscribe to channels
* **Video Management**: Upload, update, delete videos
* **Interactions**: Like/dislike videos
* **Feeds & Discovery**: Fetch trending, subscriptions feed, recommendations
* **Search**: Query videos by title, tags, or channel name

---

## Tech Stack

* **Runtime:** Node.js v18+
* **Web Framework:** Express.js
* **Database:** MongoDB with Mongoose ODM
* **Authentication:** JWT-based authentication
* **Storage:** Local file system (or AWS S3)
* **Testing:** Jest & Supertest

---

## Architecture & Database Schema

### Collections (Refer the models for more details)

1. **Users**

   * `_id`: ObjectId
   * `username`: String (unique)
   * `email`: String (unique)
   * `password`: String (hashed)
   * `subscribersCount`: Number
   * `subscriptionsCount`: Number

2. **Videos**

   * `_id`: ObjectId
   * `uploader`: ObjectId → references `Users`
   * `title`: String
   * `description`: String
   * `url`: String
   * `likes`: Number
   * `dislikes`: Number
   * `tags`: \[String]
   * `views`: Number
   * `createdAt`: Date

3. **Subscriptions**

   * `_id`: ObjectId
   * `subscriber`: ObjectId → `Users`
   * `channel`: ObjectId → `Users`


## Prerequisites

* Node.js v18 or higher
* MongoDB instance (local or cloud)
* npm or yarn

---

## Installation

```bash
# Clone the repository
git clone https://github.com/code-dipanshuRaj/youtube-backend-clone.git
cd youtube-backend-clone

# Install dependencies
npm install
# or
yarn install
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/youtube_clone
JWT_SECRET=your_jwt_secret
```

---

## Running the Server

```bash
# Development mode (with nodemon)
npm run dev
```

The server will start on `http://localhost:5000` by default.

---

## API Endpoints

### Auth

| Method | Endpoint             | Description              | Auth |
| ------ | -------------------- | ------------------------ | ---- |
| POST   | `/api/auth/register` | Register a new user      | No   |
| POST   | `/api/auth/login`    | Login and retrieve token | No   |

### Users

| Method | Endpoint                             | Description         | Auth |
| ------ | ------------------------------------ | ------------------- | ---- |
| GET    | `/api/users/:id`                     | Get user details    | No   |
| PUT    | `/api/users/change-details`          | Update user-name    | Yes  |
| POST   | `/api/users/refresh-token`           | Update refresh token| Yes  |
| PATCH  | `/api/users/change-password`         | Change Password     | Yes  |
| PATCH  | `/api/users/change-avatar`           | Update avatar       | Yes  |
| GET    | `/api/users/channel/:username`       | Update user profile | Yes  |
| GET    | `/api/users/watch-history/:username` | Update user profile | Yes  |

### Videos (Need to be done!)

| Method | Endpoint                       | Description            | Auth |
| ------ | ------------------------------ | ---------------------- | ---- |
| POST   | `/api/videos`                  | Upload a new video     | Yes  |
| GET    | `/api/videos/:id`              | Get video details      | No   |
| PUT    | `/api/videos/:id`              | Update video metadata  | Yes  |
| DELETE | `/api/videos/:id`              | Delete a video         | Yes  |
| GET    | `/api/videos/timeline/:userId` | Get subscription feed  | Yes  |
| GET    | `/api/videos/random`           | Get recommended videos | No   |
| GET    | `/api/videos/trending`         | Get trending videos    | No   |
| GET    | `/api/videos/search`           | Search videos by query | No   |

---

## Project Structure

```
├── src
│   ├── controllers    # Request handlers
│   ├── models         # Mongoose schemas
│   ├── routes         # Express routes
│   ├── middlewares    # Auth and validation
│   ├── utils          # Helper functions
│   └── index.js       # Entry point
├── .env.example
├── package.json
└── README.md
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/name`
3. Commit your changes: `git commit -m "feat: description"`
4. Push to the branch: `git push origin feature/name`
5. Open a Pull Request

---
