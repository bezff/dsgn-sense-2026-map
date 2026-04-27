const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend/build')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const parsePercent = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

app.post('/api/map/background', upload.single('mapImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;

  db.run(`INSERT INTO maps (image_url) VALUES (?)`, [imageUrl], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, image_url: imageUrl });
  });
});

app.get('/api/map/background', (req, res) => {
  db.get(`SELECT * FROM maps ORDER BY created_at DESC LIMIT 1`, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Map not found' });
    }
    res.json(row);
  });
});

app.get('/api/markers', (req, res) => {
  db.all(`SELECT * FROM markers`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/markers', (req, res) => {
  const { x_percent, y_percent, title, description, photo_url } = req.body;
  const normalizedXPercent = parsePercent(x_percent);
  const normalizedYPercent = parsePercent(y_percent);
  const normalizedTitle = typeof title === 'string' && title.trim() ? title.trim() : 'БЕЗ НАЗВАНИЯ';
  const normalizedDescription = typeof description === 'string' ? description : '';
  const normalizedPhotoUrl = typeof photo_url === 'string' ? photo_url : null;

  if (normalizedXPercent === null || normalizedYPercent === null) {
    return res.status(400).json({ error: 'Invalid marker coordinates' });
  }
  
  db.run(
    `INSERT INTO markers (x_percent, y_percent, title, description, photo_url) VALUES (?, ?, ?, ?, ?)`,
    [normalizedXPercent, normalizedYPercent, normalizedTitle, normalizedDescription, normalizedPhotoUrl],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      db.get(`SELECT * FROM markers WHERE id = ?`, [this.lastID], (err, row) => {
        res.json(row);
      });
    }
  );
});

app.post('/api/markers/:id/photo', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const id = req.params.id;
  const photoUrl = `/uploads/${req.file.filename}`;

  db.run(`UPDATE markers SET photo_url = ? WHERE id = ?`, [photoUrl, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.get(`SELECT * FROM markers WHERE id = ?`, [id], (err, row) => {
      res.json(row);
    });
  });
});

app.put('/api/markers/:id', (req, res) => {
  const id = req.params.id;
  const { x_percent, y_percent, title, description } = req.body;

  db.get(`SELECT * FROM markers WHERE id = ?`, [id], (err, existingMarker) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!existingMarker) {
      return res.status(404).json({ error: 'Marker not found' });
    }

    const parsedXPercent = x_percent !== undefined ? parsePercent(x_percent) : existingMarker.x_percent;
    const parsedYPercent = y_percent !== undefined ? parsePercent(y_percent) : existingMarker.y_percent;
    const nextTitle = title !== undefined ? String(title).trim() || existingMarker.title : existingMarker.title;
    const nextDescription = description !== undefined ? String(description) : existingMarker.description;

    if (parsedXPercent === null || parsedYPercent === null) {
      return res.status(400).json({ error: 'Invalid marker coordinates' });
    }

    db.run(
      `UPDATE markers SET x_percent = ?, y_percent = ?, title = ?, description = ? WHERE id = ?`,
      [parsedXPercent, parsedYPercent, nextTitle, nextDescription, id],
      function(updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        db.get(`SELECT * FROM markers WHERE id = ?`, [id], (selectErr, row) => {
          if (selectErr) {
            return res.status(500).json({ error: selectErr.message });
          }
          res.json(row);
        });
      }
    );
  });
});

app.delete('/api/markers/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM markers WHERE id = ?`, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Marker deleted' });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`слушаю ${PORT}`);
});