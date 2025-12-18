# Maximize Holidays

[![Deploy to GitHub Pages](https://github.com/YOUR_USERNAME/maximize_holidays/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/maximize_holidays/actions/workflows/deploy.yml)

🔗 **[Live Demo](https://YOUR_USERNAME.github.io/maximize_holidays/)**

A smart holiday planning application that helps you find the best days to take leave to get the longest possible vacation blocks.

This application is a highly configurable "decision support tool" that allows you to define all your leave and holiday constraints, and then presents a ranked list of all possible long weekend opportunities for you to choose from.

## Features

- **Interactive Calendar:** A full-year calendar to visualize your holiday plan.
- **Dynamic Leave Calculation:**
    - Input your number of Casual Leaves.
    - The number of Earned Leaves is automatically calculated based on your company's policy (e.g., 1 leave per 23 working days).
    - The total number of Earned Leaves dynamically updates as you select opportunities.
- **Customizable Holiday & Leave Types:**
    - **Public Holidays:** Load a default set of holidays for the year, and manually add or remove them by clicking on the calendar.
    - **Optional Holidays:** Provide a list of optional holiday dates and specify how many of them you can take.
    - **Required Holidays:** Select dates that you *must* take off. These will be factored into all calculations.
- **Long Weekend Opportunities:**
    - The app finds all possible opportunities to create long weekends by "bridging" gaps between non-working days.
    - The results are grouped by month and ranked by the length of the holiday you'll get.
- **Interactive Planner:**
    - Select opportunities from the ranked list.
    - Your remaining leave balances (Casual, Earned, Optional) update in real-time.
    - The calendar highlights your complete holiday block when an opportunity is selected.
- **Full Configuration:**
    - Configure the rule for earned leave accrual.
    - Configure the maximum number of leave days to suggest for a single opportunity.
    - Customize the colors for all day types on the calendar.
- **Persistent State:** All your inputs, selections, and color preferences are saved in your browser's `localStorage`.
- **Reset:** A "Reset" button to clear all data and start fresh.

## Tech Stack

- React (using Vite)
- Bootstrap 5 for styling

## Setup and Running Locally

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions. Any push to the `main` branch will trigger the deployment workflow.

**Live Application:** https://YOUR_USERNAME.github.io/maximize_holidays/

### Manual Deployment Steps:
1. Push your code to the `main` branch
2. GitHub Actions will automatically build and deploy to GitHub Pages
3. The site will be available at the URL above within a few minutes
