# Lakshmi Millets - Full Stack E-commerce Website

"Eat Healthy, Live Healthy" — a millets e-commerce site with an Angular
frontend and a **Node.js/Express backend backed by MongoDB** (via Mongoose).

Includes login/register, product catalog with categories, cart, checkout
with 4 delivery locations (Hyderabad, Bangalore, Chennai, Andhra
Pradesh/Vijayawada), and a simulated payment flow (COD / UPI / Card / Net
Banking).

## Project structure
```
lakshmi-millets/
├── backend/
│   ├── config/db.js          <- connects to MongoDB (mongoose.connect)
│   ├── models/                User, Category, Product, DeliveryLocation, Order, Payment
│   ├── seed/seed.js           <- one-time script that loads demo data into MongoDB
│   ├── data/db.json           <- demo data used only by seed.js (not read at runtime anymore)
│   ├── middleware/auth.js     <- JWT auth (loads the user from MongoDB)
│   ├── middleware/upload.js   <- multer config for admin image uploads
│   ├── uploads/                admin-uploaded product/category images (served at /uploads)
│   ├── routes/                 auth, categories, products, delivery, orders, payment, uploads
│   └── server.js
├── frontend/                Angular 17 application
└── database/
    └── schema.sql            Optional relational (MySQL/Postgres) reference schema
```

## Backend setup
```bash
cd backend
npm install
cp .env.example .env      # then edit MONGODB_URI and JWT_SECRET
npm run seed               # loads demo categories/products/admin into MongoDB (run once)
npm run dev                 # or: npm start   → API runs at http://localhost:5000
```
See the full step-by-step MongoDB installation and setup guide below if you
haven't installed MongoDB or created a database yet.

Demo admin login (seeded by `npm run seed`):
- email: admin@lakshmimillets.com
- password: Admin@123

### Key API endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login, returns JWT |
| GET  | /api/auth/me | Current user (auth required) |
| GET  | /api/categories | List categories (Shop by Category) |
| GET  | /api/categories/:slug | Category detail |
| **POST** | **/api/categories** | **Create a category (admin)** |
| **PUT**  | **/api/categories/:id** | **Update a category — name/description/icon/image (admin)** |
| **DELETE** | **/api/categories/:id** | **Delete a category (admin, blocked if products still use it)** |
| GET  | /api/products?category=&popular=&search=&inStock= | List/filter products |
| GET  | /api/products/:slug | Product detail |
| **POST** | **/api/products** | **Create a product (admin)** |
| **PUT**  | **/api/products/:id** | **Update a product — price, mrp, image, category, stock, etc. (admin)** |
| **PATCH** | **/api/products/:id/stock** | **Quick stock update: `{ stock: 25 }` or `{ delta: -3 }` (admin)** |
| **DELETE** | **/api/products/:id** | **Delete a product (admin)** |
| **POST** | **/api/uploads/image?type=products\|categories** | **Upload an image file, returns a URL to store in `image` (admin)** |
| GET  | /api/delivery-locations | The 4 supported delivery cities & charges |
| POST | /api/payment/create | Create a payment intent (simulated gateway) |
| POST | /api/payment/verify | Verify/confirm payment |
| POST | /api/orders | Place an order (auth required, rejects if any item is out of stock) |
| GET  | /api/orders/my | Logged-in user's order history |

See **"Managing your data — admin APIs"** below for request/response examples.

## Frontend setup
```bash
cd frontend
npm install
ng serve
```
Open http://localhost:4200. The app calls the API at http://localhost:5000/api
(change this in `frontend/src/app/core/services/config.ts` for other environments).

## Managing your data — admin APIs

Every admin endpoint below needs an **admin JWT**. Get one by logging in as
the seeded admin account, then send it as `Authorization: Bearer <token>` on
every admin request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lakshmimillets.com","password":"Admin@123"}'
# -> { "token": "eyJ...", "user": { "role": "admin", ... } }
```
Any change you make through these APIs shows up on the storefront **immediately** —
the Angular app always fetches fresh data from `/api/products` and
`/api/categories`, nothing is hardcoded.

### Update a price, description, or any product field
```bash
curl -X PUT http://localhost:5000/api/products/<productId> \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"price": 149, "mrp": 199, "description": "New improved recipe"}'
```

### Create a new product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{
        "name": "Pearl Millet Cookies",
        "categorySlug": "biscuits",
        "price": 99, "mrp": 129,
        "weight": "200g",
        "stock": 50,
        "description": "Crunchy pearl millet cookies"
      }'
```
`categorySlug` (e.g. `"biscuits"`) or `categoryId` both work — whichever is
easier to grab from `/api/categories`.

### Create / rename a category
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"name": "Snacks", "description": "Healthy millet snacks", "icon": "🍪"}'
```

### Upload a new product/category image
```bash
curl -X POST "http://localhost:5000/api/uploads/image?type=products" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "image=@/path/to/photo.jpg"
# -> { "url": "/uploads/products/1699999999-photo.jpg", "filename": "..." }
```
Take the returned `url` and save it into the product's `image` field (via the
`PUT /api/products/:id` call above). Uploaded files are served by the backend
itself at `http://localhost:5000/uploads/...`, and the Angular app already
knows how to load images from either place — see **Images** below.

### Update stock (and trigger "Out of Stock")
Two ways to change stock on `PATCH /api/products/:id/stock`:
```bash
# Set an exact stock count
curl -X PATCH http://localhost:5000/api/products/<productId>/stock \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"stock": 0}'          # -> product becomes "Out of Stock" on the site

# Or just adjust up/down (e.g. after a manual/offline sale)
curl -X PATCH http://localhost:5000/api/products/<productId>/stock \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"delta": -5}'
```
The response tells you the new state: `{ "id", "name", "stock", "inStock" }`.

### Delete a product or category
```bash
curl -X DELETE http://localhost:5000/api/products/<productId> \
  -H "Authorization: Bearer <TOKEN>"
```
Deleting a category is blocked (`409 Conflict`) while any product still
points at it, so the storefront never ends up with a dangling category
reference — move or delete those products first.

## Stock & "Out of Stock" behavior
- **Automatic on checkout**: every order placed through `POST /api/orders`
  re-checks stock server-side and subtracts the quantity ordered. If stock is
  `0`, or lower than the requested quantity, the order is rejected with a
  clear `409` message (e.g. `"Only 2 unit(s) of Multi Millet Flour left in
  stock"`) and nothing is deducted — the Angular checkout page already shows
  this message to the shopper.
- **Manual, via the API**: use `PATCH /api/products/:id/stock` any time you
  restock or want to force an item to show as sold out (`{"stock": 0}`).
- **On the storefront** (already wired up, no extra setup needed):
  - Home page & product grid: a red **"Out of Stock"** badge appears on the
    product image, the "Add to Cart" button is disabled and reads
    "Out of Stock", and the image is dimmed.
  - When `stock` is low (1–5 left) an **"Only N left"** badge shows instead,
    so shoppers see urgency before it actually runs out.
  - Product detail page: the same "In Stock" / "Only N left" / "Out of
    Stock" badge next to the price, quantity selector capped at the
    available stock, and both "Add to Cart" and "Buy Now" disabled when
    stock is `0`.
  - `GET /api/products?inStock=true` — filter to only in-stock items if you
    build a dedicated "in stock only" view later.

## Database — MongoDB
Six collections, one per Mongoose model in `backend/models/`: `users`,
`categories`, `products`, `deliverylocations`, `orders`, `payments`. Every
route talks to MongoDB only through these models — see the full setup guide
below for installation, connecting, and viewing your data.

`database/schema.sql` is also included as an equivalent relational schema,
in case you'd rather move to MySQL/PostgreSQL instead — its tables mirror
the MongoDB collections 1:1 (users, addresses, categories, products,
delivery_locations, orders, order_items, payments).

## Delivery locations
Seeded by `npm run seed` (source data in `backend/data/db.json`):
- Hyderabad, Telangana — ₹40 delivery, 1-2 days
- Bangalore, Karnataka — ₹60 delivery, 2-3 days
- Chennai, Tamil Nadu — ₹60 delivery, 2-3 days
- Vijayawada, Andhra Pradesh — ₹50 delivery, 2-4 days
All are free above ₹499 of items. Edit these in MongoDB directly (e.g. via
MongoDB Compass) or update `backend/data/db.json` and re-run `npm run seed`.

## Payment
`backend/routes/payment.js` contains a **simulated** payment gateway
(create → verify) so the whole checkout flow works end-to-end out of the
box. For production, swap the logic inside `/api/payment/create` and
`/api/payment/verify` for a real gateway's server SDK (Razorpay, Stripe,
PayU, etc.) — the Angular checkout component already calls these two
endpoints in sequence before placing the order.

## Images
Two ways an image can be shown, and the Angular app (via a shared `imageUrl`
pipe) automatically picks the right one — you don't need to change any code
either way:
1. **Seeded/local images** — a bare filename like `"multi-millet-flour.jpg"`
   is loaded from `frontend/src/assets/images/products/` (or `categories/`,
   `recipes/`). This is how the original demo data works.
2. **Admin-uploaded images** — after calling `POST /api/uploads/image`, the
   returned value (e.g. `"/uploads/products/169...jpg"`) is loaded straight
   from the backend at `http://localhost:5000/uploads/...`. Save that string
   into the product/category's `image` field and it displays automatically
   everywhere (home page, product grid, product detail, cart).

Drop your own local images into `frontend/src/assets/images/` using the
filenames listed in `frontend/src/assets/images/README.md` (categories/,
products/, recipes/) if you'd rather not use the upload API.
Every `<img>` has an `onerror` fallback to `placeholder.jpg` so the site
works immediately even before you add real photos.

## Notes
- Passwords are hashed with bcrypt; auth uses JWT (7 day expiry by default).
- Order totals (item prices + delivery charge) are always recalculated
  server-side from MongoDB — the frontend numbers are for display only.
- `npm install` requires internet access in your own environment (not run
  here) — the package.json files list all required dependencies with
  compatible versions.
