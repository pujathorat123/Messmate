const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to generate a neat QuickMess pass code
function generatePassCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `QM-${num}`;
}

// POST /api/confirm - Confirm a mess & create a Lunch Pass
router.post('/', (req, res) => {
  const {
    mess_id,
    mess_name,
    student_name,
    student_phone = '',
    meal_choice,
    price = 80,
    party_size = 1,
    estimated_arrival_mins = 10,
    notes = ''
  } = req.body;

  if (!mess_id || !mess_name || !student_name || !meal_choice) {
    return res.status(400).json({ error: 'mess_id, mess_name, student_name, and meal_choice are required' });
  }

  const id = 'conf-' + Date.now();
  const pass_code = generatePassCode();

  db.run(
    `INSERT INTO confirmations (
      id, mess_id, mess_name, student_name, student_phone, meal_choice,
      price, party_size, estimated_arrival_mins, pass_code, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)`,
    [
      id,
      mess_id,
      mess_name,
      student_name.trim(),
      student_phone.trim(),
      meal_choice,
      Number(price),
      Number(party_size),
      Number(estimated_arrival_mins),
      pass_code,
      notes.trim()
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        success: true,
        message: 'Mess lunch pass confirmed successfully!',
        pass: {
          id,
          mess_id,
          mess_name,
          student_name,
          student_phone,
          meal_choice,
          price: Number(price),
          party_size: Number(party_size),
          estimated_arrival_mins: Number(estimated_arrival_mins),
          pass_code,
          status: 'Confirmed',
          notes,
          created_at: new Date().toISOString()
        }
      });
    }
  );
});

// GET /api/confirm/:id - Get pass details
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM confirmations WHERE id = ? OR pass_code = ?', [id, id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Lunch pass not found' });
    res.json(row);
  });
});

// GET /api/confirmations - Get all recent confirmations
router.get('/', (req, res) => {
  db.all('SELECT * FROM confirmations ORDER BY created_at DESC LIMIT 20', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
