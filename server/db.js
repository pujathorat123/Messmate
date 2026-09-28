const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'quickmess.sqlite');

// Resilient SQLite Driver:
// On Node 24 on Render Linux, the precompiled sqlite3 binary fails with `GLIBC_2.38 not found`
// because Render's base OS uses GLIBC 2.35. We provide automatic fallback to WASM SQLite (sql.js)
// which has ZERO glibc dependencies and is 100% compatible with SQLite 3 files & queries.

class WasmDatabase {
  constructor(filePath, onReady) {
    this.dbPath = filePath;
    this.queue = [];
    this.ready = false;
    this.rawDb = null;
    this.saveTimeout = null;

    let initSqlJs;
    try {
      initSqlJs = require('sql.js');
    } catch (e) {
      console.error('[QuickMess DB] Failed to require sql.js:', e.message);
      if (onReady) onReady(e);
      return;
    }

    initSqlJs()
      .then((SQL) => {
        this.SQL = SQL;
        if (fs.existsSync(this.dbPath)) {
          try {
            const fileBuffer = fs.readFileSync(this.dbPath);
            this.rawDb = new SQL.Database(fileBuffer);
          } catch (e) {
            console.warn('[QuickMess DB] Could not read existing SQLite file, creating fresh:', e.message);
            this.rawDb = new SQL.Database();
          }
        } else {
          this.rawDb = new SQL.Database();
        }

        this.ready = true;
        console.log('[QuickMess DB] WebAssembly SQLite engine initialized successfully (GLIBC-independent)');
        if (onReady) onReady(null);
        this.flushQueue();
      })
      .catch((err) => {
        console.error('[QuickMess DB] Failed to initialize WASM SQLite:', err);
        if (onReady) onReady(err);
      });
  }

  flushQueue() {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      task();
    }
  }

  saveToDisk() {
    if (!this.ready || !this.rawDb) return;
    try {
      const data = this.rawDb.export();
      fs.writeFileSync(this.dbPath, Buffer.from(data));
    } catch (e) {
      console.error('[QuickMess DB] Error writing to SQLite file:', e.message);
    }
  }

  scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveToDisk();
      this.saveTimeout = null;
    }, 40);
  }

  serialize(callback) {
    if (!this.ready) {
      this.queue.push(() => this.serialize(callback));
      return;
    }
    if (typeof callback === 'function') {
      callback();
    }
  }

  run(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    if (!this.ready) {
      this.queue.push(() => this.run(sql, params, callback));
      return this;
    }

    try {
      this.rawDb.run(sql, params);
      const changes = this.rawDb.getRowsModified();
      this.scheduleSave();
      if (typeof callback === 'function') {
        const context = { changes };
        callback.call(context, null);
      }
    } catch (err) {
      if (typeof callback === 'function') {
        callback(err);
      } else {
        console.error('[QuickMess DB] SQL run error:', err.message, sql);
      }
    }
    return this;
  }

  get(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    if (!this.ready) {
      this.queue.push(() => this.get(sql, params, callback));
      return this;
    }

    try {
      const stmt = this.rawDb.prepare(sql);
      stmt.bind(params);
      let row = null;
      if (stmt.step()) {
        row = stmt.getAsObject();
      }
      stmt.free();
      if (typeof callback === 'function') {
        callback(null, row || undefined);
      }
    } catch (err) {
      if (typeof callback === 'function') {
        callback(err);
      } else {
        console.error('[QuickMess DB] SQL get error:', err.message, sql);
      }
    }
    return this;
  }

  all(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    if (!this.ready) {
      this.queue.push(() => this.all(sql, params, callback));
      return this;
    }

    try {
      const stmt = this.rawDb.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      if (typeof callback === 'function') {
        callback(null, rows);
      }
    } catch (err) {
      if (typeof callback === 'function') {
        callback(err);
      } else {
        console.error('[QuickMess DB] SQL all error:', err.message, sql);
      }
    }
    return this;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...args) {
        let callback = null;
        let params = [];
        if (args.length > 0 && typeof args[args.length - 1] === 'function') {
          callback = args.pop();
        }
        if (args.length === 1 && Array.isArray(args[0])) {
          params = args[0];
        } else {
          params = args;
        }
        self.run(sql, params, callback);
        return this;
      },
      finalize(callback) {
        self.saveToDisk();
        if (typeof callback === 'function') {
          callback(null);
        }
      }
    };
  }
}

// Driver initialization: Try native sqlite3 first; if GLIBC or ABI issue, use WasmDatabase
let dbInstance = null;
let useNative = process.env.SQLITE_ENGINE !== 'wasm';

if (useNative) {
  try {
    const sqlite3 = require('sqlite3').verbose();
    dbInstance = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.warn(`[QuickMess DB] Native SQLite error (${err.message}). Falling back to WASM SQLite...`);
        initWasmFallback();
      } else {
        console.log('[QuickMess DB] Connected to native SQLite database at', dbPath);
        initDatabase(dbInstance);
      }
    });
  } catch (err) {
    console.warn(`[QuickMess DB] Native sqlite3 failed to load (${err.message}). Activating WASM SQLite for Render Linux / Node 24...`);
    initWasmFallback();
  }
} else {
  initWasmFallback();
}

function initWasmFallback() {
  dbInstance = new WasmDatabase(dbPath, (err) => {
    if (err) {
      console.error('[QuickMess DB] Fatal: Failed to initialize WASM SQLite:', err);
    } else {
      initDatabase(dbInstance);
    }
  });
}

function initDatabase(targetDb) {
  targetDb.serialize(() => {
    // 1. Messes table
    targetDb.run(`
      CREATE TABLE IF NOT EXISTS messes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tagline TEXT,
        food_type TEXT NOT NULL,
        price INTEGER NOT NULL,
        special_price INTEGER,
        crowd_level TEXT NOT NULL,
        wait_time_mins INTEGER NOT NULL,
        rating REAL NOT NULL,
        review_count INTEGER NOT NULL,
        opening_time TEXT NOT NULL,
        closing_time TEXT NOT NULL,
        distance_meters INTEGER NOT NULL,
        distance_walk_time TEXT NOT NULL,
        address TEXT NOT NULL,
        landmark TEXT NOT NULL,
        phone TEXT,
        is_open INTEGER NOT NULL DEFAULT 1,
        image TEXT NOT NULL,
        today_special TEXT NOT NULL,
        menu_items TEXT NOT NULL,
        features TEXT NOT NULL
      )
    `);

    // 2. Reviews table
    targetDb.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        mess_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        crowd_experience TEXT NOT NULL,
        wait_time_reported TEXT NOT NULL,
        comment TEXT NOT NULL,
        tags TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        helpful_count INTEGER DEFAULT 0,
        FOREIGN KEY (mess_id) REFERENCES messes (id) ON DELETE CASCADE
      )
    `);

    // 3. Confirmations table
    targetDb.run(`
      CREATE TABLE IF NOT EXISTS confirmations (
        id TEXT PRIMARY KEY,
        mess_id TEXT NOT NULL,
        mess_name TEXT NOT NULL,
        student_name TEXT NOT NULL,
        student_phone TEXT,
        meal_choice TEXT NOT NULL,
        price INTEGER NOT NULL,
        party_size INTEGER NOT NULL DEFAULT 1,
        estimated_arrival_mins INTEGER NOT NULL,
        pass_code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Confirmed',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mess_id) REFERENCES messes (id) ON DELETE CASCADE
      )
    `);

    // Check if initial seed is needed
    targetDb.get('SELECT COUNT(*) as count FROM messes', (err, row) => {
      if (err) {
        console.error('[QuickMess DB] Error counting messes:', err.message);
        return;
      }
      if (!row || row.count === 0) {
        console.log('[QuickMess DB] Seeding initial messes and reviews for QuickMess...');
        seedDatabase(targetDb);
      }
    });
  });
}

function seedDatabase(targetDb) {
  const messes = [
    {
      id: 'annapurna-mess',
      name: 'Annapurna South & North Mess',
      tagline: 'Fresh Homely Thalis & Unlimited Rotis',
      food_type: 'Pure Veg',
      price: 80,
      special_price: 110,
      crowd_level: 'Low',
      wait_time_mins: 4,
      rating: 4.8,
      review_count: 142,
      opening_time: '11:30 AM',
      closing_time: '03:30 PM',
      distance_meters: 150,
      distance_walk_time: '2 min walk',
      address: 'Shop 4, Campus Square, Near Gate 2',
      landmark: 'Directly opposite College Gate 2',
      phone: '+91 98230 44102',
      is_open: 1,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      today_special: 'Shahi Paneer Thali with Ghee Phulkas & Gulab Jamun',
      menu_items: JSON.stringify([
        { name: 'Standard Student Thali', price: 80, desc: 'Dal Tadka, Seasonal Veg, 4 Phulkas, Rice, Papad, Pickle', veg: true, special: false },
        { name: 'Special Shahi Thali', price: 110, desc: 'Shahi Paneer, Dal Makhani, 4 Butter Roti, Jeera Rice, Gulab Jamun, Curd', veg: true, special: true },
        { name: 'Mini Quick Box (Packed)', price: 70, desc: 'Pulao, Dal Fry, 3 Phulkas - express counter ready', veg: true, special: false },
        { name: 'Extra Sweet Gulab Jamun (2 pcs)', price: 25, desc: 'Hot syrup sweet treat', veg: true, special: false }
      ]),
      features: JSON.stringify(['Unlimited Hot Phulkas', 'Clean RO Water', 'Fast Token System', 'AC Seating', 'UPI Accepted'])
    },
    {
      id: 'sai-sagar-mess',
      name: 'Sai Sagar Deluxe Meals',
      tagline: 'Authentic Gujarati & Maharashtrian Lunch',
      food_type: 'Pure Veg',
      price: 90,
      special_price: 130,
      crowd_level: 'Moderate',
      wait_time_mins: 12,
      rating: 4.5,
      review_count: 98,
      opening_time: '12:00 PM',
      closing_time: '03:30 PM',
      distance_meters: 220,
      distance_walk_time: '3 min walk',
      address: 'Plot 12, College Road, Near Central Library',
      landmark: '100m from Central Library side gate',
      phone: '+91 98452 77123',
      is_open: 1,
      image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=800&q=80',
      today_special: 'Unlimited Dal-Bhaat, Kadhai Paneer & Masala Buttermilk',
      menu_items: JSON.stringify([
        { name: 'Gujarati Deluxe Meal', price: 90, desc: 'Sweet/Spicy Dal, Kadhai Sabzi, 5 Phulkas, Steamed Rice, Farsan, Buttermilk', veg: true, special: false },
        { name: 'Executive Paneer Feast', price: 130, desc: 'Kadhai Paneer, Veg Korma, Butter Naan/Roti, Masala Khichdi, Sweet', veg: true, special: true },
        { name: 'Student Budget Meal', price: 75, desc: 'Dal Fry, Dry Aloo Sabzi, 4 Rotis, Rice', veg: true, special: false }
      ]),
      features: JSON.stringify(['Chilled Buttermilk', 'Unlimited Rice & Dal', 'Spacious Hall', 'Fast Service'])
    },
    {
      id: 'campus-royal',
      name: 'Campus Royal Food Court & Mess',
      tagline: 'Student Favorite for Chicken Thali & Biryani',
      food_type: 'Veg & Non-Veg',
      price: 85,
      special_price: 120,
      crowd_level: 'High',
      wait_time_mins: 20,
      rating: 4.6,
      review_count: 215,
      opening_time: '11:45 AM',
      closing_time: '03:45 PM',
      distance_meters: 90,
      distance_walk_time: '1 min walk',
      address: 'Main University Promenade, Opposite Tech Park',
      landmark: 'Right outside Academic Complex Gate 1',
      phone: '+91 97112 33490',
      is_open: 1,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
      today_special: 'Kolhapuri Chicken Curry Thali with Biryani Rice & Tawa Roti',
      menu_items: JSON.stringify([
        { name: 'Royal Chicken Thali', price: 120, desc: 'Spicy Chicken Curry (3 pcs), Dal Tadka, 3 Tawa Rotis, Fragrant Biryani Rice, Raita', veg: false, special: true },
        { name: 'Egg Masala Thali', price: 95, desc: 'Double Egg Curry, Jeera Rice, 3 Rotis, Salad', veg: false, special: false },
        { name: 'Campus Veg Delight', price: 85, desc: 'Paneer Masala, Yellow Dal, 4 Chapatis, Steamed Rice, Pickle', veg: true, special: false }
      ]),
      features: JSON.stringify(['Non-Veg Specialties', 'Right Next to Classrooms', 'Digital Payment', 'Grab & Go Counter'])
    },
    {
      id: 'maa-ki-rasoi',
      name: 'Maa Ki Rasoi Homestyle Mess',
      tagline: 'Zero Soda, Low Oil Ghar Jaisa Swad',
      food_type: 'Pure Veg',
      price: 70,
      special_price: 95,
      crowd_level: 'Low',
      wait_time_mins: 5,
      rating: 4.9,
      review_count: 180,
      opening_time: '11:30 AM',
      closing_time: '03:00 PM',
      distance_meters: 300,
      distance_walk_time: '4 min walk',
      address: 'Flat 1-B, Shanti Enclave, Back Gate Road',
      landmark: 'Near Boys & Girls Hostel Back Entrance',
      phone: '+91 94235 66781',
      is_open: 1,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
      today_special: 'Ghar Ki Dal Tadka, Aloo Gobhi Matar & Desi Ghee Phulkas',
      menu_items: JSON.stringify([
        { name: 'Ghar Ki Thali (Mini)', price: 70, desc: 'Panchmel Dal, Green Veggie, 4 Soft Phulkas, Rice, Fresh Salad', veg: true, special: false },
        { name: 'Maa Ki Special Thali', price: 95, desc: 'Desi Paneer Bhurji, Dal Tadka, 5 Phulkas with Ghee, Jeera Rice, Kheer/Halwa', veg: true, special: true },
        { name: 'Diet Khichdi Bowl', price: 65, desc: 'Moong Dal Khichdi with Desi Ghee, Curd and Papad', veg: true, special: false }
      ]),
      features: JSON.stringify(['Low Oil & Healthy', 'Desi Ghee Phulkas', 'Warm Host Mother', 'Clean Kitchen'])
    },
    {
      id: 'udupi-krishna',
      name: 'Sri Krishna Udupi Mess',
      tagline: 'Authentic South Indian Meals & Crispy Dosas',
      food_type: 'South Indian',
      price: 65,
      special_price: 90,
      crowd_level: 'Moderate',
      wait_time_mins: 8,
      rating: 4.7,
      review_count: 135,
      opening_time: '11:00 AM',
      closing_time: '03:30 PM',
      distance_meters: 180,
      distance_walk_time: '2.5 min walk',
      address: 'Shop 8, Temple Lane, Off Main Gate',
      landmark: 'Next to State Bank of India ATM',
      phone: '+91 99012 34567',
      is_open: 1,
      image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=800&q=80',
      today_special: 'Mysore Traditional Meals with Piping Hot Sambar, Rasam & Semiya Payasam',
      menu_items: JSON.stringify([
        { name: 'Full South Indian Meals', price: 65, desc: 'Unlimited Sambar, Rasam, Kootu, Poriyal, Curd, Rice, Crisp Appalam, Pickle', veg: true, special: false },
        { name: 'Special Executive Combo', price: 90, desc: 'Meals + 2 Pooris with Potato Sagu + Sweet Payasam + Filter Coffee', veg: true, special: true },
        { name: 'Curd Rice & Pickle Express', price: 50, desc: 'Chilled tempered curd rice with pomegranate and crunchy boondi', veg: true, special: false }
      ]),
      features: JSON.stringify(['Unlimited Sambar & Rasam', 'Filter Coffee Available', 'Banana Leaf Dining', 'Ultra Fast Service'])
    },
    {
      id: 'green-leaf',
      name: 'Green Leaf Healthy Diet Mess',
      tagline: 'High-Protein, Gym Friendly & Nutrient Rich Food',
      food_type: 'Pure Veg',
      price: 95,
      special_price: 130,
      crowd_level: 'Low',
      wait_time_mins: 5,
      rating: 4.4,
      review_count: 72,
      opening_time: '12:00 PM',
      closing_time: '03:00 PM',
      distance_meters: 260,
      distance_walk_time: '3.5 min walk',
      address: 'Block C, Ground Floor, Fitness Arcade',
      landmark: 'Opposite Student Gym & Sports Complex',
      phone: '+91 96541 22890',
      is_open: 1,
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      today_special: 'Palak Paneer with Brown Rice, Soya Chunk Curry & Sprouts Bowl',
      menu_items: JSON.stringify([
        { name: 'Fitness Macro Bowl', price: 95, desc: '150g Low Fat Paneer, Boiled Chana, Brown Rice, Steamed Veggies, Mint Dip', veg: true, special: false },
        { name: 'High Protein Deluxe Thali', price: 130, desc: 'Paneer Bhurji, Soya Curry, 3 Multigrain Rotis, Sprouts Salad, Curd', veg: true, special: true },
        { name: 'Fresh Fruit & Sprout Salad', price: 60, desc: 'Pomegranate, Apple, Moong Sprouts with Lemon Chat Dressing', veg: true, special: false }
      ]),
      features: JSON.stringify(['Calories & Protein Mentioned', 'Multigrain Rotis', 'Brown Rice Available', 'Diet Friendly'])
    },
    {
      id: 'shree-ganesh',
      name: 'Shree Ganesh Budget Mess',
      tagline: 'Pocket-Friendly Unlimited Thali for Daily Students',
      food_type: 'Pure Veg',
      price: 60,
      special_price: 80,
      crowd_level: 'Moderate',
      wait_time_mins: 14,
      rating: 4.2,
      review_count: 88,
      opening_time: '11:30 AM',
      closing_time: '03:00 PM',
      distance_meters: 120,
      distance_walk_time: '1.5 min walk',
      address: 'Hostel Road, Lane 2, Behind Mess Block',
      landmark: 'Behind Boys Hostel Block 3',
      phone: '+91 93120 99432',
      is_open: 1,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      today_special: 'Sev Tamatar Ki Sabzi with Rajma Masala & Fresh Tawa Rotis',
      menu_items: JSON.stringify([
        { name: 'Super Saver Thali', price: 60, desc: 'Sev Tamatar, Yellow Dal, 5 Hot Rotis, Rice, Onions & Pickle', veg: true, special: false },
        { name: 'Unlimited Feast Thali', price: 80, desc: 'Rajma Masala, Aloo Palak, Unlimited Rotis & Rice, Roasted Papad', veg: true, special: true },
        { name: 'Student Pack-to-go', price: 55, desc: '4 Rotis + Sabzi + Rice in eco box', veg: true, special: false }
      ]),
      features: JSON.stringify(['Lowest Price on Campus', 'Unlimited Rotis Option', 'Quick Token Counters', 'Hostel Neighbor'])
    },
    {
      id: 'malabar-coastal',
      name: 'Malabar Coastal Mess & Kitchen',
      tagline: 'Kerala Parotta, Roast Chicken & Coastal Flavors',
      food_type: 'Veg & Non-Veg',
      price: 100,
      special_price: 140,
      crowd_level: 'High',
      wait_time_mins: 22,
      rating: 4.6,
      review_count: 118,
      opening_time: '12:00 PM',
      closing_time: '03:30 PM',
      distance_meters: 350,
      distance_walk_time: '5 min walk',
      address: 'Shop 14, West Avenue Market',
      landmark: 'Next to Campus Book Depot',
      phone: '+91 98840 55198',
      is_open: 1,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
      today_special: 'Kerala Chicken Roast with Layered Malabar Parotta & Jeera Rice',
      menu_items: JSON.stringify([
        { name: 'Malabar Chicken Roast Plate', price: 140, desc: '3 Flaky Parottas, Spiced Chicken Roast, Onion Salad, Gravy', veg: false, special: true },
        { name: 'Crispy Fish Fry Thali', price: 130, desc: 'Fresh River Fish Fry, Fish Curry, Steamed Rice, Cabbage Thoran', veg: false, special: false },
        { name: 'Veg Kerala Sadya Combo', price: 90, desc: 'Avial, Sambar, Rasam, 2 Parottas, Matta/White Rice, Payasam', veg: true, special: false }
      ]),
      features: JSON.stringify(['Flaky Kerala Parottas', 'Authentic Spices', 'High Demand Lunch Rush', 'Takeaway Available'])
    }
  ];

  const insertMessStmt = targetDb.prepare(`
    INSERT INTO messes (
      id, name, tagline, food_type, price, special_price, crowd_level, wait_time_mins,
      rating, review_count, opening_time, closing_time, distance_meters, distance_walk_time,
      address, landmark, phone, is_open, image, today_special, menu_items, features
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  messes.forEach((m) => {
    insertMessStmt.run(
      m.id, m.name, m.tagline, m.food_type, m.price, m.special_price, m.crowd_level, m.wait_time_mins,
      m.rating, m.review_count, m.opening_time, m.closing_time, m.distance_meters, m.distance_walk_time,
      m.address, m.landmark, m.phone, m.is_open, m.image, m.today_special, m.menu_items, m.features
    );
  });
  insertMessStmt.finalize();

  // Sample Reviews
  const reviews = [
    {
      id: 'rev-1',
      mess_id: 'annapurna-mess',
      student_name: 'Aman Sharma (CS 3rd Year)',
      rating: 5,
      crowd_experience: 'Low',
      wait_time_reported: 'Instant (<5m)',
      comment: 'Life saver during our 40 min lecture break! Reached at 1:10 PM, got my plate in under 4 minutes. Phulkas were straight from the tawa and hot.',
      tags: JSON.stringify(['Super Fast Queue', 'Hot Rotis', 'Clean Seating']),
      helpful_count: 14
    },
    {
      id: 'rev-2',
      mess_id: 'annapurna-mess',
      student_name: 'Pooja Verma (ECE 2nd Year)',
      rating: 5,
      crowd_experience: 'Low',
      wait_time_reported: '5-10m',
      comment: 'The Shahi Paneer today was restaurant quality at just ₹110. Highly recommend QuickMess pass to skip the token crowd.',
      tags: JSON.stringify(['Great Value', 'Delicious Dal', 'Fast Token']),
      helpful_count: 8
    },
    {
      id: 'rev-3',
      mess_id: 'campus-royal',
      student_name: 'Rohan Deshmukh (Mech 4th Year)',
      rating: 4,
      crowd_experience: 'Heavy Rush',
      wait_time_reported: '15-20m',
      comment: 'Chicken thali is arguably the best near campus, but crowd is insane between 1:15 to 1:45 PM. Better reserve or reach before 1:00 PM!',
      tags: JSON.stringify(['Best Chicken', 'Long Queues at 1:30', 'Good Portions']),
      helpful_count: 22
    },
    {
      id: 'rev-4',
      mess_id: 'maa-ki-rasoi',
      student_name: 'Sneha Kulkarni (MBA 1st Year)',
      rating: 5,
      crowd_experience: 'Low',
      wait_time_reported: 'Instant (<5m)',
      comment: 'Finally food that doesn’t cause acidity! Aunty serves with so much love. Minimal waiting time, very peaceful seating.',
      tags: JSON.stringify(['Zero Oil Feeling', 'Homely Vibe', 'Quick Serving']),
      helpful_count: 19
    },
    {
      id: 'rev-5',
      mess_id: 'udupi-krishna',
      student_name: 'Karthik Rao (Civil 3rd Year)',
      rating: 5,
      crowd_experience: 'Moderate',
      wait_time_reported: '5-10m',
      comment: 'Authentic Bangalore style sambar and rasam. Unlimited refill counters are super efficient. Only 8 minutes wait.',
      tags: JSON.stringify(['Crisp Appalam', 'Unlimited Sambar', 'Fast Counter']),
      helpful_count: 11
    },
    {
      id: 'rev-6',
      mess_id: 'shree-ganesh',
      student_name: 'Vikas Patel (IT 2nd Year)',
      rating: 4,
      crowd_experience: 'Moderate',
      wait_time_reported: '10-15m',
      comment: 'At ₹60, you cannot beat this price anywhere in the university perimeter. Ideal when month-end budget is tight.',
      tags: JSON.stringify(['Budget King', 'Unlimited Phulkas', 'Pocket Friendly']),
      helpful_count: 16
    }
  ];

  const insertReviewStmt = targetDb.prepare(`
    INSERT INTO reviews (id, mess_id, student_name, rating, crowd_experience, wait_time_reported, comment, tags, helpful_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  reviews.forEach((r) => {
    insertReviewStmt.run(r.id, r.mess_id, r.student_name, r.rating, r.crowd_experience, r.wait_time_reported, r.comment, r.tags, r.helpful_count);
  });
  insertReviewStmt.finalize();

  // Initial Sample Confirmation
  const initialConfirmation = {
    id: 'conf-101',
    mess_id: 'annapurna-mess',
    mess_name: 'Annapurna South & North Mess',
    student_name: 'Rahul Mishra',
    student_phone: '9876543210',
    meal_choice: 'Special Shahi Thali (₹110)',
    price: 110,
    party_size: 2,
    estimated_arrival_mins: 8,
    pass_code: 'QM-7821',
    status: 'Active',
    notes: 'Please keep 2 plates ready at Counter A'
  };

  targetDb.run(`
    INSERT INTO confirmations (id, mess_id, mess_name, student_name, student_phone, meal_choice, price, party_size, estimated_arrival_mins, pass_code, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    initialConfirmation.id, initialConfirmation.mess_id, initialConfirmation.mess_name,
    initialConfirmation.student_name, initialConfirmation.student_phone, initialConfirmation.meal_choice,
    initialConfirmation.price, initialConfirmation.party_size, initialConfirmation.estimated_arrival_mins,
    initialConfirmation.pass_code, initialConfirmation.status, initialConfirmation.notes
  ]);

  console.log('[QuickMess DB] Seeded database successfully with realistic campus mess data!');
}

// Proxy wrapper so calls delegate to whichever dbInstance was initialized
const dbProxy = {
  serialize(cb) {
    if (dbInstance && dbInstance.serialize) return dbInstance.serialize(cb);
    if (typeof cb === 'function') cb();
  },
  run(...args) {
    return dbInstance.run(...args);
  },
  get(...args) {
    return dbInstance.get(...args);
  },
  all(...args) {
    return dbInstance.all(...args);
  },
  prepare(...args) {
    return dbInstance.prepare(...args);
  }
};

module.exports = dbProxy;
