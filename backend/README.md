# QuickStore Backend

Python FastAPI backend for the QuickStore POS system with PostgreSQL database.

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` to set your database connection and JWT secret.

### 3. Initialize Database

Create the database (if it doesn't exist):

```bash
# Connect to PostgreSQL and create database
psql -h 192.168.50.62 -U postgres
CREATE DATABASE quickstore;
\q
```

Run migrations to create tables:

```bash
alembic upgrade head
```

### 4. Create Admin User

```bash
python seed_admin.py
```

Default admin credentials:
- Username: `admin`
- Password: `admin123`

**IMPORTANT:** Change the password after first login!

### 5. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/me` - Get current user info

### Admin (Admin Only)
- `POST /api/admin/companies` - Create company
- `GET /api/admin/companies` - List companies
- `PATCH /api/admin/companies/{id}` - Update company
- `POST /api/admin/users` - Create user
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/{id}` - Update user

### Stores
- `POST /api/stores` - Create store
- `GET /api/stores` - List stores
- `GET /api/stores/current` - Get current store
- `PATCH /api/stores/{id}` - Update store
- `DELETE /api/stores/{id}` - Delete store

### Products
- `POST /api/products` - Create product
- `GET /api/products` - List products
- `GET /api/products/{id}` - Get product
- `PATCH /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Combos
- `POST /api/combos` - Create combo
- `GET /api/combos` - List combos
- `GET /api/combos/{id}` - Get combo
- `PATCH /api/combos/{id}` - Update combo
- `DELETE /api/combos/{id}` - Delete combo

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/today` - List today's orders
- `GET /api/orders/{id}` - Get order
- `PATCH /api/orders/{id}` - Update order
- `DELETE /api/orders/{id}` - Delete order

### Sessions
- `GET /api/sessions/today` - Get today's session
- `GET /api/sessions/{date}` - Get session by date
- `PATCH /api/sessions/{id}/export` - Mark session as exported

### Customers
- `GET /api/customers` - Get customer names
- `GET /api/customers/names` - Get simple list of names

## Database Migrations

### Create a new migration

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations

```bash
alembic upgrade head
```

### Rollback migration

```bash
alembic downgrade -1
```

## Architecture

### Multi-Tenancy Model

```
Admin Account
  └─ Creates → User Accounts
                └─ Assigned to → Company
                                  └─ Has → Store → Products, Orders
```

### Key Features

1. **Role-Based Access Control**
   - Admin: Can create companies and users
   - User: Can manage their company's store and data

2. **Row-Level Security**
   - All queries automatically filtered by company_id
   - Users can only access their company's data

3. **Inventory Management**
   - Automatic stock updates on order create/edit/delete
   - Transactional consistency
   - Low stock warnings

4. **Edit History Tracking**
   - Complete audit trail for order modifications
   - Previous state stored as JSONB

5. **Customer Autocomplete**
   - Automatic customer name collection
   - Sorted by last used

## Development

### Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration
│   ├── database.py          # Database setup
│   ├── security.py          # Auth utilities
│   ├── dependencies.py      # Auth dependencies
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   └── routers/             # API endpoints
├── alembic/                 # Database migrations
├── requirements.txt         # Python dependencies
├── seed_admin.py           # Admin creation script
└── README.md               # This file
```

### Testing

Use the Swagger UI at http://localhost:8000/docs to test the API interactively.

Example workflow:

1. Login as admin:
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

2. Create a company:
```json
POST /api/admin/companies
{
  "name": "My Company",
  "currency_symbol": "$"
}
```

3. Create a user:
```json
POST /api/admin/users
{
  "username": "user1",
  "email": "user1@example.com",
  "password": "password123",
  "role": "user",
  "company_id": "<company_id>"
}
```

4. Login as user and start using the system!
