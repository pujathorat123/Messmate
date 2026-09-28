const http = require('http');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const messRoutes = require('./server/routes/messRoutes');
const reviewRoutes = require('./server/routes/reviewRoutes');
const confirmRoutes = require('./server/routes/confirmRoutes');

const app = express();
const PORT = 5555; // test port

app.use(cors());
app.use(express.json());

app.use('/api/messes', messRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/confirm', confirmRoutes);

const clientDistPath = path.join(__dirname, 'client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

const server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`);

  try {
    // 1. Test GET /api/messes
    const messesRes = await fetch(`http://localhost:${PORT}/api/messes`);
    const messes = await messesRes.json();
    console.log(`✓ GET /api/messes: Found ${messes.length} messes`);
    if (messes.length === 0) throw new Error('No messes returned');

    // 2. Test GET /api/messes/popular
    const popRes = await fetch(`http://localhost:${PORT}/api/messes/popular`);
    const popular = await popRes.json();
    console.log(`✓ GET /api/messes/popular: Found ${popular.length} top messes`);

    // 3. Test Filter: maxWait=5
    const waitFilterRes = await fetch(`http://localhost:${PORT}/api/messes?maxWait=5`);
    const waitMesses = await waitFilterRes.json();
    console.log(`✓ GET /api/messes?maxWait=5: Found ${waitMesses.length} instant wait messes`);

    // 4. Test Single Mess with Reviews
    const singleRes = await fetch(`http://localhost:${PORT}/api/messes/annapurna-mess`);
    const single = await singleRes.json();
    console.log(`✓ GET /api/messes/annapurna-mess: ${single.name} has ${single.reviews.length} reviews`);

    // 5. Test Confirm Pass POST
    const confirmRes = await fetch(`http://localhost:${PORT}/api/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mess_id: 'annapurna-mess',
        mess_name: 'Annapurna South & North Mess',
        student_name: 'Test Student',
        student_phone: '9876543210',
        meal_choice: 'Special Shahi Thali',
        price: 110,
        party_size: 1,
        estimated_arrival_mins: 10,
        notes: 'Express test'
      })
    });
    const confirmData = await confirmRes.json();
    console.log(`✓ POST /api/confirm: Created pass with code ${confirmData.pass.pass_code}`);

    // 6. Test Review POST
    const reviewRes = await fetch(`http://localhost:${PORT}/api/reviews/mess/annapurna-mess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_name: 'Harshita P. (BioTech 2nd Year)',
        rating: 5,
        crowd_experience: 'Low',
        wait_time_reported: 'Instant (<5m)',
        comment: 'Freshly made paneer and quick service! Beat the rush easily.',
        tags: ['Fast Counter', 'Hot Rotis']
      })
    });
    const reviewData = await reviewRes.json();
    console.log(`✓ POST /api/reviews/mess: Review submitted with ID ${reviewData.review.id}`);

    // 7. Test Helpful vote
    const helpfulRes = await fetch(`http://localhost:${PORT}/api/reviews/${reviewData.review.id}/helpful`, {
      method: 'POST'
    });
    const helpfulData = await helpfulRes.json();
    console.log(`✓ POST /api/reviews/:id/helpful: ${helpfulData.message}`);

    // 8. Test Crowd update PATCH
    const crowdRes = await fetch(`http://localhost:${PORT}/api/messes/annapurna-mess/crowd`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crowd_level: 'Moderate', wait_time_mins: 10 })
    });
    const crowdData = await crowdRes.json();
    console.log(`✓ PATCH /api/messes/:id/crowd: Updated crowd status to ${crowdData.crowd_level}`);

    // 9. Test Static HTML serving
    const htmlRes = await fetch(`http://localhost:${PORT}/`);
    const htmlText = await htmlRes.text();
    if (htmlText.includes('QuickMess')) {
      console.log('✓ GET /: Static React client served successfully with QuickMess HTML title');
    } else {
      throw new Error('Static index.html did not match');
    }

    console.log('\n🎉 ALL 9 END-TO-END TESTS PASSED SUCCESSFULLY!\n');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close(() => process.exit(1));
  }
});
