require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database('sarsilmaz.sqlite');
const PORT = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET .env dosyasında tanımlanmalı.');
  process.exit(1);
}

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Diyarbakır',
  district TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  contact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || '';
if (adminEmail && adminPassword && !db.prepare('SELECT id FROM users WHERE email=?').get(adminEmail)) {
  const hash = bcrypt.hashSync(adminPassword, 12);
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)')
    .run('Yönetici', adminEmail, hash, 'admin');
  console.log('Yönetici hesabı oluşturuldu:', adminEmail);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 }
}));
app.use(express.static(path.join(__dirname, 'public')));

function esc(s='') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function currentUser(req) {
  if (!req.session.userId) return null;
  return db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(req.session.userId) || null;
}
function page(req, title, body) {
  const user = currentUser(req);
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} — SARSILMAZ</title><link rel="stylesheet" href="/style.css"></head><body><header class="top"><a class="brand" href="/">SARSILMAZ</a><nav><a href="/">İlanlar</a>${user ? `<a href="/ilan-ekle">İlan ekle</a><a href="/hesabim">Hesabım</a>${user.role==='admin'?'<a href="/yonetim">Yönetim</a>':''}<form class="inline" method="post" action="/cikis"><button class="linkbtn">Çıkış</button></form>` : '<a href="/giris">Giriş</a><a href="/kayit">Ücretsiz üye ol</a>'}</nav></header><main class="wrap">${body}</main><footer>18+ • Ücretsiz ilan • Şüpheli veya rıza dışı içerikleri bildirin. <br><small>Bu başlangıç sitesinde yayımlanan içeriklerin mevzuata uygunluğu ve rıza kontrolü site yöneticisinin sorumluluğundadır.</small></footer></body></html>`;
}
function requireLogin(req,res,next) {
  if (!currentUser(req)) return res.redirect('/giris');
  next();
}
function requireAdmin(req,res,next) {
  const u = currentUser(req);
  if (!u || u.role !== 'admin') return res.status(403).send(page(req,'Erişim reddedildi','<section class="panel"><h1>Erişim reddedildi</h1><p>Bu alan yalnızca yöneticiler içindir.</p></section>'));
  next();
}
app.get('/', (req,res) => {
  const rows = db.prepare("SELECT listings.*, users.name AS owner FROM listings JOIN users ON users.id=listings.user_id WHERE status='approved' ORDER BY id DESC").all();
  const cards = rows.length ? rows.map(x=>`<article class="card"><span class="tag">${esc(x.city)}${x.district ? ' • '+esc(x.district):''}</span><h2>${esc(x.title)}</h2><p>${esc(x.description)}</p><p class="muted">İlan sahibi: ${esc(x.owner)}</p><p><strong>İletişim:</strong> ${esc(x.contact)}</p></article>`).join('') : '<div class="panel"><h2>Henüz yayımlanmış ilan yok</h2><p>Ücretsiz üye olup ilanını gönderebilirsin. İlanlar onaydan sonra görünür.</p><a class="button" href="/kayit">Ücretsiz üye ol</a></div>';
  res.send(page(req,'Diyarbakır ilanları',`<section class="hero"><p class="eyebrow">DİYARBAKIR</p><h1>Ücretsiz ilan platformu</h1><p>Üyelik ücretsizdir. İlanlar yayımlanmadan önce yönetici onayından geçer.</p><a class="button" href="/ilan-ekle">Ücretsiz ilan ekle</a></section><section class="grid">${cards}</section><p class="notice">Yalnızca 18 yaş ve üzeri kullanıcılar içindir. Reşit olmayanlara ait, rızasız, zorlayıcı veya yasa dışı içeriklere izin verilmez.</p>`));
});
app.get('/kayit',(req,res)=>res.send(page(req,'Ücretsiz kayıt',`<section class="panel narrow"><h1>Ücretsiz üyelik</h1><form method="post"><label>Ad / kullanıcı adı<input name="name" required maxlength="60"></label><label>E-posta<input name="email" type="email" required maxlength="150"></label><label>Parola<input name="password" type="password" required minlength="10"></label><label class="check"><input type="checkbox" required> 18 yaşından büyük olduğumu ve kuralları kabul ettiğimi onaylıyorum.</label><button class="button">Hesap oluştur</button></form><p>Hesabın var mı? <a href="/giris">Giriş yap</a></p></section>`)));
app.post('/kayit',(req,res)=>{
  const name=(req.body.name||'').trim(), email=(req.body.email||'').trim().toLowerCase(), password=req.body.password||'';
  if(name.length<2||name.length>60||!email.includes('@')||password.length<10) return res.status(400).send(page(req,'Kayıt hatası','<section class="panel"><h1>Bilgileri kontrol et</h1><p>Geçerli e-posta gir ve en az 10 karakterlik parola seç.</p><a href="/kayit">Geri dön</a></section>'));
  try {
    const hash=bcrypt.hashSync(password,12);
    const info=db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name,email,hash);
    req.session.userId=info.lastInsertRowid; res.redirect('/hesabim');
  } catch(e) { res.status(400).send(page(req,'Kayıt hatası','<section class="panel"><h1>Bu e-posta kullanılıyor olabilir.</h1><a href="/kayit">Geri dön</a></section>')); }
});
app.get('/giris',(req,res)=>res.send(page(req,'Giriş',`<section class="panel narrow"><h1>Giriş yap</h1><form method="post"><label>E-posta<input name="email" type="email" required></label><label>Parola<input name="password" type="password" required></label><button class="button">Giriş yap</button></form><p>Üyeliğin yok mu? <a href="/kayit">Ücretsiz kayıt ol</a></p></section>`)));
app.post('/giris',(req,res)=>{
  const email=(req.body.email||'').trim().toLowerCase(), password=req.body.password||'';
  const u=db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if(!u||!bcrypt.compareSync(password,u.password_hash)) return res.status(401).send(page(req,'Giriş başarısız','<section class="panel"><h1>Giriş yapılamadı</h1><p>E-posta veya parola hatalı.</p><a href="/giris">Tekrar dene</a></section>'));
  req.session.userId=u.id; res.redirect('/hesabim');
});
app.post('/cikis',(req,res)=>req.session.destroy(()=>res.redirect('/')));
app.get('/ilan-ekle',requireLogin,(req,res)=>res.send(page(req,'İlan ekle',`<section class="panel narrow"><h1>Ücretsiz ilan ekle</h1><p>İlanın yayımlanmadan önce yönetici tarafından incelenir.</p><form method="post"><label>İlan başlığı<input name="title" required maxlength="100"></label><label>İlçe<input name="district" maxlength="60" placeholder="Örn. Kayapınar"></label><label>Açıklama<textarea name="description" required maxlength="1200" rows="5"></textarea></label><label>İletişim bilgisi<input name="contact" required maxlength="150"></label><label class="check"><input type="checkbox" required> İlanın doğru olduğunu, yalnızca yetişkinlere ait ve açık rızayla paylaşılmış bilgiler içerdiğini onaylıyorum.</label><button class="button">İlanı onaya gönder</button></form></section>`)));
app.post('/ilan-ekle',requireLogin,(req,res)=>{
  const title=(req.body.title||'').trim(), district=(req.body.district||'').trim(), description=(req.body.description||'').trim(), contact=(req.body.contact||'').trim();
  if(title.length<4||description.length<10||!contact||title.length>100||district.length>60||description.length>1200||contact.length>150) return res.status(400).send(page(req,'Form hatası','<section class="panel"><h1>Bilgileri kontrol et</h1><a href="/ilan-ekle">Geri dön</a></section>'));
  db.prepare('INSERT INTO listings(user_id,title,city,district,description,contact) VALUES(?,?,?,?,?,?)').run(req.session.userId,title,'Diyarbakır',district,description,contact);
  res.redirect('/hesabim');
});
app.get('/hesabim',requireLogin,(req,res)=>{
  const u=currentUser(req), rows=db.prepare('SELECT * FROM listings WHERE user_id=? ORDER BY id DESC').all(u.id);
  const content=rows.length?rows.map(x=>`<article class="card"><span class="tag">${esc(x.status==='pending'?'Onay bekliyor':x.status==='approved'?'Yayımlandı':'Reddedildi')}</span><h2>${esc(x.title)}</h2><p>${esc(x.description)}</p><form method="post" action="/ilan-sil/${x.id}" onsubmit="return confirm('Bu ilan silinsin mi?')"><button class="danger">İlanı sil</button></form></article>`).join(''):'<p>Henüz ilan eklemedin.</p>';
  res.send(page(req,'Hesabım',`<section class="panel"><h1>Merhaba, ${esc(u.name)}</h1><p>Üyelik ve ilan ekleme ücretsizdir.</p><a class="button" href="/ilan-ekle">Yeni ilan ekle</a></section><section class="grid">${content}</section>`));
});
app.post('/ilan-sil/:id',requireLogin,(req,res)=>{
  db.prepare('DELETE FROM listings WHERE id=? AND user_id=?').run(Number(req.params.id),req.session.userId); res.redirect('/hesabim');
});
app.get('/yonetim',requireLogin,requireAdmin,(req,res)=>{
  const rows=db.prepare("SELECT listings.*, users.name AS owner FROM listings JOIN users ON users.id=listings.user_id WHERE status='pending' ORDER BY id ASC").all();
  const content=rows.length?rows.map(x=>`<article class="card"><span class="tag">Onay bekliyor</span><h2>${esc(x.title)}</h2><p>${esc(x.description)}</p><p>${esc(x.city)} • ${esc(x.district)} • ${esc(x.owner)} • ${esc(x.contact)}</p><form method="post" action="/yonetim/${x.id}/onayla" class="inline"><button class="button">Onayla</button></form> <form method="post" action="/yonetim/${x.id}/reddet" class="inline"><button class="danger">Reddet</button></form></article>`).join(''):'<section class="panel"><h2>Bekleyen ilan yok</h2></section>';
  res.send(page(req,'Yönetim',`<h1>İlan moderasyonu</h1><p>Yalnızca uygun ve rıza esasına dayalı ilanları onayla.</p><section class="grid">${content}</section>`));
});
app.post('/yonetim/:id/onayla',requireLogin,requireAdmin,(req,res)=>{db.prepare("UPDATE listings SET status='approved' WHERE id=?").run(Number(req.params.id));res.redirect('/yonetim');});
app.post('/yonetim/:id/reddet',requireLogin,requireAdmin,(req,res)=>{db.prepare("UPDATE listings SET status='rejected' WHERE id=?").run(Number(req.params.id));res.redirect('/yonetim');});
app.listen(PORT,()=>console.log(`SARSILMAZ çalışıyor: http://localhost:${PORT}`));
