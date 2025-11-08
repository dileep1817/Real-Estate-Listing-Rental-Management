import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

const app = express();
const PORT = process.env.PORT || 4000;
const USE_DB = !!process.env.MONGODB_URI;

if (process.env.CLOUDINARY_URL) {
  cloudinary.config(process.env.CLOUDINARY_URL);
}

app.use(cors({
  origin: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helpers
async function maybeUploadPhotos(photos) {
  if (!Array.isArray(photos)) return [];
  const out = [];
  for (const p of photos) {
    if (typeof p === 'string' && /^data:image\//.test(p) && process.env.CLOUDINARY_URL) {
      try {
        const res = await cloudinary.uploader.upload(p, { resource_type: 'image' });
        out.push(res.secure_url || res.url);
      } catch {
        out.push(p);
      }
    } else {
      out.push(p);
    }
  }
  return out;
}

// DB model (optional)
let ListingModel = null;
if (USE_DB) {
  const ListingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    location: { type: String, default: '' },
    transactionType: { type: String, enum: ['rental', 'sale'], default: 'rental' },
    propertyType: { type: String, enum: ['apartment', 'house', 'villa', 'studio', 'land'], default: 'apartment' },
    ownerName: { type: String, default: 'Owner A' },
    photos: { type: [String], default: [] },
    landCategory: { type: String, enum: ['commercial', 'farming', ''], default: '' },
    booked: { type: Boolean, default: false },
  }, { timestamps: true });
  ListingModel = mongoose.model('Listing', ListingSchema);
  mongoose.connect(process.env.MONGODB_URI, { autoIndex: true }).catch(() => {});
}

// In-memory store for demo (fallback when no DB)
let nextId = 1;
const listings = USE_DB ? [] : [
  {
    id: nextId++,
    title: 'Cozy 2BHK Apartment',
    description: 'Near city center. Fully furnished.',
    price: 1200,
    location: 'Downtown',
    transactionType: 'rental',
    propertyType: 'apartment',
    ownerName: 'Owner A',
    photos: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop'
    ]
  }
];

// Seed additional apartment listings: 5 rentals + 5 sales (only when not using DB)
const seedApartmentPhotos = [
  'https://images.unsplash.com/photo-1505691723518-36a5ac3b2a59?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505691723499-9ca92b6c1d3a?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop',
];
for (let i = 1; !USE_DB && i <= 5; i++) {
  listings.push({
    id: nextId++,
    title: `Modern Apartment R${i}`,
    description: 'Spacious and well-lit apartment near tech hub.',
    price: 1500 + i * 100,
    location: `Neighborhood ${i}`,
    transactionType: 'rental',
    propertyType: 'apartment',
    ownerName: 'Owner A',
    photos: seedApartmentPhotos,
  })
}

// Seed Houses (only when not using DB)
const seedHousePhotos = [
  'https://images.unsplash.com/photo-1560185008-b033106af2ce?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560185009-5bf9f58f0f3b?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1200&auto=format&fit=crop',
]
for (let i = 1; i <= 5; i++) {
  listings.push({
    id: nextId++,
    title: `Family House R${i}`,
    description: 'Family-friendly house with backyard and parking.',
    price: 2500 + i * 150,
    location: `Greenfield Block ${i}`,
    transactionType: 'rental',
    propertyType: 'house',
    ownerName: 'Owner A',
    photos: seedHousePhotos,
  })
}
for (let i = 1; i <= 5; i++) {
  listings.push({
    id: nextId++,
    title: `Premium House S${i}`,
    description: 'Detached house with garden and modern interiors.',
    price: 12500000 + i * 500000,
    location: `Lakeview Avenue ${i}`,
    transactionType: 'sale',
    propertyType: 'house',
    ownerName: 'Owner A',
    photos: seedHousePhotos,
  })
}

// Seed Villas (only when not using DB)
const seedVillaPhotos = [
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505692794403-34d4982c4d35?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512914890250-3d6018887383?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494526580598-6022a8d04e6b?q=80&w=1200&auto=format&fit=crop',
]
for (let i = 1; i <= 5; i++) {
  listings.push({
    id: nextId++,
    title: `Resort Villa R${i}`,
    description: 'Private villa with pool and landscaped lawn.',
    price: 6000 + i * 300,
    location: `Palm Grove ${i}`,
    transactionType: 'rental',
    propertyType: 'villa',
    ownerName: 'Owner A',
    photos: seedVillaPhotos,
  })
}
for (let i = 1; i <= 5; i++) {
  listings.push({
    id: nextId++,
    title: `Signature Villa S${i}`,
    description: 'Signature luxury villa with premium finishes.',
    price: 34500000 + i * 1500000,
    location: `Sunset Boulevard ${i}`,
    transactionType: 'sale',
    propertyType: 'villa',
    ownerName: 'Owner A',
    photos: seedVillaPhotos,
  })
}

// Seed Studios (only when not using DB)
const seedStudioPhotos = [
  'https://images.unsplash.com/photo-1515260161320-1070cf3a2f9d?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1524758870432-af57e54afa26?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505691723518-36a5ac3b2a59?q=80&w=1200&auto=format&fit=crop',
]
for (let i = 1; i <= 5; i++) {
  listings.push({
    id: nextId++,
    title: `Compact Studio R${i}`,
    description: 'Furnished studio close to metro and cafes.',
    price: 1200 + i * 80,
    location: `Downtown Lane ${i}`,
    transactionType: 'rental',
    propertyType: 'studio',
    ownerName: 'Owner A',
    photos: seedStudioPhotos,
  })
}
for (let i = 1; i <= 5; i++) {
  listings.push({
    id: nextId++,
    title: `Urban Studio S${i}`,
    description: 'Smart studio in a central location.',
    price: 3500000 + i * 150000,
    location: `City Center ${i}`,
    transactionType: 'sale',
    propertyType: 'studio',
    ownerName: 'Owner A',
    photos: seedStudioPhotos,
  })
}
for (let i = 1; i <= 5; i++) {
  listings.push({
    id: nextId++,
    title: `Luxury Apartment S${i}`,
    description: 'Premium apartment with city views and amenities.',
    price: 7500000 + i * 250000,
    location: `Prime Area ${i}`,
    transactionType: 'sale',
    propertyType: 'apartment',
    ownerName: 'Owner A',
    photos: seedApartmentPhotos,
  })
}

// Seed Land (only when not using DB)
const seedLandPhotos = [
  'https://images.unsplash.com/photo-1533669955142-7b42f0baf2a4?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1460357676520-9c1c188b00fa?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503595855261-9418f48a9917?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1474224017046-182ece80b263?q=80&w=1200&auto=format&fit=crop',
]
for (let i = 1; i <= 5; i++) {
  listings.push({
    id: nextId++,
    title: `Open Plot R${i}`,
    description: 'Residential land suitable for temporary lease and storage.',
    price: 800 + i * 50,
    location: `Sector ${i}`,
    transactionType: 'rental',
    propertyType: 'land',
    landCategory: i <= 3 ? 'commercial' : 'farming',
    ownerName: 'Owner A',
    photos: seedLandPhotos,
  })
}
for (let i = 1; i <= 5; i++) {
  listings.push({
    id: nextId++,
    title: `Residential Plot S${i}`,
    description: 'Prime residential land parcel with road access.',
    price: 2500000 + i * 250000,
    location: `Ring Road ${i}`,
    transactionType: 'sale',
    propertyType: 'land',
    landCategory: i <= 3 ? 'commercial' : 'farming',
    ownerName: 'Owner A',
    photos: seedLandPhotos,
  })
}

app.get('/', (req, res) => {
  res.json({
    name: 'Real Estate Backend',
    status: 'ok',
    endpoints: ['/health', '/listings', '/listings/:id']
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'real-estate-backend' });
});

// Get all listings
app.get('/listings', async (req, res) => {
  try {
    if (USE_DB && ListingModel) {
      const items = await ListingModel.find().sort({ createdAt: -1 }).lean();
      // Normalize _id to id
      const mapped = items.map(it => ({ ...it, id: String(it._id) }));
      return res.json(mapped);
    }
    return res.json(listings);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get listing by id
app.get('/listings/:id', async (req, res) => {
  try {
    if (USE_DB && ListingModel) {
      const doc = await ListingModel.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.json({ ...doc, id: String(doc._id) });
    }
    const id = Number(req.params.id);
    const item = listings.find(l => l.id === id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    return res.json(item);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Create listing
app.post('/listings', async (req, res) => {
  try {
    const { title, description, price, location, transactionType, propertyType, ownerName, photos, landCategory, booked } = req.body || {};
    if (!title || price == null) {
      return res.status(400).json({ error: 'title and price are required' });
    }
    const processedPhotos = await maybeUploadPhotos(Array.isArray(photos) ? photos : []);
    if (USE_DB && ListingModel) {
      const doc = await ListingModel.create({
        title,
        description: description || '',
        price,
        location: location || '',
        transactionType: transactionType || 'rental',
        propertyType: propertyType || 'apartment',
        ownerName: ownerName || 'Owner A',
        photos: processedPhotos,
        landCategory: landCategory || '',
        booked: !!booked,
      });
      const obj = doc.toObject();
      return res.status(201).json({ ...obj, id: String(obj._id) });
    }
    const newItem = { id: nextId++, title, description: description || '', price, location: location || '', transactionType: transactionType || 'rental', propertyType: propertyType || 'apartment', ownerName: ownerName || 'Owner A', photos: processedPhotos, landCategory: landCategory || '', booked: !!booked };
    listings.push(newItem);
    return res.status(201).json(newItem);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Update listing
app.put('/listings/:id', async (req, res) => {
  try {
    const { title, description, price, location, transactionType, propertyType, ownerName, photos, landCategory, booked } = req.body || {};
    if (USE_DB && ListingModel) {
      const update = { };
      if (title !== undefined) update.title = title;
      if (description !== undefined) update.description = description;
      if (price !== undefined) update.price = price;
      if (location !== undefined) update.location = location;
      if (transactionType !== undefined) update.transactionType = transactionType;
      if (propertyType !== undefined) update.propertyType = propertyType;
      if (ownerName !== undefined) update.ownerName = ownerName;
      if (landCategory !== undefined) update.landCategory = landCategory;
      if (booked !== undefined) update.booked = !!booked;
      if (photos !== undefined) {
        update.photos = await maybeUploadPhotos(Array.isArray(photos) ? photos : []);
      }
      const doc = await ListingModel.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.json({ ...doc, id: String(doc._id) });
    }
    const id = Number(req.params.id);
    const idx = listings.findIndex(l => l.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const current = listings[idx];
    const updated = {
      ...current,
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(transactionType !== undefined ? { transactionType } : {}),
      ...(propertyType !== undefined ? { propertyType } : {}),
      ...(ownerName !== undefined ? { ownerName } : {}),
      ...(landCategory !== undefined ? { landCategory } : {}),
      ...(booked !== undefined ? { booked: !!booked } : {}),
      ...(photos !== undefined ? { photos: Array.isArray(photos) ? photos : [] } : {}),
    };
    listings[idx] = updated;
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update listing' });
  }
});

// Delete listing
app.delete('/listings/:id', async (req, res) => {
  try {
    if (USE_DB && ListingModel) {
      const doc = await ListingModel.findByIdAndDelete(req.params.id).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.json({ ...doc, id: String(doc._id) });
    }
    const id = Number(req.params.id);
    const idx = listings.findIndex(l => l.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const [removed] = listings.splice(idx, 1);
    return res.json(removed);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// Only start the server when running locally. On Vercel, we export the app for serverless.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`);
  });
}

export default app;
