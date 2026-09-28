const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/reviews - Get all recent reviews with mess details
router.get('/', (req, res) => {
  const query = `
    SELECT 
      r.id, r.mess_id, r.student_name, r.rating, r.crowd_experience, 
      r.wait_time_reported, r.comment, r.tags, r.created_at, r.helpful_count,
      m.name as mess_name, m.food_type as mess_food_type, m.image as mess_image
    FROM reviews r
    JOIN messes m ON r.mess_id = m.id
    ORDER BY r.created_at DESC
    LIMIT 25
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map((r) => ({
      ...r,
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : r.tags
    }));
    res.json(formatted);
  });
});

// POST /api/messes/:id/reviews - Submit a new review for a mess
router.post('/mess/:id', (req, res) => {
  const { id } = req.params;
  const {
    student_name,
    rating,
    crowd_experience = 'Moderate',
    wait_time_reported = '5-10m',
    comment,
    tags = []
  } = req.body;

  if (!student_name || !rating || !comment) {
    return res.status(400).json({ error: 'Name, rating and review comment are required' });
  }

  const reviewId = 'rev-' + Date.now();
  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

  db.run(
    `INSERT INTO reviews (id, mess_id, student_name, rating, crowd_experience, wait_time_reported, comment, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [reviewId, id, student_name.trim(), Number(rating), crowd_experience, wait_time_reported, comment.trim(), tagsJson],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Recalculate average rating & review count for this mess
      db.get(
        `SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE mess_id = ?`,
        [id],
        (calcErr, calcRow) => {
          if (!calcErr && calcRow) {
            const newAvg = Math.round((calcRow.avgRating || rating) * 10) / 10;
            const newCount = calcRow.count || 1;
            db.run(
              `UPDATE messes SET rating = ?, review_count = ? WHERE id = ?`,
              [newAvg, newCount, id]
            );
          }
        }
      );

      res.status(201).json({
        success: true,
        message: 'Review posted successfully!',
        review: {
          id: reviewId,
          mess_id: id,
          student_name,
          rating: Number(rating),
          crowd_experience,
          wait_time_reported,
          comment,
          tags,
          created_at: new Date().toISOString(),
          helpful_count: 0
        }
      });
    }
  );
});

// POST /api/reviews/:id/helpful - Upvote review
router.post('/:id/helpful', (req, res) => {
  const { id } = req.params;
  db.run(
    `UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?`,
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Review marked helpful' });
    }
  );
});

module.exports = router;
