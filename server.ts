import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { store } from './src/data/store';
import { consultPrescriptionAndFormula } from './src/ai/prescription';

const upload = multer();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(upload.any());

// Middleware to strip '/ppp' prefix if requests come from legacy relative links
app.use((req, res, next) => {
  if (req.url.startsWith('/ppp/')) {
    req.url = req.url.replace('/ppp/', '/');
  }
  next();
});

// Helper for session user from cookies
function getCurrentUser(req: Request) {
  const sessionUser = req.cookies['medix_session_user'];
  if (sessionUser) {
    try {
      return JSON.parse(sessionUser);
    } catch {
      return null;
    }
  }
  return null;
}

// ==========================================
// 1. AI DOCTOR PRESCRIPTION & FORMULA API
// ==========================================
app.post(['/api/ai/prescription-consult', '/api/ai-prescription'], async (req: Request, res: Response) => {
  try {
    const { prescriptionText, patientAge, patientNotes, imageBase64, mimeType } = req.body;
    if (!prescriptionText && !imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a prescription text/formula or upload a prescription image.'
      });
    }

    const result = await consultPrescriptionAndFormula({
      prescriptionText,
      patientAge,
      patientNotes,
      imageBase64,
      mimeType
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error in AI prescription consultation route:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to process AI prescription consultation'
    });
  }
});

// ==========================================
// 2. PRODUCTS & SEARCH API
// ==========================================
app.get(['/api/get_products.php', '/api/products'], (req: Request, res: Response) => {
  const category = (req.query.category as string) || '';
  const search = (req.query.search as string) || (req.query.q as string) || '';
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 0;

  const products = store.searchProducts(search, category, limit);
  return res.json(products);
});

app.get(['/api/search_suggestions.php', '/api/search-suggestions'], (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').trim().toLowerCase();
  if (!q) {
    return res.json([]);
  }

  const matches = store.searchProducts(q, undefined, 8);
  const suggestions = matches.map(p => ({
    id: p.id,
    name: p.name,
    formula: p.formula,
    category: p.category.charAt(0).toUpperCase() + p.category.slice(1),
    price: `PKR ${p.price.toLocaleString()}`,
    in_stock: p.stock_quantity > 0,
    image_url: p.image_url
  }));

  return res.json(suggestions);
});

app.get('/api/categories', (req: Request, res: Response) => {
  return res.json(store.categories);
});

// ==========================================
// 3. USER AUTH & SESSIONS
// ==========================================
app.get(['/api/check_session.php', '/api/session'], (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (user) {
    return res.json({
      logged_in: true,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'customer'
    });
  }
  return res.json({ logged_in: false });
});

app.post(['/api/login.php', '/api/login'], (req: Request, res: Response) => {
  const email = (req.body.email || req.body.username || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email/Username and password are required.' });
  }

  // Admin login check (admin / admin123)
  if ((email === 'admin' || email === 'admin@medix.com') && (password === 'admin123' || password === 'admin')) {
    const adminUser = store.users.find(u => u.role === 'admin') || {
      id: 1,
      username: 'admin',
      name: 'Administrator',
      email: 'admin@medix.com',
      role: 'admin' as const,
      created_at: new Date().toISOString()
    };

    res.cookie('medix_session_user', JSON.stringify(adminUser), {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.json({
      success: true,
      message: 'Admin login successful!',
      user: adminUser,
      redirect: '/admin/index.html'
    });
  }

  // Customer user check
  const user = store.users.find(u => u.email.toLowerCase() === email || u.username.toLowerCase() === email);
  if (user) {
    res.cookie('medix_session_user', JSON.stringify(user), {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.json({
      success: true,
      message: 'Login successful!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  }

  // Auto-allow sample login for frictionless demonstration
  const newUser = {
    id: store.users.length + 1,
    username: email.split('@')[0],
    name: email.split('@')[0],
    email: email.includes('@') ? email : `${email}@medix.com`,
    role: 'customer' as const,
    created_at: new Date().toISOString()
  };
  store.users.push(newUser);
  store.save();

  res.cookie('medix_session_user', JSON.stringify(newUser), {
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  return res.json({
    success: true,
    message: 'Login successful!',
    user: newUser
  });
});

app.post(['/api/register.php', '/api/register'], (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }

  const existing = store.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists. Please login.' });
  }

  const newUser = {
    id: store.users.length + 1,
    username: email.split('@')[0],
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone || '',
    role: 'customer' as const,
    created_at: new Date().toISOString()
  };

  store.users.push(newUser);
  store.save();

  res.cookie('medix_session_user', JSON.stringify(newUser), {
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  return res.json({
    success: true,
    message: 'Account created successfully! Welcome to Medix.',
    user: newUser,
    redirect: '/index.html'
  });
});

app.all(['/api/logout.php', '/api/logout', '/user/logout.php', '/admin/logout.php'], (req: Request, res: Response) => {
  res.clearCookie('medix_session_user', { path: '/' });
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.json({ success: true, message: 'Logged out successfully' });
  }
  return res.redirect('/index.html');
});

// ==========================================
// 4. ORDERS & CHECKOUT API
// ==========================================
app.post(['/api/orders', '/api/checkout'], (req: Request, res: Response) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    city,
    payment_method,
    items,
    shipping,
    prescription_notes,
    ai_recommended
  } = req.body;

  if (!customer_name || !customer_email || !customer_address || !items || !items.length) {
    return res.status(400).json({ success: false, message: 'Please provide all required checkout fields and at least one item.' });
  }

  const parsedItems: any[] = typeof items === 'string' ? JSON.parse(items) : items;
  let subtotal = 0;
  const orderItems = parsedItems.map((item, index) => {
    const itemSubtotal = (item.price || 0) * (item.quantity || 1);
    subtotal += itemSubtotal;
    return {
      id: index + 1,
      product_id: item.id || item.product_id,
      name: item.name,
      formula: item.formula || '',
      price: item.price || 0,
      quantity: item.quantity || 1,
      subtotal: itemSubtotal
    };
  });

  const shippingCost = shipping !== undefined ? Number(shipping) : 150;
  const totalAmount = subtotal + shippingCost;
  const orderNumber = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = {
    id: store.orders.length + 1,
    order_number: orderNumber,
    user_id: getCurrentUser(req)?.id || 2,
    customer_name,
    customer_email,
    customer_phone: customer_phone || '',
    customer_address,
    city: city || 'Karachi',
    payment_method: payment_method || 'cod',
    items: orderItems,
    subtotal,
    shipping: shippingCost,
    total_amount: totalAmount,
    status: 'pending' as const,
    prescription_notes: prescription_notes || '',
    ai_recommended: Boolean(ai_recommended),
    created_at: new Date().toISOString()
  };

  store.orders.unshift(newOrder);
  store.save();

  return res.json({
    success: true,
    message: 'Order placed successfully!',
    order_number: orderNumber,
    order: newOrder
  });
});

app.get('/api/orders', (req: Request, res: Response) => {
  return res.json(store.orders);
});

app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const order = store.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.status = status;
  store.save();
  return res.json({ success: true, order });
});

// ==========================================
// 5. CONTACT & OFFERS
// ==========================================
app.post(['/api/submit_contact.php', '/api/contact'], (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and message.' });
  }

  store.messages.unshift({
    id: store.messages.length + 1,
    name,
    email,
    phone: phone || '',
    subject: subject || 'General Inquiry',
    message,
    created_at: new Date().toISOString(),
    status: 'unread'
  });
  store.save();

  return res.json({
    success: true,
    message: 'Thank you for contacting MEDIX! Our pharmacy team will respond shortly.'
  });
});

app.get(['/api/get_offers.php', '/api/offers'], (req: Request, res: Response) => {
  return res.json([
    {
      id: 1,
      product_id: 1,
      discount_percent: 15,
      offer_label: 'HOT DEAL',
      title: 'Flat 15% OFF Pain & Fever Care'
    },
    {
      id: 2,
      product_id: 11,
      discount_percent: 20,
      offer_label: 'SUPER SAVER',
      title: '20% OFF Daily Immunity Boosters'
    }
  ]);
});

app.get('/api/stats', (req: Request, res: Response) => {
  const totalSales = store.orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total_amount : 0), 0);
  const totalOrders = store.orders.length;
  const pendingOrders = store.orders.filter(o => o.status === 'pending').length;
  const totalCustomers = store.users.length;
  const totalProducts = store.products.length;

  return res.json({
    totalSales,
    totalOrders,
    pendingOrders,
    totalCustomers,
    totalProducts
  });
});

// Admin Product Management Endpoints
app.post('/api/admin/products', (req: Request, res: Response) => {
  const p = req.body;
  const newProduct = {
    id: store.products.length > 0 ? Math.max(...store.products.map(x => x.id)) + 1 : 1,
    name: p.name || 'New Medicine',
    formula: p.formula || 'Active Pharmaceutical Ingredient',
    generic_name: p.generic_name || p.name || '',
    strength: p.strength || 'Standard',
    dosage_form: p.dosage_form || 'Tablet',
    description: p.description || '',
    price: parseFloat(p.price) || 50,
    category: p.category || 'prescription',
    stock: parseInt(p.stock) || 100,
    stock_quantity: parseInt(p.stock) || 100,
    icon: p.icon || '💊',
    image_url: p.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    prescription_required: Boolean(p.prescription_required),
    indications: p.indications || '',
    contraindications: p.contraindications || '',
    manufacturer: p.manufacturer || 'Medix Pharma'
  };

  store.products.unshift(newProduct);
  store.save();
  return res.json({ success: true, product: newProduct });
});

app.delete('/api/admin/products/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const idx = store.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    store.products.splice(idx, 1);
    store.save();
    return res.json({ success: true, message: 'Product deleted' });
  }
  return res.status(404).json({ success: false, message: 'Product not found' });
});

// ==========================================
// 6. LEGACY PHP REDIRECTS / REWRITES
// ==========================================
const routeMap: Record<string, string> = {
  '/products.php': '/products.html',
  '/products': '/products.html',
  '/cart.php': '/cart.html',
  '/cart': '/cart.html',
  '/checkout.php': '/checkout.html',
  '/checkout': '/checkout.html',
  '/order_success.php': '/order_success.html',
  '/order_success': '/order_success.html',
  '/login.php': '/login.html',
  '/register.php': '/register.html',
  '/about.php': '/about.html',
  '/contact.php': '/contact.html',
  '/prescription': '/prescription.html',
  '/prescription.php': '/prescription.html',
  '/admin': '/admin/index.html',
  '/admin/': '/admin/index.html',
  '/admin/index.php': '/admin/index.html',
  '/admin/products.php': '/admin/products.html',
  '/admin/orders.php': '/admin/orders.html',
  '/admin/customers.php': '/admin/customers.html',
  '/admin/categories.php': '/admin/categories.html',
  '/admin/reports.php': '/admin/reports.html',
  '/admin/settings.php': '/admin/settings.html',
  '/admin/login.php': '/admin/login.html'
};

for (const [legacyPath, targetFile] of Object.entries(routeMap)) {
  app.get(legacyPath, (req: Request, res: Response) => {
    const fullPath = path.join(__dirname, targetFile);
    if (fs.existsSync(fullPath)) {
      return res.sendFile(fullPath);
    }
    return res.redirect(targetFile);
  });
}

// Serve static directory
app.use(express.static(__dirname, { index: 'index.html' }));

// Catch-all route to serve index.html for unknown SPA routes
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  return res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`MEDIX Online Pharmacy & AI Recommender running at http://${HOST}:${PORT}`);
});
