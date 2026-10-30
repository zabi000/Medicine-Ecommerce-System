import fs from 'fs';
import path from 'path';

export interface Product {
  id: number;
  name: string;
  formula: string; // Active medical formula / salt composition
  generic_name: string;
  strength: string;
  description: string;
  dosage_form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Suspension' | 'Inhaler' | 'Cream' | 'Device' | 'Supplies' | 'Liquid' | string;
  price: number;
  category: string;
  stock: number;
  stock_quantity: number;
  icon: string;
  image_url: string;
  prescription_required: boolean;
  indications: string;
  contraindications?: string;
  manufacturer: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'admin' | 'customer';
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  formula?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  city?: string;
  payment_method: 'cod' | 'jazzcash' | 'easypaisa' | 'bank';
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  prescription_notes?: string;
  prescription_image?: string;
  ai_recommended?: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  display_name: string;
  description: string;
  icon: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  created_at: string;
  status: 'unread' | 'read' | 'replied';
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Panadol Extra 500mg/65mg',
    formula: 'Paracetamol 500mg + Caffeine 65mg',
    generic_name: 'Paracetamol & Caffeine',
    strength: '500mg / 65mg',
    dosage_form: 'Tablet',
    description: 'Advanced fast-acting pain relief for stubborn headaches, migraine, backache, and body pain.',
    price: 50,
    category: 'pain-relief',
    stock: 250,
    stock_quantity: 250,
    icon: '💊',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Headache, Migraine, Fever, Muscle ache',
    contraindications: 'Severe liver dysfunction, caffeine sensitivity',
    manufacturer: 'GSK Consumer Healthcare'
  },
  {
    id: 2,
    name: 'Augmentin 625mg',
    formula: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    generic_name: 'Amoxicillin with Clavulanate Potassium',
    strength: '625mg',
    dosage_form: 'Tablet',
    description: 'Broad-spectrum antibiotic for bacterial infections of ears, throat, lungs, urinary tract, and soft tissue.',
    price: 240,
    category: 'antibiotics',
    stock: 120,
    stock_quantity: 120,
    icon: '💊',
    image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&auto=format&fit=crop&q=80',
    prescription_required: true,
    indications: 'Respiratory tract infections, Sinusitis, Otitis media, UTI',
    contraindications: 'Penicillin allergy, history of amoxicillin-associated jaundice',
    manufacturer: 'GSK Pharmaceuticals'
  },
  {
    id: 3,
    name: 'Brufen 400mg',
    formula: 'Ibuprofen 400mg',
    generic_name: 'Ibuprofen',
    strength: '400mg',
    dosage_form: 'Tablet',
    description: 'Non-steroidal anti-inflammatory drug (NSAID) relieving pain, joint inflammation, dental pain, and fever.',
    price: 45,
    category: 'pain-relief',
    stock: 180,
    stock_quantity: 180,
    icon: '💊',
    image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Arthritis, Muscle strain, Dental pain, Dysmenorrhea',
    contraindications: 'Peptic ulcer, severe renal failure, active gastrointestinal bleeding',
    manufacturer: 'Abbott Laboratories'
  },
  {
    id: 4,
    name: 'Risek 20mg Capsule',
    formula: 'Omeprazole 20mg',
    generic_name: 'Omeprazole',
    strength: '20mg',
    dosage_form: 'Capsule',
    description: 'Proton Pump Inhibitor (PPI) that decreases stomach acid production for acid reflux, GERD, and peptic ulcers.',
    price: 280,
    category: 'digestive',
    stock: 140,
    stock_quantity: 140,
    icon: '💊',
    image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Heartburn, Gastroesophageal reflux (GERD), Gastric ulcers, Dyspepsia',
    contraindications: 'Hypersensitivity to omeprazole or substituted benzimidazoles',
    manufacturer: 'Getz Pharma'
  },
  {
    id: 5,
    name: 'Arinac Forte',
    formula: 'Ibuprofen 400mg + Pseudoephedrine Hydrochloride 60mg',
    generic_name: 'Ibuprofen & Pseudoephedrine HCl',
    strength: '400mg / 60mg',
    dosage_form: 'Tablet',
    description: 'Combined decongestant and pain reliever for cold, sinus pressure, flu symptoms, and blocked nasal passages.',
    price: 135,
    category: 'cold-flu',
    stock: 160,
    stock_quantity: 160,
    icon: '💊',
    image_url: 'https://images.unsplash.com/photo-1550572017-edd951aa8ca6?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Sinusitis, Flu, Nasal congestion, Fever, Body aches',
    contraindications: 'Uncontrolled hypertension, severe coronary artery disease, MAOI use',
    manufacturer: 'Abbott'
  },
  {
    id: 6,
    name: 'Disprin 300mg Soluble',
    formula: 'Aspirin (Acetylsalicylic Acid) 300mg',
    generic_name: 'Acetylsalicylic Acid',
    strength: '300mg',
    dosage_form: 'Tablet',
    description: 'Fast-dissolving soluble pain reliever, antiplatelet, and fever reducer for heart health and acute pain.',
    price: 25,
    category: 'pain-relief',
    stock: 400,
    stock_quantity: 400,
    icon: '💊',
    image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Emergency cardiac antiplatelet, Headache, Fever, Toothache',
    contraindications: 'Bleeding disorders, active gastric ulcer, children under 16 (Reye syndrome)',
    manufacturer: 'Reckitt Benckiser'
  },
  {
    id: 7,
    name: 'Zyrtec 10mg Film-Coated',
    formula: 'Cetirizine Dihydrochloride 10mg',
    generic_name: 'Cetirizine HCl',
    strength: '10mg',
    dosage_form: 'Tablet',
    description: 'Second-generation non-drowsy antihistamine for allergic rhinitis, hay fever, sneezing, itching, and urticaria.',
    price: 150,
    category: 'allergy',
    stock: 130,
    stock_quantity: 130,
    icon: '💊',
    image_url: 'https://images.unsplash.com/photo-1550572017-edd951aa8ca6?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Allergic rhinitis, Urticaria (hives), Itchy watery eyes, Skin allergies',
    contraindications: 'Severe renal impairment (CrCl < 10 ml/min)',
    manufacturer: 'GSK'
  },
  {
    id: 8,
    name: 'Flagyl 400mg',
    formula: 'Metronidazole 400mg',
    generic_name: 'Metronidazole',
    strength: '400mg',
    dosage_form: 'Tablet',
    description: 'Antimicrobial and antiprotozoal medication for amoebiasis, giardiasis, dental infections, and anaerobic bacteria.',
    price: 75,
    category: 'antibiotics',
    stock: 210,
    stock_quantity: 210,
    icon: '💊',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    prescription_required: true,
    indications: 'Amoebic dysentery, Dental abscess, Bacterial vaginosis, Giardiasis',
    contraindications: 'First trimester pregnancy, chronic alcoholism (disulfiram-like reaction)',
    manufacturer: 'Sanofi'
  },
  {
    id: 9,
    name: 'Gaviscon Double Action Liquid 150ml',
    formula: 'Sodium Alginate 500mg + Sodium Bicarbonate 213mg + Calcium Carbonate 325mg per 10ml',
    generic_name: 'Sodium Alginate & Antacids',
    strength: '150ml Suspension',
    dosage_form: 'Suspension',
    description: 'Forms a protective raft over stomach contents to soothe burning acid reflux and neutralize excess stomach acid.',
    price: 260,
    category: 'digestive',
    stock: 95,
    stock_quantity: 95,
    icon: '🧴',
    image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Acid reflux, Heartburn, Indigestion, Pregnancy heartburn',
    contraindications: 'Hypercalcemia, severe kidney disease',
    manufacturer: 'Reckitt Benckiser'
  },
  {
    id: 10,
    name: 'Ventolin Evohaler Inhaler 100mcg',
    formula: 'Salbutamol Sulfate 100mcg per puff',
    generic_name: 'Salbutamol',
    strength: '100mcg / actuation (200 doses)',
    dosage_form: 'Inhaler',
    description: 'Fast-acting bronchodilator rescue inhaler for acute asthma attacks, wheezing, and COPD airway constriction.',
    price: 310,
    category: 'prescription',
    stock: 75,
    stock_quantity: 75,
    icon: '🩺',
    image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80',
    prescription_required: true,
    indications: 'Asthma bronchospasm, Exercise-induced asthma, Chronic bronchitis',
    contraindications: 'Thyrotoxicosis, arrhythmia, unmonitored cardiovascular conditions',
    manufacturer: 'GSK'
  },
  {
    id: 11,
    name: 'Surbex-Z High Potency Zinc + B-Complex',
    formula: 'Zinc Sulfate 22.5mg + Vitamin C 500mg + Vitamin B-Complex + Folic Acid 400mcg + Vitamin E 30IU',
    generic_name: 'Multivitamin with Zinc',
    strength: '30 Tablets',
    dosage_form: 'Tablet',
    description: 'Formulated to treat nutritional deficiencies, boost immune defense, support hair and skin vitality, and combat physical fatigue.',
    price: 380,
    category: 'vitamins',
    stock: 190,
    stock_quantity: 190,
    icon: '💉',
    image_url: 'https://images.unsplash.com/photo-1550572017-edd951aa8ca6?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Immunity enhancement, Post-illness recovery, Hair fall, Daily energy',
    contraindications: 'Hypervitaminosis, Wilson disease',
    manufacturer: 'Abbott'
  },
  {
    id: 12,
    name: 'Sunny D 200,000 IU Oral Ampoule',
    formula: 'Cholecalciferol (Vitamin D3) 200,000 IU',
    generic_name: 'Cholecalciferol',
    strength: '200,000 IU / 1ml',
    dosage_form: 'Liquid',
    description: 'High-dose therapeutic Vitamin D3 for treating severe Vitamin D deficiency, osteomalacia, and bone weakness.',
    price: 170,
    category: 'vitamins',
    stock: 220,
    stock_quantity: 220,
    icon: '💉',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    prescription_required: true,
    indications: 'Vitamin D deficiency, Rickets, Osteoporosis prevention, Bone pain',
    contraindications: 'Hypercalcemia, metastatic calcification, Vitamin D toxicity',
    manufacturer: 'Searle Company'
  },
  {
    id: 13,
    name: 'Digital Blood Pressure Monitor (Upper Arm)',
    formula: 'Oscillometric High-Precision Digital Sensor',
    generic_name: 'Automatic Sphygmomanometer',
    strength: 'Standard Arm Cuff (22-42cm)',
    dosage_form: 'Device',
    description: 'Clinical grade automatic BP monitor with one-touch operation, irregular heartbeat detection, and dual memory logs.',
    price: 3800,
    category: 'devices',
    stock: 45,
    stock_quantity: 45,
    icon: '🩺',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Hypertension monitoring, Cardiovascular home health check',
    manufacturer: 'Omron Healthcare'
  },
  {
    id: 14,
    name: 'Digital Infrared Non-Contact Thermometer',
    formula: 'Infrared Temperature Optical Sensor',
    generic_name: 'Infrared Thermometer',
    strength: '1-Second Laser Scan',
    dosage_form: 'Device',
    description: 'Contactless clinical forehead thermometer with fever backlight alarm and accurate body & surface temperature reading.',
    price: 1450,
    category: 'devices',
    stock: 60,
    stock_quantity: 60,
    icon: '🌡️',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Body temperature scanning, Fever monitoring for adults and infants',
    manufacturer: 'Medix Diagnostics'
  },
  {
    id: 15,
    name: 'Fingertip Pulse Oximeter OLED',
    formula: 'Photoelectric Oxyhemoglobin Inspection Sensor',
    generic_name: 'SpO2 & Pulse Monitor',
    strength: 'OLED Display',
    dosage_form: 'Device',
    description: 'Fast and reliable real-time SpO2 blood oxygen saturation and pulse rate monitor with multi-directional display.',
    price: 1800,
    category: 'devices',
    stock: 55,
    stock_quantity: 55,
    icon: '🩺',
    image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Oxygen monitoring in asthma, COPD, pneumonia, altitude training',
    manufacturer: 'ChoiceMMed'
  },
  {
    id: 16,
    name: 'Complete Emergency First Aid Kit',
    formula: 'Sterile Gauze + Bandages + Antiseptic + Scissors + Burn Gel + Tape',
    generic_name: 'Emergency Medical Kit',
    strength: '85-Piece Medical Case',
    dosage_form: 'Supplies',
    description: 'Comprehensive trauma and emergency first aid medical case suitable for home, workplace, and travel preparedness.',
    price: 850,
    category: 'firstaid',
    stock: 70,
    stock_quantity: 70,
    icon: '🩹',
    image_url: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Wounds, Burns, Sprains, Minor cuts, Emergency first response',
    manufacturer: 'Medix Safety'
  },
  {
    id: 17,
    name: 'Pyodine Antiseptic Solution 60ml',
    formula: 'Povidone-Iodine 10% w/v (available iodine 1%)',
    generic_name: 'Povidone-Iodine',
    strength: '60ml Solution',
    dosage_form: 'Liquid',
    description: 'Broad-spectrum microbicidal antiseptic solution for disinfecting cuts, abrasions, burns, and preoperative skin.',
    price: 120,
    category: 'firstaid',
    stock: 240,
    stock_quantity: 240,
    icon: '🧴',
    image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Skin disinfection, Wound treatment, Prevention of infection',
    contraindications: 'Iodine hypersensitivity, thyroid disorders',
    manufacturer: 'Brookes Pharma'
  },
  {
    id: 18,
    name: 'Polyfax Skin Ointment 20g',
    formula: 'Polymyxin B Sulfate 10,000 units + Bacitracin Zinc 500 units per gram',
    generic_name: 'Polymyxin B & Bacitracin',
    strength: '20g Tube',
    dosage_form: 'Cream',
    description: 'Dual antibiotic topical ointment preventing bacterial infection in minor cuts, scrapes, and burns.',
    price: 95,
    category: 'firstaid',
    stock: 190,
    stock_quantity: 190,
    icon: '🩹',
    image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&auto=format&fit=crop&q=80',
    prescription_required: false,
    indications: 'Superficial skin infections, Impetigo, Minor burns, Abrasions',
    contraindications: 'Deep puncture wounds, animal bites without clinical supervision',
    manufacturer: 'GSK'
  },
  {
    id: 19,
    name: 'Glucophage 500mg',
    formula: 'Metformin Hydrochloride 500mg',
    generic_name: 'Metformin HCl',
    strength: '500mg',
    dosage_form: 'Tablet',
    description: 'First-line biguanide oral antihyperglycemic medication for the management of type 2 diabetes mellitus.',
    price: 180,
    category: 'prescription',
    stock: 150,
    stock_quantity: 150,
    icon: '💊',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    prescription_required: true,
    indications: 'Type 2 Diabetes Mellitus, Insulin resistance, PCOS',
    contraindications: 'Metabolic acidosis, severe renal impairment (eGFR < 30)',
    manufacturer: 'Merck Serono'
  },
  {
    id: 20,
    name: 'Lipitor 20mg',
    formula: 'Atorvastatin Calcium 20mg',
    generic_name: 'Atorvastatin',
    strength: '20mg',
    dosage_form: 'Tablet',
    description: 'HMG-CoA reductase inhibitor (statin) that lowers LDL cholesterol and triglycerides, reducing cardiovascular risk.',
    price: 550,
    category: 'prescription',
    stock: 90,
    stock_quantity: 90,
    icon: '💊',
    image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=80',
    prescription_required: true,
    indications: 'Hypercholesterolemia, Coronary heart disease risk reduction',
    contraindications: 'Active liver disease, pregnancy, nursing mothers',
    manufacturer: 'Pfizer'
  }
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'all', display_name: 'All Medicines', description: 'Complete pharmacy inventory', icon: '💊' },
  { id: 2, name: 'pain-relief', display_name: 'Pain & Fever Relief', description: 'Analgesics, antipyretics, and anti-inflammatories', icon: '⚡' },
  { id: 3, name: 'antibiotics', display_name: 'Antibiotics & Antimicrobials', description: 'Prescription antibiotics for bacterial infections', icon: '🛡️' },
  { id: 4, name: 'digestive', display_name: 'Digestive & Stomach Care', description: 'Antacids, PPIs, anti-diarrheal, and digestive health', icon: '🫄' },
  { id: 5, name: 'cold-flu', display_name: 'Cold, Flu & Cough', description: 'Decongestants, syrups, antihistamines, and throat lozenges', icon: '🤧' },
  { id: 6, name: 'vitamins', display_name: 'Vitamins & Supplements', description: 'Multivitamins, Vitamin D3, minerals, and immunity boosters', icon: '💉' },
  { id: 7, name: 'devices', display_name: 'Medical Devices & Equipment', description: 'BP monitors, thermometers, pulse oximeters, and kits', icon: '🩺' },
  { id: 8, name: 'firstaid', display_name: 'First Aid & Wound Care', description: 'Emergency bandages, antiseptic solutions, ointments, and gauze', icon: '🩹' },
  { id: 9, name: 'prescription', display_name: 'Doctor Prescribed Medicines', description: 'Chronic care, cardiovascular, and diabetes medications', icon: '📋' }
];

const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    name: 'Administrator',
    email: 'admin@medix.com',
    phone: '+92 300 0000000',
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 2,
    username: 'customer1',
    name: 'Ali Khan',
    email: 'ali.khan@example.com',
    phone: '+92 300 1234567',
    role: 'customer',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 1,
    order_number: 'ORD-2026-1001',
    user_id: 2,
    customer_name: 'Ali Khan',
    customer_email: 'ali.khan@example.com',
    customer_phone: '+92 300 1234567',
    customer_address: 'House 42, Block 6, PECHS, Karachi, Pakistan',
    city: 'Karachi',
    payment_method: 'cod',
    items: [
      { id: 1, product_id: 1, name: 'Panadol Extra 500mg/65mg', formula: 'Paracetamol + Caffeine', price: 50, quantity: 2, subtotal: 100 },
      { id: 2, product_id: 4, name: 'Risek 20mg Capsule', formula: 'Omeprazole 20mg', price: 280, quantity: 1, subtotal: 280 }
    ],
    subtotal: 380,
    shipping: 150,
    total_amount: 530,
    status: 'delivered',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 2,
    order_number: 'ORD-2026-1002',
    user_id: 2,
    customer_name: 'Fatima Tariq',
    customer_email: 'fatima@example.com',
    customer_phone: '+92 321 9876543',
    customer_address: 'Apartment 304, Gulberg III, Lahore, Pakistan',
    city: 'Lahore',
    payment_method: 'jazzcash',
    items: [
      { id: 3, product_id: 2, name: 'Augmentin 625mg', formula: 'Amoxicillin + Clavulanate', price: 240, quantity: 2, subtotal: 480 },
      { id: 4, product_id: 11, name: 'Surbex-Z High Potency Zinc + B-Complex', formula: 'Zinc + B-Complex + C', price: 380, quantity: 1, subtotal: 380 }
    ],
    subtotal: 860,
    shipping: 150,
    total_amount: 1010,
    status: 'processing',
    ai_recommended: true,
    prescription_notes: 'Doctor prescribed for acute bacterial pharyngitis and post-infection immunity',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

class DataStore {
  public products: Product[] = [];
  public categories: Category[] = [];
  public users: User[] = [];
  public orders: Order[] = [];
  public messages: ContactMessage[] = [];
  private filePath = path.join(process.cwd(), 'data_store.json');

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        this.products = data.products || INITIAL_PRODUCTS;
        this.categories = data.categories || INITIAL_CATEGORIES;
        this.users = data.users || INITIAL_USERS;
        this.orders = data.orders || INITIAL_ORDERS;
        this.messages = data.messages || [];
        return;
      }
    } catch (e) {
      console.warn('Could not read existing data_store.json, initializing fresh store', e);
    }
    this.products = INITIAL_PRODUCTS;
    this.categories = INITIAL_CATEGORIES;
    this.users = INITIAL_USERS;
    this.orders = INITIAL_ORDERS;
    this.messages = [];
    this.save();
  }

  public save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify({
        products: this.products,
        categories: this.categories,
        users: this.users,
        orders: this.orders,
        messages: this.messages
      }, null, 2));
    } catch (err) {
      console.error('Failed to write data_store.json', err);
    }
  }

  public findProduct(id: number): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  public searchProducts(query: string, category?: string, limit?: number): Product[] {
    let result = [...this.products];
    if (category && category !== 'all' && category !== '') {
      result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      const terms = q.split(/\s+/);
      result = result.filter(p => {
        const target = `${p.name} ${p.formula} ${p.generic_name} ${p.description} ${p.category} ${p.indications}`.toLowerCase();
        return terms.every(term => target.includes(term));
      });
    }
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }
    return result;
  }
}

export const store = new DataStore();
