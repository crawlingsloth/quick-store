# Integration Tests Documentation

## Overview

Integration tests simulate real-world end-to-end workflows to verify that all system components work together correctly. Unlike unit tests that test individual functions, integration tests validate complete business processes.

## Test Suite

**Location:** `tests/test_integration.py`

**Total Integration Tests:** 4

### Test Classes

1. **TestAdminWorkflow** - Admin user management workflows
2. **TestUserWorkflow** - User store and sales operations
3. **TestCSVExport** - CSV export functionality
4. **TestCompleteEndToEnd** - Complete business day simulation

---

## Test 1: Admin Complete Workflow

**Test:** `test_admin_complete_workflow`

**Purpose:** Verify admin can manage companies, users, and permissions

### Workflow Steps:

1. ✅ **Admin Login**
   - Admin logs in with credentials
   - Receives JWT authentication token

2. ✅ **Create Company**
   - Admin creates "Acme Corporation" with $ currency
   - Receives company ID

3. ✅ **Create Multiple Users**
   - Creates Manager account (manager1@acme.com)
   - Creates Cashier account (cashier1@acme.com)
   - Creates Employee account (employee1@acme.com)
   - All users assigned to Acme Corporation

4. ✅ **List All Users**
   - Admin retrieves full user list
   - Verifies all created users appear

5. ✅ **Verify User Login**
   - Manager and Cashier can successfully login
   - Both receive valid tokens

6. ✅ **Deactivate User**
   - Admin deactivates employee1 account
   - Sets `is_active = false`

7. ✅ **Verify Deactivated Access**
   - Deactivated user cannot login
   - Receives 403 Forbidden error

8. ✅ **Reactivate User**
   - Admin reactivates employee1
   - Sets `is_active = true`

9. ✅ **Verify Reactivated Access**
   - Reactivated user can login again
   - Full access restored

### Key Validations:
- ✅ Admin authentication
- ✅ Company creation
- ✅ User creation with company assignment
- ✅ User activation/deactivation
- ✅ Access control enforcement

---

## Test 2: User Complete Workflow

**Test:** `test_user_complete_workflow`

**Purpose:** Verify user can manage store, products, and process orders

### Workflow Steps:

1. ✅ **Setup**
   - Admin creates "Coffee Shop Inc" company
   - Admin creates "barista1" user
   - User assigned to Coffee Shop Inc

2. ✅ **User Login**
   - Barista logs in
   - Receives authentication token

3. ✅ **Create Store**
   - Creates "Downtown Coffee Shop"
   - Enables inventory tracking

4. ✅ **Add Products**
   - Espresso - $2.50 (100 units)
   - Cappuccino - $3.50 (100 units)
   - Latte - $4.00 (100 units)
   - Croissant - $2.00 (50 units)
   - Muffin - $2.50 (50 units)

5. ✅ **Filter Products**
   - Lists Coffee category products
   - Returns 3 coffee items

6. ✅ **Create Orders**
   - **Order 1:** John Doe - 2 Espressos, 1 Croissant ($7.00)
   - **Order 2:** Jane Smith - 1 Cappuccino, 2 Muffins ($8.50)
   - **Order 3:** Bob Johnson - 3 Lattes, 2 Croissants, 1 Muffin ($18.50)

7. ✅ **Verify Inventory Updates**
   - Espresso: 100 → 98 (sold 2)
   - Croissant: 50 → 47 (sold 3)
   - Muffin: 50 → 47 (sold 3)

8. ✅ **View Today's Orders**
   - Lists all 3 orders
   - Calculates total revenue: $34.00

9. ✅ **Edit Order**
   - John Doe adds 1 more Croissant
   - Order marked as `is_edited = true`
   - Inventory adjusted: Croissant 47 → 46

10. ✅ **Delete Order**
    - Bob Johnson cancels order
    - Inventory restored:
      - Latte: → 100
      - Croissant: 46 → 48
      - Muffin: 47 → 48

11. ✅ **Customer Autocomplete**
    - Retrieves customer name list
    - John Doe, Jane Smith, Bob Johnson available

### Key Validations:
- ✅ Store creation
- ✅ Product management
- ✅ Order processing
- ✅ Automatic inventory tracking
- ✅ Order editing with history
- ✅ Order deletion with inventory restoration
- ✅ Customer name collection

---

## Test 3: CSV Export Workflow

**Test:** `test_csv_export_workflow`

**Purpose:** Verify CSV export functionality for daily orders

### Workflow Steps:

1. ✅ **Setup**
   - Create company and user
   - Create store with 3 products

2. ✅ **Create Orders**
   - **Customer A:** 2x Product A, 1x Product B ($40.00)
   - **Customer B:** 3x Product B ($60.00)
   - **Customer C:** 1x Product A, 2x Product C ($70.00)

3. ✅ **Retrieve Today's Orders**
   - Gets all 3 orders for export

4. ✅ **Generate CSV**
   - Creates CSV with proper format
   - One row per order item

5. ✅ **Verify CSV Structure**
   ```csv
   order_id,customer_name,product_name,quantity,price,item_total,order_total,created_at
   ```

6. ✅ **Verify CSV Content**
   - 5 rows (one per order item)
   - All customers present
   - All products present
   - Quantities correct (1-3)

7. ✅ **Verify Totals**
   - Sum of item_totals = $170.00
   - Matches sum of order totals
   - Each order's items sum to order total

8. ✅ **Export Summary**
   - Total Orders: 3
   - Total Items Sold: 9
   - Total Revenue: $170.00
   - Unique Customers: 3
   - Products Sold: 3

### CSV Format Example:
```csv
order_id,customer_name,product_name,quantity,price,item_total,order_total,created_at
abc-123,Customer A,Product A,2,10.00,20.00,40.00,2025-10-28T10:30:00
abc-123,Customer A,Product B,1,20.00,20.00,40.00,2025-10-28T10:30:00
def-456,Customer B,Product B,3,20.00,60.00,60.00,2025-10-28T11:00:00
```

### Key Validations:
- ✅ CSV generation
- ✅ Correct headers
- ✅ Accurate data
- ✅ Item-level details
- ✅ Revenue calculations
- ✅ Summary statistics

---

## Test 4: Complete Business Day

**Test:** `test_complete_business_day`

**Purpose:** Simulate a full day of business operations

### Workflow Steps:

#### 🌅 Morning - Admin Setup
1. ✅ Admin login
2. ✅ Create "Daily Business Store" company
3. ✅ Create Manager account
4. ✅ Create 2 Cashier accounts

#### ☀️ Store Opening - Manager Setup
5. ✅ Manager login
6. ✅ Create "Main Street Store"
7. ✅ Add inventory:
   - Coffee: $3.00 (200 units)
   - Tea: $2.50 (150 units)
   - Sandwich: $6.50 (100 units)
   - Salad: $7.00 (80 units)
   - Cookie: $2.00 (150 units)

#### 🛍️ Business Hours - Sales Activity
8. ✅ Cashier 1 & 2 login
9. ✅ **Morning Rush** (5 orders by Cashier 1)
   - Coffee + Cookie combos
10. ✅ **Lunch Rush** (4 orders by both cashiers)
    - Sandwiches, Salads, Beverages
11. ✅ **Afternoon Sales** (3 orders by Cashier 2)
    - Tea + Cookie combos

#### 🌙 Closing Time - Manager Review
12. ✅ Retrieve all orders (12 total)
13. ✅ Calculate daily statistics
14. ✅ Check inventory levels
15. ✅ Analyze customer data

### Daily Results:
- **Total Orders:** 12
- **Total Revenue:** Calculated from all sales
- **Unique Customers:** Tracked
- **Inventory Sold:** Coffee, Tea, Sandwiches, Salads, Cookies
- **Staff Performance:** Both cashiers active

### Key Validations:
- ✅ Multi-user concurrent operations
- ✅ Full day business flow
- ✅ Inventory management at scale
- ✅ Multiple cashier operations
- ✅ End-of-day reporting
- ✅ Customer analytics

---

## Running Integration Tests

### Run All Integration Tests

```bash
cd backend
./venv/bin/pytest tests/test_integration.py -v
```

**Expected:** 4 passed

### Run Specific Test Class

```bash
# Admin workflow only
pytest tests/test_integration.py::TestAdminWorkflow -v

# User workflow only
pytest tests/test_integration.py::TestUserWorkflow -v

# CSV export only
pytest tests/test_integration.py::TestCSVExport -v

# Complete business day
pytest tests/test_integration.py::TestCompleteEndToEnd -v
```

### Run with Detailed Output

```bash
pytest tests/test_integration.py -v -s
```

The `-s` flag shows all print statements, giving you detailed step-by-step output.

### Run All Tests (Unit + Integration)

```bash
pytest tests/ -v
```

**Expected:** 54 passed (50 unit + 4 integration)

---

## Test Features

### ✅ Comprehensive Coverage
- Admin operations
- User operations
- Store management
- Product management
- Order processing
- Inventory tracking
- CSV export
- Multi-user scenarios

### ✅ Real-World Scenarios
- Morning setup procedures
- Sales processing
- Order modifications
- End-of-day reporting
- User management
- Access control

### ✅ Data Validation
- Authentication flows
- Authorization checks
- Inventory accuracy
- Revenue calculations
- Data consistency
- CSV format correctness

### ✅ Multi-User Testing
- Multiple cashiers
- Concurrent operations
- Shared company data
- Isolated access

---

## Integration Test Benefits

### 1. **Confidence in System Integration**
   - Verifies all components work together
   - Tests realistic user journeys
   - Validates business logic

### 2. **Catches Integration Bugs**
   - Database transaction issues
   - API endpoint interactions
   - Authentication/Authorization flows
   - State management

### 3. **Documentation Through Tests**
   - Clear user workflows
   - Expected system behavior
   - Business process validation

### 4. **Regression Prevention**
   - Ensures changes don't break workflows
   - Validates feature interactions
   - Protects core functionality

---

## Best Practices

### ✅ Test Isolation
- Each test uses fresh database
- No test dependencies
- Clean state between tests

### ✅ Realistic Data
- Real business scenarios
- Proper product categories
- Realistic customer names
- Accurate pricing

### ✅ Clear Output
- Progress indicators (✓)
- Step descriptions
- Summary statistics
- Visual separators

### ✅ Comprehensive Validation
- Status code checks
- Data accuracy
- Business logic
- State changes

---

## Maintenance

### Adding New Integration Tests

1. **Identify Workflow**
   - Define business process
   - List all steps
   - Identify validations

2. **Create Test Class**
   ```python
   class TestNewWorkflow:
       def test_new_workflow(self, client, db_session):
           # Setup
           # Execute workflow
           # Validate results
   ```

3. **Add Descriptive Output**
   ```python
   print("✓ Step completed")
   print(f"✓ Result: {value}")
   ```

4. **Verify Test**
   ```bash
   pytest tests/test_integration.py::TestNewWorkflow -v -s
   ```

### Updating Existing Tests

When API changes:
1. Update test expectations
2. Verify workflow still valid
3. Update documentation
4. Run all tests

---

## Troubleshooting

### Test Failures

**Authentication Error:**
- Check user credentials
- Verify admin account exists
- Check JWT token handling

**Data Not Found:**
- Verify test isolation
- Check database cleanup
- Ensure proper setup

**Inventory Mismatch:**
- Review order creation
- Check deletion/edit logic
- Verify transaction handling

**CSV Format Issues:**
- Check header names
- Verify data types
- Review CSV generation logic

---

## Summary

✅ **4 Integration Tests** covering:
- Admin workflows
- User operations
- CSV exports
- Complete business scenarios

✅ **All Tests Passing** with:
- Detailed output
- Clear validations
- Realistic scenarios

✅ **Production-Ready** testing:
- Full workflow coverage
- Multi-user testing
- Data accuracy
- Business logic validation

The integration tests ensure the QuickStore backend is production-ready and all features work together seamlessly!
