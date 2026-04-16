# Campus Marketplace

A modern full-stack campus marketplace with Django REST Framework backend and React frontend.

## Features

- User authentication with JWT
- Product listing and search
- Shopping cart and orders
- Responsive design
- Modern UI with toast notifications

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate virtual environment:
   ```bash
   python -m venv myenv
   myenv\Scripts\activate  # On Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `.env` file with your settings (see `.env` example)
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the server:
   ```bash
   python manage.py runserver
   ```

API available at `http://127.0.0.1:8000/api/`.

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

Frontend available at `http://localhost:5173`.

## Development

- **Linting:** `npm run lint`
- **Fix linting:** `npm run lint:fix`
- **Format code:** `npm run format`
- **Run tests:** `npm run test`
- **Build:** `npm run build`

## Tech Stack

- **Backend:** Django, DRF, JWT, SQLite
- **Frontend:** React 18, Vite, React Router, Hot Toast
- **Styling:** CSS with CSS Variables
- **Tools:** ESLint, Prettier

- JWT authentication for login and registration
- Custom user model with `client` and `worker` roles (seller / buyer)
- Sellers can post products and review purchase requests
- Buyers can view products and send requests to buy
- Sellers can accept or reject buyer requests
- Product categories for better browsing
- Product detail pages with messaging / chat
- Search by product title, description, location, and category
- Pagination for list endpoints

## Notes

- Backend uses SQLite for easy local setup.
- CORS is enabled for local frontend development.
- Update `SECRET_KEY` in `backend/backend/settings.py` before deploying to production.
