# FaceAuth Attendance System - API Reference

This document outlines the REST API endpoints required for the backend implementation (Flask/FastAPI).

## Base URL
`http://localhost:5000/api`

## Authentication

### Login
*   **POST** `/login`
*   **Body**: `{ "username": "string", "password": "string" }`
*   **Response**: `{ "id": "1", "name": "Admin", "role": "ADMIN", "token": "..." }`

## Students

### Get All Students
*   **GET** `/students`
*   **Response**: `[ { "id": "1", "name": "John", "enrollmentNo": "CS101", "photoCount": 5, ... } ]`

### Add Student
*   **POST** `/students`
*   **Body**: `{ "name": "John", "enrollmentNo": "CS101", "email": "john@test.com", "branch": "CSE", "semester": 1, "enrolledSubjects": ["CS101"] }`

### Upload Training Photos
*   **POST** `/students/:id/images`
*   **Body**: `{ "image": "base64_string..." }`
*   **Description**: Appends a face image to the student's dataset folder for training.

## Face Recognition Model

### Train Model
*   **POST** `/train`
*   **Response**: `{ "message": "Model trained successfully", "faces_encoded": 150 }`
*   **Description**: Triggers the embedding generation process for all students with uploaded photos.

### Recognize Face (Mark Attendance)
*   **POST** `/recognize`
*   **Body**: `{ "image": "base64_string...", "window_id": "session_101" }`
*   **Response**: 
    *   Success: `{ "success": true, "student": "John Doe", "enrollmentNo": "CS101" }`
    *   Failure: `{ "success": false, "message": "Unknown Face" }`

## Attendance & Sessions

### Get Sessions
*   **GET** `/sessions`
*   **Response**: List of active and past class sessions.

### Create Session
*   **POST** `/sessions`
*   **Body**: `{ "subjectCode": "CS301" }`
*   **Description**: Opens a time window for attendance.

### Get Attendance History
*   **GET** `/attendance/history?enrollmentNo=CS101`
*   **Response**: List of attendance records for a specific student.

### Manual Attendance Update
*   **POST** `/attendance/manual`
*   **Body**: `{ "enrollmentNo": "CS101", "subject": "CS301", "date": "2023-10-25", "status": "Present" }`
*   **Description**: Allows faculty to manually override attendance.

## Subjects & Faculty

### Get Subjects
*   **GET** `/subjects`

### Add Subject
*   **POST** `/subjects`
*   **Body**: `{ "code": "CS301", "name": "Data Structures" }`

### Get Faculties
*   **GET** `/faculties`

### Add Faculty
*   **POST** `/faculties`
*   **Body**: `{ "name": "Dr. Smith", "email": "smith@test.com", "assignedSubjects": ["CS301"] }`
