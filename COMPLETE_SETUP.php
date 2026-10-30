<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MEDIX Complete Setup</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #B91C1C, #991B1B); min-height: 100vh; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
        h1 { color: #B91C1C; text-align: center; margin-bottom: 30px; font-size: 2rem; }
        .step { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 10px; border-left: 5px solid #B91C1C; }
        .step h3 { color: #333; margin-bottom: 10px; }
        .success { background: #d4edda; border-left-color: #28a745; }
        .success h3 { color: #155724; }
        .error { background: #f8d7da; border-left-color: #dc3545; }
        .error h3 { color: #721c24; }
        .warning { background: #fff3cd; border-left-color: #ffc107; }
        .warning h3 { color: #856404; }
        .btn { display: inline-block; padding: 12px 30px; background: #B91C1C; color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; transition: all 0.3s; }
        .btn:hover { background: #991B1B; transform: translateY(-2px); }
        .btn-success { background: #28a745; }
        .btn-success:hover { background: #218838; }
        .actions { text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px; }
        pre { background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 13px; }
        .product-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
        .product-item { background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏥 MEDIX Complete Setup & Diagnostics</h1>
        
        <?php
        error_reporting(E_ALL);
        ini_set('display_errors', 1);
        
        $errors = [];
        $warnings = [];
        $success = [];
        
        // Step 1: Check PHP
        echo '<div class="step success">';
        echo '<h3>✅ Step 1: PHP Check</h3>';
        echo '<p>PHP Version: <strong>' . phpversion() . '</strong></p>';
        echo '<p>PHP is working correctly!</p>';
        echo '</div>';
        
        // Step 2: Check MySQL Connection
        echo '<div class="step">';
        echo '<h3>🔍 Step 2: MySQL Connection</h3>';
        
        $host = 'localhost';
        $user = 'root';
        $pass = '';
        $dbname = 'medicare_db';
        
        $conn = @new mysqli($host, $user, $pass);
        
        if ($conn->connect_error) {
            echo '</div>';
            echo '<div class="step error">';
            echo '<h3>❌ MySQL Connection Failed</h3>';
            echo '<p><strong>Error:</strong> ' . $conn->connect_error . '</p>';
            echo '<p><strong>Solution:</strong></p>';
            echo '<ol>';
            echo '<li>Open <strong>XAMPP Control Panel</strong></li>';
            echo '<li>Click <strong>Start</strong> button next to MySQL</li>';
            echo '<li>Wait until MySQL status turns <span style="color: green; font-weight: bold;">GREEN</span></li>';
            echo '<li>Refresh this page</li>';
            echo '</ol>';
            echo '</div>';
            echo '<div class="actions">';
            echo '<a href="' . $_SERVER['PHP_SELF'] . '" class="btn">🔄 Refresh Page</a>';
            echo '</div>';
            echo '</div></body></html>';
            exit;
        }
        
        echo '<p style="color: #28a745; font-weight: bold;">✅ MySQL Connected Successfully!</p>';
        echo '</div>';
        
        // Step 3: Create/Check Database
        echo '<div class="step">';
        echo '<h3>📁 Step 3: Database Setup</h3>';
        
        $result = $conn->query("CREATE DATABASE IF NOT EXISTS $dbname");
        if ($result) {
            echo '<p>✅ Database "<strong>' . $dbname . '</strong>" is ready</p>';
        }
        
        $conn->select_db($dbname);
        
        // Step 4: Create Products Table
        echo '<h3 style="margin-top: 20px;">📋 Step 4: Products Table</h3>';
        
        // Drop and recreate to ensure clean state
        $conn->query("DROP TABLE IF EXISTS order_items");
        $conn->query("DROP TABLE IF EXISTS orders");
        $conn->query("DROP TABLE IF EXISTS products");
        
        $createTable = "CREATE TABLE products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            category VARCHAR(50) NOT NULL,
            stock INT DEFAULT 100,
            icon VARCHAR(10) DEFAULT '💊',
            image_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        if ($conn->query($createTable)) {
            echo '<p>✅ Products table created successfully</p>';
        } else {
            echo '<p style="color: #dc3545;">❌ Error creating table: ' . $conn->error . '</p>';
        }
        
        // Step 5: Insert Products
        echo '<h3 style="margin-top: 20px;">💊 Step 5: Adding Products</h3>';
        
        $products = [
            ['Panadol Extra', 'For tough pain and fever - effective pain relief', 50.00, 'prescription', '💊'],
            ['Augmentin 625mg', 'Broad spectrum antibiotic for infections', 240.00, 'prescription', '💊'],
            ['Brufen 400mg', 'Anti-inflammatory pain reliever', 35.00, 'prescription', '💊'],
            ['Disprin', 'Dissolvable aspirin for heart health', 15.00, 'prescription', '💊'],
            ['Viagra 100mg', 'Mens health medication', 800.00, 'prescription', '💊'],
            ['Vitamin C 1000mg', 'Immune system support', 12.99, 'vitamins', '💉'],
            ['Vitamin D3 2000IU', 'Bone health and immunity', 14.99, 'vitamins', '💉'],
            ['Multivitamin Complex', 'Complete daily nutrition', 19.99, 'vitamins', '💉'],
            ['Omega-3 Fish Oil', 'Heart and brain health', 24.99, 'vitamins', '💉'],
            ['Calcium + Vitamin D', 'Bone strength supplement', 16.99, 'vitamins', '💉'],
            ['Probiotic Capsules', 'Digestive health support', 22.99, 'vitamins', '💉'],
            ['First Aid Kit', 'Complete emergency medical kit', 29.99, 'firstaid', '🩹'],
            ['Bandages Pack', 'Assorted sterile bandages', 8.99, 'firstaid', '🩹'],
            ['Antiseptic Cream', 'Wound care and infection prevention', 7.99, 'firstaid', '🩹'],
            ['Digital Thermometer', 'Fast and accurate temperature reading', 15.99, 'devices', '🌡️'],
            ['Blood Pressure Monitor', 'Digital BP measurement device', 45.99, 'devices', '🌡️'],
            ['Infrared Thermometer', 'Non-contact temperature scanner', 34.99, 'devices', '🌡️'],
            ['Glucose Meter Kit', 'Blood sugar monitoring system', 39.99, 'devices', '🩺'],
            ['Pulse Oximeter', 'Oxygen saturation monitor', 29.99, 'devices', '🩺'],
            ['Hand Sanitizer 500ml', 'Antibacterial hand gel', 4.99, 'personal', '🧴']
        ];
        
        $stmt = $conn->prepare("INSERT INTO products (name, description, price, category, icon) VALUES (?, ?, ?, ?, ?)");
        
        $inserted = 0;
        $failed = 0;
        
        foreach ($products as $p) {
            $stmt->bind_param("ssdss", $p[0], $p[1], $p[2], $p[3], $p[4]);
            if ($stmt->execute()) {
                $inserted++;
            } else {
                $failed++;
            }
        }
        
        echo '<p style="color: #28a745; font-weight: bold;">✅ Successfully added ' . $inserted . ' products</p>';
        if ($failed > 0) {
            echo '<p style="color: #dc3545;">⚠️ Failed to add ' . $failed . ' products</p>';
        }
        
        echo '</div>';
        
        // Step 6: Verify Everything
        echo '<div class="step success">';
        echo '<h3>✅ Step 6: Verification</h3>';
        
        $result = $conn->query("SELECT COUNT(*) as total FROM products");
        $row = $result->fetch_assoc();
        $totalProducts = $row['total'];
        
        echo '<p><strong>Total Products in Database:</strong> ' . $totalProducts . '</p>';
        
        if ($totalProducts > 0) {
            echo '<h4 style="margin-top: 15px;">Sample Products:</h4>';
            echo '<div class="product-list">';
            
            $result = $conn->query("SELECT name, price, category, icon FROM products LIMIT 10");
            while ($row = $result->fetch_assoc()) {
                echo '<div class="product-item">';
                echo '<strong>' . $row['icon'] . ' ' . $row['name'] . '</strong><br>';
                echo 'PKR ' . number_format($row['price'], 2) . ' - ' . ucfirst($row['category']);
                echo '</div>';
            }
            
            echo '</div>';
        }
        
        echo '</div>';
        
        // Final Status
        echo '<div class="step success" style="text-align: center; padding: 30px;">';
        echo '<h2 style="color: #28a745; margin-bottom: 15px;">🎉 Setup Complete!</h2>';
        echo '<p style="font-size: 18px; margin-bottom: 20px;">Your MEDIX pharmacy is now fully operational with ' . $totalProducts . ' products</p>';
        echo '</div>';
        
        echo '<div class="actions">';
        echo '<a href="products.php" class="btn btn-success">📦 View Products Page</a>';
        echo '<a href="index.html" class="btn">🏠 Go to Homepage</a>';
        echo '<a href="admin/index.php" class="btn">⚙️ Admin Dashboard</a>';
        echo '</div>';
        
        // Show API Test
        echo '<div class="step">';
        echo '<h3>🔧 API Test</h3>';
        echo '<p>Testing if products API is working...</p>';
        
        $apiUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/api/get_products.php';
        echo '<p><strong>API URL:</strong> <code>' . $apiUrl . '</code></p>';
        
        $apiTest = @file_get_contents($apiUrl);
        if ($apiTest) {
            $products = json_decode($apiTest, true);
            if (is_array($products) && count($products) > 0) {
                echo '<p style="color: #28a745; font-weight: bold;">✅ API is working! Returns ' . count($products) . ' products</p>';
            } else {
                echo '<p style="color: #ffc107; font-weight: bold;">⚠️ API returns empty array</p>';
            }
        } else {
            echo '<p style="color: #dc3545; font-weight: bold;">❌ API not accessible</p>';
        }
        
        echo '</div>';
        
        $conn->close();
        ?>
        
        <div class="step" style="background: #e7f3ff; border-left-color: #0066cc;">
            <h3 style="color: #0066cc;">📝 Next Steps</h3>
            <ol style="margin-left: 20px; line-height: 1.8;">
                <li>Click <strong>"View Products Page"</strong> to see all products</li>
                <li>Products should display with names, prices, and icons</li>
                <li>If products don't show, press <strong>Ctrl+F5</strong> to clear cache</li>
                <li>Admin login: <code>admin / admin123</code></li>
            </ol>
        </div>
    </div>
</body>
</html>
