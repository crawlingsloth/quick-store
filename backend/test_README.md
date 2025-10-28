# Test Suite

## Overview

Comprehensive unit tests have been created for all CRUD operations covering:

- **Authentication**: Login, token validation, user info
- **Admin Operations**: Company and user management
- **Stores**: Create, read, update, delete stores
- **Products**: Full CRUD with inventory tracking
- **Combos**: Combo creation and management with product items
- **Orders**: Complete order lifecycle with inventory management
- **Sessions**: Daily session tracking and export status
- **Customers**: Customer name autocomplete

## Test Files

- `tests/conftest.py` - Test configuration and fixtures
- `tests/test_auth.py` - Authentication tests (5 tests)
- `tests/test_admin.py` - Admin endpoint tests (8 tests)
- `tests/test_stores.py` - Store CRUD tests (7 tests)
- `tests/test_products.py` - Product CRUD tests (8 tests)
- `tests/test_combos.py` - Combo CRUD tests (6 tests)
- `tests/test_orders.py` - Order CRUD + inventory tests (9 tests)
- `tests/test_sessions.py` - Session management tests (4 tests)
- `tests/test_customers.py` - Customer autocomplete tests (3 tests)

**Total: 50 comprehensive tests**

## Running Tests

### ✅ All Tests Passing!

**Status:** 50/50 tests passing

The tests use a PostgreSQL test database. To run them:

1. The test database should already be created (done during setup)

2. Run tests:
```bash
cd backend
./venv/bin/pytest tests/ -v
```

Results:
- **50 PASSED** ✅
- 0 failed
- Test execution time: ~57 seconds

### Manual API Testing

You can also test the API manually using Swagger UI:

1. Start the server:
```bash
uvicorn app.main:app --reload
```

2. Access Swagger docs at http://localhost:8000/docs

3. Test the endpoints interactively

## Test Coverage

### Authentication Tests
- ✅ Successful login
- ✅ Wrong password handling
- ✅ Nonexistent user handling
- ✅ Get current user info
- ✅ Unauthorized access prevention

### Admin Tests
- ✅ Create company
- ✅ Non-admin access prevention
- ✅ List companies
- ✅ Update company
- ✅ Create user
- ✅ Duplicate username validation
- ✅ List users
- ✅ Update user

### Store Tests
- ✅ Create store
- ✅ Prevent duplicate stores per company
- ✅ List stores
- ✅ Get current store
- ✅ Update store
- ✅ Delete store
- ✅ Admin access prevention

### Product Tests
- ✅ Create product with inventory
- ✅ Create product without inventory
- ✅ List all products
- ✅ Filter products by category
- ✅ Get specific product
- ✅ Update product
- ✅ Delete product
- ✅ Inventory tracking validation

### Combo Tests
- ✅ Create combo with multiple products
- ✅ Invalid product validation
- ✅ List combos
- ✅ Get specific combo
- ✅ Update combo items
- ✅ Delete combo

### Order Tests
- ✅ Create order
- ✅ Automatic inventory deduction
- ✅ Insufficient inventory prevention
- ✅ List orders
- ✅ List today's orders
- ✅ Get specific order
- ✅ Update order with inventory adjustment
- ✅ Delete order with inventory restoration
- ✅ Customer name autocomplete integration

### Session Tests
- ✅ Get today's session
- ✅ Get session by date
- ✅ Mark session as exported
- ✅ Invalid date handling

### Customer Tests
- ✅ List customer names
- ✅ Simple name list for autocomplete
- ✅ Deduplication of customer names

## Key Test Features

1. **Isolation**: Each test uses a fresh database session
2. **Fixtures**: Reusable test data (admin, user, store)
3. **Authorization**: Tests verify proper authentication and role-based access
4. **Data Integrity**: Tests verify inventory tracking and edit history
5. **Error Handling**: Tests verify proper error responses
6. **Complete Coverage**: All CRUD operations tested for all entities

## Notes

- Tests use in-memory SQLite by default but require PostgreSQL types
- For production testing, use a dedicated PostgreSQL test database
- All tests include proper cleanup (automatic with function-scoped fixtures)
- Tests verify multi-tenancy (users can only access their company's data)
