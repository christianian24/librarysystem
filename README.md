# Library Management System

A modern, web-based Library Management System designed to efficiently manage books, members, and borrowing transactions. Built with a clean and responsive user interface using shadcn-ui and Supabase.

## Features

-   **Book Management**: Add, edit, delete, and search for books in the library catalog. Track book availability status.
-   **Member Management**: Register new members, manage member information, and view their transaction history.
-   **Transaction Tracking**: Issue books to members and record returns. Keep track of due dates and overdue items.
-   **Dashboard**: An overview of key library statistics.
-   **Responsive Design**: Fully usable on both desktop and mobile devices.

## Tech Stack

-   **Frontend**:
    -   [React](https://react.dev/) - A JavaScript library for building user interfaces.
    -   [Vite](https://vitejs.dev/) - A fast frontend build tool.
    -   [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript for robust application development.
    -   [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework.
    -   [shadcn-ui](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS.
-   **Backend**:
    -   [Supabase](https://supabase.io/) - An open-source Firebase alternative for database, authentication, and storage.

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm (or yarn/pnpm)
-   A free Supabase account.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <YOUR_GIT_URL>
    cd lend-a-hand-lms
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase:**
    -   Create a new project on [Supabase](https://app.supabase.com).
    -   Navigate to the **SQL Editor** in your Supabase project dashboard.
    -   Copy the entire content of `supabase/migrations/20251008022130_9a88d336-59f0-4ad8-b1a0-0565f3dd01b5.sql` and run it to create the necessary tables and policies.

4.  **Configure Environment Variables:**
    -   In your Supabase project, go to **Project Settings** > **API**.
    -   Create a `.env` file in the root of your project.
    -   Copy your **Project URL** and **`anon` public key** into the `.env` file:
        ```
        VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
        VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_KEY"
        ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:8080`.
