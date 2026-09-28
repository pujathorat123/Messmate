const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to parse JSON fields in a mess record
function formatMess(row) {
  if (!row) return null;
  return {
    ...row,
    menu_items: typeof row.menu_items === 'string' ? JSON.parse(row.menu_items || '[]') : row.menu_items,
    features: typeof row.features === 'string' ? JSON.parse(row.features || '[]') : row.features,
    is_open: Boolean(row.is_open)
  };
}

// GET /api/messes/popular - Top messes for homepage
router.get('/popular', (req, res) => {
  const query = `
    SELECT * FROM messes
    WHERE is_open = 1
    ORDER BY rating DESC, wait_time_mins ASC
    LIMIT 4
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(formatMess));
  });
});

// GET /api/stats - Quick stats for homepage banner
router.get('/stats', (req, res) => {
  db.get(`
    SELECT 
      COUNT(*) as totalMesses,
      AVG(wait_time_mins) as avgWaitTime,
      SUM(review_count) as totalReviews
    FROM messes
  `, (err, stats) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get(`SELECT COUNT(*) as activePasses FROM confirmations WHERE status = 'Confirmed'`, (err2, passRow) => {
      res.json({
        totalMesses: stats.totalMesses || 0,
        avgWaitTime: Math.round(stats.avgWaitTime || 8),
        totalReviews: stats.totalReviews || 0,
        activePasses: passRow ? passRow.activePasses : 0
      });
    });
  });
});

// GET /api/messes - Filtered directory
router.get('/', (req, res) => {
  const {
    search,
    foodType,
    maxPrice,
    crowdLevel,
    maxWait,
    openOnly,
    sortBy = 'rating_desc'
  } = req.query;

  let conditions = [];
  let params = [];

  if (search && search.trim() !== '') {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push('(LOWER(name) LIKE ? OR LOWER(tagline) LIKE ? OR LOWER(today_special) LIKE ? OR LOWER(address) LIKE ? OR LOWER(landmark) LIKE ?)');
    params.push(term, term, term, term, term);
  }

  if (foodType && foodType !== 'all') {
    if (foodType === 'Pure Veg') {
      conditions.push('food_type = ?');
      params.push('Pure Veg');
    } else if (foodType === 'Veg & Non-Veg') {
      conditions.push('food_type = ?');
      params.push('Veg & Non-Veg');
    } else if (foodType === 'South Indian') {
      conditions.push('food_type = ?');
      params.push('South Indian');
    }
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    conditions.push('price <= ?');
    params.push(Number(maxPrice));
  }

  if (crowdLevel && crowdLevel !== 'all') {
    conditions.push('crowd_level = ?');
    params.push(crowdLevel);
  }

  if (maxWait && !isNaN(Number(maxWait))) {
    conditions.push('wait_time_mins <= ?');
    params.push(Number(maxWait));
  }

  if (openOnly === 'true' || openOnly === '1') {
    conditions.push('is_open = 1');
  }

  let whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  let orderClause = 'ORDER BY rating DESC';
  if (sortBy === 'wait_asc') {
    orderClause = 'ORDER BY wait_time_mins ASC';
  } else if (sortBy === 'price_asc') {
    orderClause = 'ORDER BY price ASC';
  } else if (sortBy === 'price_desc') {
    orderClause = 'ORDER BY price DESC';
  } else if (sortBy === 'distance_asc') {
    orderClause = 'ORDER BY distance_meters ASC';
  } else if (sortBy === 'rating_desc') {
    orderClause = 'ORDER BY rating DESC';
  }

  const query = `SELECT * FROM messes ${whereClause} ${orderClause}`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(formatMess));
  });
});

// GET /api/messes/:id - Mess Details with Reviews
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM messes WHERE id = ?', [id], (err, messRow) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!messRow) return res.status(404).json({ error: 'Mess not found' });

    const mess = formatMess(messRow);

    // Fetch reviews for this mess
    db.all(
      'SELECT * FROM reviews WHERE mess_id = ? ORDER BY created_at DESC',
      [id],
      (revErr, revRows) => {
        if (revErr) return res.status(500).json({ error: revErr.message });
        mess.reviews = revRows.map((r) => ({
          ...r,
          tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : r.tags
        }));
        res.json(mess);
      }
    );
  });
});

// PATCH /api/messes/:id/crowd - Quick report/update crowd level & wait time
router.patch('/:id/crowd', (req, res) => {
  const { id } = req.params;
  const { crowd_level, wait_time_mins } = req.body;

  if (!crowd_level || wait_time_mins === undefined) {
    return res.status(400).json({ error: 'crowd_level and wait_time_mins required' });
  }

  db.run(
    'UPDATE messes SET crowd_level = ?, wait_time_mins = ? WHERE id = ?',
    [crowd_level, Number(wait_time_mins), id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Mess not found' });
      res.json({ success: true, message: 'Crowd status updated', crowd_level, wait_time_mins });
    }
  );
});

module.exports = router;
