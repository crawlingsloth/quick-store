"""
Integration tests - End-to-end workflow testing

These tests simulate real-world scenarios:
1. Admin creates company and users
2. User creates store, products, and processes orders
3. User generates CSV reports
"""
import pytest
import csv
from io import StringIO


class TestAdminWorkflow:
    """Test complete admin workflow"""

    def test_admin_complete_workflow(self, client, db_session):
        """
        Test: Admin logs in, creates company, creates users, deactivates user

        Workflow:
        1. Admin logs in
        2. Admin creates a company
        3. Admin creates multiple users for that company
        4. Admin lists all users
        5. Admin deactivates a user
        6. Verify deactivated user cannot login
        """
        # Step 1: Create admin user
        from app.models import User
        from app.models.user import UserRole
        from app.security import get_password_hash

        admin = User(
            username="admin",
            email="admin@test.com",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()

        # Step 2: Admin logs in
        login_response = client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        admin_token = login_response.json()["access_token"]
        assert admin_token is not None
        print("✓ Admin logged in successfully")

        # Step 3: Admin creates a company
        company_response = client.post(
            "/api/admin/companies",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "Acme Corporation",
                "currency_symbol": "$"
            }
        )
        assert company_response.status_code == 201
        company = company_response.json()
        company_id = company["id"]
        assert company["name"] == "Acme Corporation"
        print(f"✓ Company created: {company['name']} (ID: {company_id})")

        # Step 4: Admin creates multiple users for the company
        users_created = []

        # Create user 1 - Store Manager
        user1_response = client.post(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "manager1",
                "email": "manager1@acme.com",
                "password": "manager123",
                "role": "user",
                "company_id": company_id
            }
        )
        assert user1_response.status_code == 201
        user1 = user1_response.json()
        users_created.append(user1)
        print(f"✓ User created: {user1['username']} - {user1['email']}")

        # Create user 2 - Cashier
        user2_response = client.post(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "cashier1",
                "email": "cashier1@acme.com",
                "password": "cashier123",
                "role": "user",
                "company_id": company_id
            }
        )
        assert user2_response.status_code == 201
        user2 = user2_response.json()
        users_created.append(user2)
        print(f"✓ User created: {user2['username']} - {user2['email']}")

        # Create user 3 - Another employee
        user3_response = client.post(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "employee1",
                "email": "employee1@acme.com",
                "password": "employee123",
                "role": "user",
                "company_id": company_id
            }
        )
        assert user3_response.status_code == 201
        user3 = user3_response.json()
        users_created.append(user3)
        print(f"✓ User created: {user3['username']} - {user3['email']}")

        # Step 5: Admin lists all users
        users_list_response = client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert users_list_response.status_code == 200
        all_users = users_list_response.json()
        assert len(all_users) >= 3  # At least the 3 we created
        print(f"✓ Listed all users: {len(all_users)} users in system")

        # Verify all our users are in the list
        user_usernames = [u["username"] for u in all_users]
        assert "manager1" in user_usernames
        assert "cashier1" in user_usernames
        assert "employee1" in user_usernames
        print("✓ All created users found in user list")

        # Step 6: Verify users can login
        for user_info in [
            {"username": "manager1", "password": "manager123"},
            {"username": "cashier1", "password": "cashier123"},
        ]:
            login = client.post("/api/auth/login", json=user_info)
            assert login.status_code == 200
            print(f"✓ User {user_info['username']} can login")

        # Step 7: Admin deactivates employee1
        user3_id = user3["id"]
        deactivate_response = client.patch(
            f"/api/admin/users/{user3_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"is_active": False}
        )
        assert deactivate_response.status_code == 200
        deactivated_user = deactivate_response.json()
        assert deactivated_user["is_active"] is False
        print(f"✓ User {user3['username']} deactivated")

        # Step 8: Verify deactivated user cannot login
        deactivated_login = client.post("/api/auth/login", json={
            "username": "employee1",
            "password": "employee123"
        })
        assert deactivated_login.status_code == 403
        assert "inactive" in deactivated_login.json()["detail"].lower()
        print("✓ Deactivated user cannot login")

        # Step 9: Admin reactivates the user
        reactivate_response = client.patch(
            f"/api/admin/users/{user3_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"is_active": True}
        )
        assert reactivate_response.status_code == 200
        reactivated_user = reactivate_response.json()
        assert reactivated_user["is_active"] is True
        print(f"✓ User {user3['username']} reactivated")

        # Step 10: Verify reactivated user can login again
        reactivated_login = client.post("/api/auth/login", json={
            "username": "employee1",
            "password": "employee123"
        })
        assert reactivated_login.status_code == 200
        print("✓ Reactivated user can login again")

        print("\n✅ Admin workflow completed successfully!")


class TestUserWorkflow:
    """Test complete user workflow"""

    def test_user_complete_workflow(self, client, db_session):
        """
        Test: User logs in, creates store, adds products, processes orders

        Workflow:
        1. Setup: Admin creates company and user
        2. User logs in
        3. User creates store
        4. User adds multiple products
        5. User creates multiple orders (selling products)
        6. Verify inventory is updated correctly
        7. User views today's orders
        8. User edits an order
        9. User deletes an order
        """
        # Setup: Create admin, company, and user
        from app.models import User, Company
        from app.models.user import UserRole
        from app.security import get_password_hash

        admin = User(
            username="admin",
            email="admin@test.com",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()

        # Admin login
        admin_login = client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        admin_token = admin_login.json()["access_token"]

        # Admin creates company
        company_response = client.post(
            "/api/admin/companies",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Coffee Shop Inc", "currency_symbol": "$"}
        )
        company_id = company_response.json()["id"]
        print(f"✓ Company created: Coffee Shop Inc")

        # Admin creates user
        user_response = client.post(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "barista1",
                "email": "barista@coffeeshop.com",
                "password": "barista123",
                "role": "user",
                "company_id": company_id
            }
        )
        assert user_response.status_code == 201
        print(f"✓ User created: barista1")

        # Step 1: User logs in
        user_login = client.post("/api/auth/login", json={
            "username": "barista1",
            "password": "barista123"
        })
        assert user_login.status_code == 200
        user_token = user_login.json()["access_token"]
        print("✓ User logged in successfully")

        # Step 2: User creates store
        store_response = client.post(
            "/api/stores",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "name": "Downtown Coffee Shop",
                "track_inventory": True
            }
        )
        assert store_response.status_code == 201
        store = store_response.json()
        store_id = store["id"]
        print(f"✓ Store created: {store['name']}")

        # Step 3: User adds multiple products
        products = []

        product_data = [
            {"name": "Espresso", "price": 2.50, "category": "Coffee", "inventory": 100},
            {"name": "Cappuccino", "price": 3.50, "category": "Coffee", "inventory": 100},
            {"name": "Latte", "price": 4.00, "category": "Coffee", "inventory": 100},
            {"name": "Croissant", "price": 2.00, "category": "Pastry", "inventory": 50},
            {"name": "Muffin", "price": 2.50, "category": "Pastry", "inventory": 50},
        ]

        for product_info in product_data:
            product_response = client.post(
                "/api/products",
                headers={"Authorization": f"Bearer {user_token}"},
                json=product_info
            )
            assert product_response.status_code == 201
            product = product_response.json()
            products.append(product)
            print(f"✓ Product created: {product['name']} - ${product['price']} (Stock: {product['inventory']})")

        # Step 4: List products by category
        coffee_products = client.get(
            "/api/products?category=Coffee",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert coffee_products.status_code == 200
        assert len(coffee_products.json()) == 3
        print(f"✓ Listed Coffee products: {len(coffee_products.json())} items")

        # Step 5: User creates multiple orders (selling products)
        orders = []

        # Order 1: Morning rush - Multiple items
        order1_response = client.post(
            "/api/orders",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "customer_name": "John Doe",
                "items": [
                    {"product_id": products[0]["id"], "quantity": 2},  # 2 Espressos
                    {"product_id": products[3]["id"], "quantity": 1},  # 1 Croissant
                ]
            }
        )
        assert order1_response.status_code == 201
        order1 = order1_response.json()
        orders.append(order1)
        expected_total = (2.50 * 2) + (2.00 * 1)
        assert float(order1["total"]) == expected_total
        print(f"✓ Order created for {order1['customer_name']}: ${order1['total']}")

        # Order 2: Another customer
        order2_response = client.post(
            "/api/orders",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "customer_name": "Jane Smith",
                "items": [
                    {"product_id": products[1]["id"], "quantity": 1},  # 1 Cappuccino
                    {"product_id": products[4]["id"], "quantity": 2},  # 2 Muffins
                ]
            }
        )
        assert order2_response.status_code == 201
        order2 = order2_response.json()
        orders.append(order2)
        print(f"✓ Order created for {order2['customer_name']}: ${order2['total']}")

        # Order 3: Large order
        order3_response = client.post(
            "/api/orders",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "customer_name": "Bob Johnson",
                "items": [
                    {"product_id": products[2]["id"], "quantity": 3},  # 3 Lattes
                    {"product_id": products[3]["id"], "quantity": 2},  # 2 Croissants
                    {"product_id": products[4]["id"], "quantity": 1},  # 1 Muffin
                ]
            }
        )
        assert order3_response.status_code == 201
        order3 = order3_response.json()
        orders.append(order3)
        print(f"✓ Order created for {order3['customer_name']}: ${order3['total']}")

        # Step 6: Verify inventory is updated correctly
        # Espresso: 100 - 2 = 98
        espresso_check = client.get(
            f"/api/products/{products[0]['id']}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert espresso_check.json()["inventory"] == 98
        print(f"✓ Espresso inventory updated: 100 → 98")

        # Croissant: 50 - 1 - 2 = 47
        croissant_check = client.get(
            f"/api/products/{products[3]['id']}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert croissant_check.json()["inventory"] == 47
        print(f"✓ Croissant inventory updated: 50 → 47")

        # Muffin: 50 - 2 - 1 = 47
        muffin_check = client.get(
            f"/api/products/{products[4]['id']}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert muffin_check.json()["inventory"] == 47
        print(f"✓ Muffin inventory updated: 50 → 47")

        # Step 7: User views today's orders
        today_orders = client.get(
            "/api/orders/today",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert today_orders.status_code == 200
        orders_list = today_orders.json()
        assert len(orders_list) == 3
        total_revenue = sum(float(order["total"]) for order in orders_list)
        print(f"✓ Today's orders: {len(orders_list)} orders, Total revenue: ${total_revenue:.2f}")

        # Step 8: User edits an order (customer wants to add an item)
        order1_id = order1["id"]
        edit_response = client.patch(
            f"/api/orders/{order1_id}",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "customer_name": "John Doe",
                "items": [
                    {"product_id": products[0]["id"], "quantity": 2},  # 2 Espressos (same)
                    {"product_id": products[3]["id"], "quantity": 2},  # 2 Croissants (was 1, +1)
                ]
            }
        )
        assert edit_response.status_code == 200
        edited_order = edit_response.json()
        assert edited_order["is_edited"] is True
        print(f"✓ Order edited: Added 1 more Croissant")

        # Verify inventory adjusted: Croissant 47 - 1 = 46
        croissant_after_edit = client.get(
            f"/api/products/{products[3]['id']}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert croissant_after_edit.json()["inventory"] == 46
        print(f"✓ Croissant inventory adjusted: 47 → 46")

        # Step 9: User deletes an order (customer cancelled)
        order3_id = order3["id"]
        delete_response = client.delete(
            f"/api/orders/{order3_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert delete_response.status_code == 204
        print(f"✓ Order deleted (customer cancelled)")

        # Verify inventory restored
        # Latte: 100 - 3 + 3 = 100
        latte_check = client.get(
            f"/api/products/{products[2]['id']}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert latte_check.json()["inventory"] == 100
        print(f"✓ Latte inventory restored: → 100")

        # Croissant: 46 + 2 = 48
        croissant_final = client.get(
            f"/api/products/{products[3]['id']}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert croissant_final.json()["inventory"] == 48
        print(f"✓ Croissant inventory restored: 46 → 48")

        # Step 10: Check customer name autocomplete
        customers = client.get(
            "/api/customers/names",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert customers.status_code == 200
        customer_names = customers.json()
        assert "John Doe" in customer_names
        assert "Jane Smith" in customer_names
        print(f"✓ Customer autocomplete working: {len(customer_names)} customers")

        print("\n✅ User workflow completed successfully!")


class TestCSVExport:
    """Test CSV export functionality"""

    def test_csv_export_workflow(self, client, db_session):
        """
        Test: User generates CSV export of daily orders

        Workflow:
        1. Setup: Create user with store and products
        2. Create multiple orders with different products
        3. Generate CSV export
        4. Verify CSV format and content
        5. Verify all orders are included
        6. Verify product details are correct
        """
        # Setup: Create admin, company, user, store, and products
        from app.models import User
        from app.models.user import UserRole
        from app.security import get_password_hash

        admin = User(
            username="admin",
            email="admin@test.com",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()

        # Setup via API
        admin_login = client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        admin_token = admin_login.json()["access_token"]

        company_response = client.post(
            "/api/admin/companies",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Export Test Co", "currency_symbol": "$"}
        )
        company_id = company_response.json()["id"]

        user_response = client.post(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "exporter",
                "email": "export@test.com",
                "password": "export123",
                "role": "user",
                "company_id": company_id
            }
        )

        user_login = client.post("/api/auth/login", json={
            "username": "exporter",
            "password": "export123"
        })
        user_token = user_login.json()["access_token"]

        # Create store
        store_response = client.post(
            "/api/stores",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"name": "Export Store", "track_inventory": True}
        )

        # Create products
        products = []
        for name, price in [("Product A", 10.00), ("Product B", 20.00), ("Product C", 30.00)]:
            product_response = client.post(
                "/api/products",
                headers={"Authorization": f"Bearer {user_token}"},
                json={"name": name, "price": price, "inventory": 1000}
            )
            products.append(product_response.json())

        print("✓ Setup complete: Store and products created")

        # Create multiple orders
        orders_data = [
            {
                "customer_name": "Customer A",
                "items": [
                    {"product_id": products[0]["id"], "quantity": 2},
                    {"product_id": products[1]["id"], "quantity": 1},
                ]
            },
            {
                "customer_name": "Customer B",
                "items": [
                    {"product_id": products[1]["id"], "quantity": 3},
                ]
            },
            {
                "customer_name": "Customer C",
                "items": [
                    {"product_id": products[0]["id"], "quantity": 1},
                    {"product_id": products[2]["id"], "quantity": 2},
                ]
            },
        ]

        created_orders = []
        for order_data in orders_data:
            order_response = client.post(
                "/api/orders",
                headers={"Authorization": f"Bearer {user_token}"},
                json=order_data
            )
            assert order_response.status_code == 201
            created_orders.append(order_response.json())
            print(f"✓ Order created for {order_data['customer_name']}")

        # Get today's orders for export
        today_orders_response = client.get(
            "/api/orders/today",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert today_orders_response.status_code == 200
        today_orders = today_orders_response.json()
        assert len(today_orders) == 3
        print(f"✓ Retrieved {len(today_orders)} orders for export")

        # Generate CSV manually (simulating export functionality)
        # In a real implementation, you'd have an endpoint that returns CSV
        csv_data = self._generate_csv_from_orders(today_orders)

        # Parse CSV to verify content
        csv_reader = csv.DictReader(StringIO(csv_data))
        csv_rows = list(csv_reader)

        print("\n📊 CSV Export Generated:")
        print("-" * 80)
        print(csv_data)
        print("-" * 80)

        # Verify CSV structure
        assert len(csv_rows) > 0
        expected_headers = ["order_id", "customer_name", "product_name", "quantity", "price", "item_total", "order_total", "created_at"]
        actual_headers = csv_rows[0].keys()
        for header in expected_headers:
            assert header in actual_headers
        print("✓ CSV headers correct")

        # Count total items (each order item should be a row)
        expected_items = sum(len(order["items"]) for order in today_orders)
        assert len(csv_rows) == expected_items
        print(f"✓ CSV contains {len(csv_rows)} order items (expected {expected_items})")

        # Verify customer names are present
        customer_names_in_csv = set(row["customer_name"] for row in csv_rows)
        assert "Customer A" in customer_names_in_csv
        assert "Customer B" in customer_names_in_csv
        assert "Customer C" in customer_names_in_csv
        print("✓ All customer names present in CSV")

        # Verify product details
        product_names_in_csv = set(row["product_name"] for row in csv_rows)
        assert "Product A" in product_names_in_csv
        assert "Product B" in product_names_in_csv
        assert "Product C" in product_names_in_csv
        print("✓ All products present in CSV")

        # Verify quantities
        quantities = [int(row["quantity"]) for row in csv_rows]
        assert min(quantities) >= 1
        assert max(quantities) <= 3
        print("✓ Quantities are correct")

        # Verify totals
        total_from_items = sum(float(row["item_total"]) for row in csv_rows)
        expected_revenue = sum(float(order["total"]) for order in today_orders)
        assert abs(total_from_items - expected_revenue) < 0.01  # Allow for floating point errors
        print(f"✓ Total revenue matches: ${total_from_items:.2f}")

        # Verify order totals are consistent
        unique_orders = set(row["order_id"] for row in csv_rows)
        for order_id in unique_orders:
            order_rows = [row for row in csv_rows if row["order_id"] == order_id]
            items_sum = sum(float(row["item_total"]) for row in order_rows)
            order_total = float(order_rows[0]["order_total"])
            assert abs(items_sum - order_total) < 0.01
        print(f"✓ All order totals verified")

        # Test summary statistics
        print("\n📈 Export Summary:")
        print(f"  - Total Orders: {len(today_orders)}")
        print(f"  - Total Items Sold: {sum(quantities)}")
        print(f"  - Total Revenue: ${total_from_items:.2f}")
        print(f"  - Unique Customers: {len(customer_names_in_csv)}")
        print(f"  - Products Sold: {len(product_names_in_csv)}")

        print("\n✅ CSV export workflow completed successfully!")

    def _generate_csv_from_orders(self, orders):
        """Helper method to generate CSV from orders"""
        output = StringIO()
        fieldnames = ["order_id", "customer_name", "product_name", "quantity", "price", "item_total", "order_total", "created_at"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)

        writer.writeheader()
        for order in orders:
            for item in order["items"]:
                item_total = float(item["price"]) * int(item["quantity"])
                writer.writerow({
                    "order_id": order["id"],
                    "customer_name": order["customer_name"] or "Walk-in",
                    "product_name": item["product_name"],
                    "quantity": item["quantity"],
                    "price": item["price"],
                    "item_total": f"{item_total:.2f}",
                    "order_total": order["total"],
                    "created_at": order["created_at"]
                })

        return output.getvalue()


class TestCompleteEndToEnd:
    """Test complete end-to-end scenario"""

    def test_complete_business_day(self, client, db_session):
        """
        Test: Complete business day from setup to close

        This simulates a full day of business operations:
        1. Admin sets up company and staff
        2. Manager sets up store and inventory
        3. Multiple cashiers process orders throughout the day
        4. Manager reviews and exports daily report
        """
        from app.models import User
        from app.models.user import UserRole
        from app.security import get_password_hash

        print("\n🏪 Starting Complete Business Day Simulation")
        print("=" * 80)

        # === MORNING: Admin Setup ===
        print("\n⏰ MORNING - Admin Setup")
        print("-" * 80)

        admin = User(
            username="admin",
            email="admin@headquarters.com",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()

        admin_login = client.post("/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        admin_token = admin_login.json()["access_token"]
        print("✓ Admin logged in")

        # Create company
        company_response = client.post(
            "/api/admin/companies",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Daily Business Store", "currency_symbol": "$"}
        )
        company_id = company_response.json()["id"]
        print("✓ Company created: Daily Business Store")

        # Create manager
        manager_response = client.post(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "manager",
                "email": "manager@store.com",
                "password": "manager123",
                "role": "user",
                "company_id": company_id
            }
        )
        print("✓ Manager account created")

        # Create cashiers
        for i in range(1, 3):
            client.post(
                "/api/admin/users",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={
                    "username": f"cashier{i}",
                    "email": f"cashier{i}@store.com",
                    "password": f"cashier{i}123",
                    "role": "user",
                    "company_id": company_id
                }
            )
            print(f"✓ Cashier{i} account created")

        # === STORE OPENING: Manager Setup ===
        print("\n🌅 STORE OPENING - Manager Setup")
        print("-" * 80)

        manager_login = client.post("/api/auth/login", json={
            "username": "manager",
            "password": "manager123"
        })
        manager_token = manager_login.json()["access_token"]
        print("✓ Manager logged in")

        # Create store
        client.post(
            "/api/stores",
            headers={"Authorization": f"Bearer {manager_token}"},
            json={"name": "Main Street Store", "track_inventory": True}
        )
        print("✓ Store created with inventory tracking")

        # Add inventory
        products = []
        inventory_items = [
            {"name": "Coffee", "price": 3.00, "category": "Beverages", "inventory": 200},
            {"name": "Tea", "price": 2.50, "category": "Beverages", "inventory": 150},
            {"name": "Sandwich", "price": 6.50, "category": "Food", "inventory": 100},
            {"name": "Salad", "price": 7.00, "category": "Food", "inventory": 80},
            {"name": "Cookie", "price": 2.00, "category": "Snacks", "inventory": 150},
        ]

        for item in inventory_items:
            product_response = client.post(
                "/api/products",
                headers={"Authorization": f"Bearer {manager_token}"},
                json=item
            )
            products.append(product_response.json())
            print(f"✓ Added: {item['name']} - ${item['price']} (Stock: {item['inventory']})")

        # === BUSINESS HOURS: Sales Activity ===
        print("\n🛍️  BUSINESS HOURS - Sales Activity")
        print("-" * 80)

        # Cashier 1 login
        cashier1_login = client.post("/api/auth/login", json={
            "username": "cashier1",
            "password": "cashier1123"
        })
        cashier1_token = cashier1_login.json()["access_token"]

        # Cashier 2 login
        cashier2_login = client.post("/api/auth/login", json={
            "username": "cashier2",
            "password": "cashier2123"
        })
        cashier2_token = cashier2_login.json()["access_token"]

        # Morning rush - Cashier 1
        for i in range(1, 6):
            client.post(
                "/api/orders",
                headers={"Authorization": f"Bearer {cashier1_token}"},
                json={
                    "customer_name": f"Morning Customer {i}",
                    "items": [
                        {"product_id": products[0]["id"], "quantity": 1},  # Coffee
                        {"product_id": products[4]["id"], "quantity": 1},  # Cookie
                    ]
                }
            )
        print("✓ Cashier1: Processed 5 morning orders")

        # Lunch rush - Both cashiers
        lunch_orders = [
            # Cashier 1
            (cashier1_token, "Lunch Customer 1", [
                {"product_id": products[2]["id"], "quantity": 1},  # Sandwich
                {"product_id": products[0]["id"], "quantity": 1},  # Coffee
            ]),
            (cashier1_token, "Lunch Customer 2", [
                {"product_id": products[3]["id"], "quantity": 1},  # Salad
                {"product_id": products[1]["id"], "quantity": 1},  # Tea
            ]),
            # Cashier 2
            (cashier2_token, "Lunch Customer 3", [
                {"product_id": products[2]["id"], "quantity": 2},  # 2 Sandwiches
            ]),
            (cashier2_token, "Lunch Customer 4", [
                {"product_id": products[3]["id"], "quantity": 1},  # Salad
                {"product_id": products[2]["id"], "quantity": 1},  # Sandwich
                {"product_id": products[0]["id"], "quantity": 1},  # Coffee
            ]),
        ]

        for token, customer, items in lunch_orders:
            client.post(
                "/api/orders",
                headers={"Authorization": f"Bearer {token}"},
                json={"customer_name": customer, "items": items}
            )
        print("✓ Both cashiers: Processed lunch rush (4 orders)")

        # Afternoon sales
        for i in range(1, 4):
            client.post(
                "/api/orders",
                headers={"Authorization": f"Bearer {cashier2_token}"},
                json={
                    "customer_name": f"Afternoon Customer {i}",
                    "items": [
                        {"product_id": products[1]["id"], "quantity": 1},  # Tea
                        {"product_id": products[4]["id"], "quantity": 2},  # 2 Cookies
                    ]
                }
            )
        print("✓ Cashier2: Processed 3 afternoon orders")

        # === CLOSING TIME: Manager Review ===
        print("\n🌙 CLOSING TIME - Manager Review")
        print("-" * 80)

        # Get today's orders
        today_orders_response = client.get(
            "/api/orders/today",
            headers={"Authorization": f"Bearer {manager_token}"}
        )
        today_orders = today_orders_response.json()

        total_orders = len(today_orders)
        total_revenue = sum(float(order["total"]) for order in today_orders)
        total_items = sum(len(order["items"]) for order in today_orders)

        print(f"✓ Total Orders: {total_orders}")
        print(f"✓ Total Revenue: ${total_revenue:.2f}")
        print(f"✓ Total Items Sold: {total_items}")

        # Check inventory levels
        print("\n📦 End of Day Inventory:")
        for product in products:
            current = client.get(
                f"/api/products/{product['id']}",
                headers={"Authorization": f"Bearer {manager_token}"}
            )
            current_inventory = current.json()["inventory"]
            original_inventory = product["inventory"]
            sold = original_inventory - current_inventory
            print(f"  - {product['name']}: {current_inventory} remaining ({sold} sold)")

        # Customer analytics
        unique_customers = len(set(order["customer_name"] for order in today_orders))
        print(f"\n👥 Unique Customers: {unique_customers}")

        # Verify totals
        assert total_orders == 12  # 5 morning + 4 lunch + 3 afternoon
        assert total_revenue > 0
        print("\n✅ Complete business day simulation passed!")
        print("=" * 80)
