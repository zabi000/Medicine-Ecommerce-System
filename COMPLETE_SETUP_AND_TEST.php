<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set admin session
$_SESSION['admin_logged_in'] = true;
$_SESSION['admin_name'] = 'Administrator';
?>
<!DOCTYPE html>
<html>
<head>
    <title>Complete Setup & Test</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { padding: 30px; background: #f8f9fa; }
        .step { background: white; padding: 20px; margin: 15px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { border-left: 5px solid #28a745; }
        .error { border-left: 5px solid #dc3545; }
        .btn-test { margin: 10px; padding: 15px 30px; font-size: 1.1rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="text-center mb-4">🚀 Complete Setup & Test</h1>

<?php
// Database setup
$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'medicare_db';

echo "<div class='step'>";
echo "<h4>Step 1: Database Connection</h4>";

$conn = @new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    echo "<div class='alert alert-danger'>";
    echo "<h5>❌ MySQL Connection Failed!</h5>";
    echo "<p>Error: " . $conn->connect_error . "</p>";
    echo "<p><strong>Fix:</strong> Start XAMPP and make sure MySQL is running</p>";
    echo "</div></div></div></body></html>";
    exit;
}

echo "<p class='text-success'>✅ Connected to MySQL</p>";

// Create database
$conn->query("DROP DATABASE IF EXISTS $dbname");
$conn->query("CREATE DATABASE $dbname");
$conn->select_db($dbname);
echo "<p class='text-success'>✅ Database '$dbname' created</p>";
echo "</div>";

// Create tables
echo "<div class='step'>";
echo "<h4>Step 2: Creating Tables</h4>";

$tables = [
    "CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        icon VARCHAR(10) DEFAULT '💊',
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )",
    "CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )"
];

foreach ($tables as $sql) {
    if ($conn->query($sql)) {
        preg_match('/CREATE TABLE (\w+)/', $sql, $matches);
        echo "<p>✅ Created table: <strong>{$matches[1]}</strong></p>";
    }
}
echo "</div>";

// Insert data
echo "<div class='step'>";
echo "<h4>Step 3: Adding Sample Data</h4>";

// Customers
$customers = [
    ['Ahmed Khan', 'ahmed@email.com', '+92-300-1234567'],
    ['Fatima Ali', 'fatima@email.com', '+92-321-9876543'],
    ['Hassan Raza', 'hassan@email.com', '+92-333-5551234'],
    ['Ayesha Malik', 'ayesha@email.com', '+92-345-7778888'],
    ['Usman Sheikh', 'usman@email.com', '+92-301-4445566'],
    ['Zainab Hussain', 'zainab@email.com', '+92-322-9998877'],
    ['Ali Haider', 'ali@email.com', '+92-334-6667788'],
    ['Sana Tariq', 'sana@email.com', '+92-346-3332211'],
    ['Bilal Ahmed', 'bilal@email.com', '+92-302-1112233'],
    ['Mariam Noor', 'mariam@email.com', '+92-323-5554433']
];

$stmt = $conn->prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)");
$password = password_hash('password123', PASSWORD_DEFAULT);
foreach ($customers as $c) {
    $stmt->bind_param("ssss", $c[0], $c[1], $c[2], $password);
    $stmt->execute();
}
echo "<p>✅ Added <strong>10 customers</strong></p>";

// Categories
$categories = [
    ['prescription', 'Doctor prescribed medicines'],
    ['vitamins', 'Health supplements'],
    ['firstaid', 'Emergency supplies'],
    ['devices', 'Medical devices'],
    ['personal', 'Personal care']
];

$stmt = $conn->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
foreach ($categories as $cat) {
    $stmt->bind_param("ss", $cat[0], $cat[1]);
    $stmt->execute();
}
echo "<p>✅ Added <strong>5 categories</strong></p>";

// Products
$products = [
    ['Paracetamol 500mg', 'Pain relief', 5.99, 'prescription', '💊', 500],
    ['Ibuprofen 400mg', 'Anti-inflammatory', 7.99, 'prescription', '💊', 450],
    ['Vitamin C 1000mg', 'Immune support', 12.99, 'vitamins', '💉', 400],
    ['Vitamin D3 2000IU', 'Bone health', 14.99, 'vitamins', '💉', 350],
    ['First Aid Kit', 'Emergency kit', 29.99, 'firstaid', '🩹', 100],
    ['Bandages Pack', 'Sterile bandages', 8.99, 'firstaid', '🩹', 250],
    ['Digital Thermometer', 'Temperature reading', 15.99, 'devices', '🌡️', 180],
    ['Blood Pressure Monitor', 'BP measurement', 45.99, 'devices', '🌡️', 80],
    ['Hand Sanitizer 500ml', 'Antibacterial gel', 4.99, 'personal', '🧴', 600],
    ['Face Masks (50 Pack)', 'Surgical masks', 12.99, 'personal', '😷', 500]
];

$stmt = $conn->prepare("INSERT INTO products (name, description, price, category, icon, stock) VALUES (?, ?, ?, ?, ?, ?)");
foreach ($products as $p) {
    $stmt->bind_param("ssdssi", $p[0], $p[1], $p[2], $p[3], $p[4], $p[5]);
    $stmt->execute();
}
echo "<p>✅ Added <strong>10 products</strong></p>";

// Orders
for ($i = 1; $i <= 5; $i++) {
    $user_id = rand(1, 10);
    $amount = rand(100, 1000);
    $statuses = ['pending', 'processing', 'delivered'];
    $status = $statuses[array_rand($statuses)];
    $stmt = $conn->prepare("INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES (?, ?, ?, ?)");
    $address = "Address $i, Karachi, Pakistan";
    $stmt->bind_param("idss", $user_id, $amount, $status, $address);
    $stmt->execute();
}
echo "<p>✅ Added <strong>5 orders</strong></p>";
echo "</div>";

// Verify
echo "<div class='step success'>";
echo "<h4>Step 4: Verification</h4>";

$users_count = $conn->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'];
$products_count = $conn->query("SELECT COUNT(*) as c FROM products")->fetch_assoc()['c'];
$orders_count = $conn->query("SELECT COUNT(*) as c FROM orders")->fetch_assoc()['c'];
$categories_count = $conn->query("SELECT COUNT(*) as c FROM categories")->fetch_assoc()['c'];

echo "<div class='row text-center'>";
echo "<div class='col-3'><h2 class='text-primary'>$users_count</h2><p>Customers</p></div>";
echo "<div class='col-3'><h2 class='text-success'>$products_count</h2><p>Products</p></div>";
echo "<div class='col-3'><h2 class='text-info'>$orders_count</h2><p>Orders</p></div>";
echo "<div class='col-3'><h2 class='text-warning'>$categories_count</h2><p>Categories</p></div>";
echo "</div>";
echo "</div>";

echo "<div class='step success'>";
echo "<h4>Step 5: Session Set</h4>";
echo "<p class='text-success'>✅ Admin session is active</p>";
echo "<p>You can now access all admin pages without login!</p>";
echo "</div>";

$conn->close();
?>

        <div class="step text-center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <h2>🎉 Setup Complete!</h2>
            <p class="lead">Click any button below to test your pages:</p>
            <hr style="border-color: rgba(255,255,255,0.3);">
            
            <a href="admin/customers.php" class="btn btn-light btn-test">
                <i class="bi bi-people-fill"></i> View Customers
            </a>
            <a href="admin/products.php" class="btn btn-light btn-test">
                <i class="bi bi-box-seam-fill"></i> View Products
            </a>
            <a href="admin/orders.php" class="btn btn-light btn-test">
                <i class="bi bi-cart-check-fill"></i> View Orders
            </a>
            <a href="admin/categories.php" class="btn btn-light btn-test">
                <i class="bi bi-tags-fill"></i> View Categories
            </a>
            <a href="admin/reports.php" class="btn btn-light btn-test">
                <i class="bi bi-graph-up"></i> View Reports
            </a>
            <a href="admin/settings.php" class="btn btn-light btn-test">
                <i class="bi bi-gear-fill"></i> Settings
            </a>
            <a href="admin/index.php" class="btn btn-warning btn-test">
                <i class="bi bi-speedometer2"></i> Dashboard
            </a>
        </div>

        <div class="alert alert-info">
            <h5>📝 What Each Page Shows:</h5>
            <ul class="mb-0">
                <li><strong>Customers:</strong> List of 10 customers with their order counts and total spent</li>
                <li><strong>Products:</strong> List of 10 products with prices and stock</li>
                <li><strong>Orders:</strong> List of 5 sample orders</li>
                <li><strong>Categories:</strong> 5 product categories</li>
                <li><strong>Reports:</strong> Sales charts and statistics</li>
                <li><strong>Settings:</strong> Store configuration forms (all working!)</li>
            </ul>
        </div>
    </div>
</body>
</html>
