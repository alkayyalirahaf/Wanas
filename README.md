# Wanas – ونس

**A Community Support Platform**

Wanas is a web-based community support platform designed to connect people who share similar life challenges and experiences. It provides a supportive environment where members can join relevant communities, participate in events, and connect with specialists.

## Project Overview

Wanas focuses on building supportive communities based on shared experiences, such as:

- Cancer survivors.
- Family members and caregivers of cancer patients.
- People going through fertility and IVF journeys.
- Individuals recovering from addiction.

The platform aims to make peer support and access to professional guidance more accessible.

## Tech Stack

### Backend
- PHP
- Laravel 12
- MySQL
- Laravel Sanctum for API authentication
- RESTful APIs

### Frontend
- HTML5
- CSS3
- JavaScript
- Axios

## Implemented Features

### Admin Dashboard

The Admin Dashboard provides administrative tools for managing the platform.

- **Admin Authentication:** Secure admin login and protected API routes.
- **Dashboard Overview:** Statistics and activity summaries.
- **Specialist Verification:** Review and approve or reject specialist applications.
- **Facilitator Applications:** Review facilitator applications and manage their approval status.
- **Reports Management:** View reports and update their statuses.
- **User Management:** Search, filter, view, block, unblock, soft-delete, and restore users.
- **Groups Management:** View, search, archive, activate, soft-delete, and restore groups.
- **Events Management:** View, search, soft-delete, and restore events.
- **Payments Records:** View and filter specialist session payment records.

### Backend API

- RESTful API routes defined in Laravel's `routes/api.php`.
- Controllers handle incoming requests and return JSON responses.
- Request validation to help prevent invalid data.
- Authentication and authorization middleware.
- Appropriate HTTP status codes and error responses.
- Soft deletion and restoration for supported models.

## Project Structure

```text
wanass/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── Admin/
│   │   └── Middleware/
│   └── Models/
├── database/
│   ├── migrations/
│   └── seeders/
├── public/
│   └── frontend/
│       ├── css/
│       ├── html/
│       └── js/
├── routes/
│   ├── api.php
│   └── web.php
├── tests/
│   └── Feature/
│       └── Api/
│           └── Admin/
└── README.md
```

## Installation and Setup

### Prerequisites

Make sure you have the following installed:

- PHP 8.2 or later, with the required Laravel extensions.
- Composer.
- MySQL.
- A local development environment such as XAMPP.

### 1. Clone the Repository

```bash
git https://github.com/alkayyalirahaf/Wanas.git
cd wanass
```

### 2. Install Dependencies

```bash
composer install
```

###