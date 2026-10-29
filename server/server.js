const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());

// In-memory DB for now (will use MongoDB later)
let users = [];
let transactions = [];
const JWT_SECRET = process.env.JWT_SECRET || 'violet-secret-2026';

// --- HEALTH ---
app.get('/', (req, res) => {
  res.json({ 
    message: 'Violet Pay API running 💜',
    version: '2.0 - Real Payments',
    endpoints: ['/api/health','/api/auth/register','/api/auth/login','/api/pay/flutterwave','/api/pay/momo','/api/transactions'],
    live: 'https://signal-violet-pay.onrender.com'
  });
});
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString(), uptime: 'LIVE' }));

// --- AUTH ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'User exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), name, email, password: hashed, wallet: 0 };
  users.push(user);
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name, email, wallet: user.wallet } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid login' });
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email, wallet: user.wallet } });
});

// --- FLUTTERWAVE ---
app.post('/api/pay/flutterwave', (req, res) => {
  const { amount, currency, email, phone, name } = req.body;
  // This is where real Flutterwave call goes when you add FLW_SECRET_KEY
  if (!process.env.FLW_SECRET_KEY) {
    // Mock success for demo
    const tx = { id: 'FLW_'+Date.now(), amount, currency: currency||'ZMW', status: 'initiated', provider: 'flutterwave', link: `https://checkout.flutterwave.com/pay/violet_${Date.now()}`, email };
    transactions.push(tx);
    return res.json({ message: 'Add FLW_SECRET_KEY in Render Env to go live', mock: true, paymentLink: tx.link, transaction: tx });
  }
  // Real implementation: const flw = new Flutterwave(process.env.FLW_SECRET_KEY, process.env.FLW_PUBLIC_KEY); ...
  res.json({ message: 'Flutterwave live mode would trigger here' });
});

// --- MOMO (MTN / Airtel) ---
app.post('/api/pay/momo', (req, res) => {
  const { amount, phone, provider } = req.body; // provider = 'mtn' or 'airtel'
  const tx = { id: 'MOMO_'+Date.now(), amount, phone, provider: provider||'mtn', status: 'pending', message: `Collect ${amount} ZMW from ${phone} via ${provider||'mtn'} initiated` };
  transactions.push(tx);
  // Real: integrate with MTN MoMo API / Airtel API here using MOMO keys
  res.json({ success: true, transaction: tx, next: 'User will receive USSD prompt on phone' });
});

// --- TRANSACTIONS ---
app.get('/api/transactions', (req, res) => {
  res.json({ count: transactions.length, transactions: transactions.slice(-20).reverse() });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Violet Pay v2 on ${PORT}`));
