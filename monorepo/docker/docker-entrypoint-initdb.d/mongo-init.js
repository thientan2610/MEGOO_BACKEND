//! THIS ONLY FOR LOCAL DEV

// auth
// db = db.getSiblingDB(process.env.DB_AUTH_DATABASE);
// db.createUser({
//   user: process.env.DB_AUTH_USER,
//   pwd: process.env.DB_AUTH_PASSWORD,
//   roles: [{ role: 'readWrite', db: process.env.DB_AUTH_DATABASE }],
// });
// db.createCollection('init-db');

// users
db = db.getSiblingDB(process.env.DB_USERS_DATABASE);
db.createUser({
  user: process.env.DB_USERS_USER,
  pwd: process.env.DB_USERS_PASSWORD,
  roles: [{ role: 'readWrite', db: process.env.DB_USERS_DATABASE }],
});
db.createCollection('init-db');

// DB_PKG_MGMT_DATABASE
db = db.getSiblingDB(process.env.DB_PKG_MGMT_DATABASE);
db.createUser({
  user: process.env.DB_PKG_MGMT_USER,
  pwd: process.env.DB_PKG_MGMT_PASSWORD,
  roles: [{ role: 'readWrite', db: process.env.DB_PKG_MGMT_DATABASE }],
});
db.createCollection('init-db');

// DB_COMM_DATABASE
db = db.getSiblingDB(process.env.DB_COMM_DATABASE);
db.createUser({
  user: process.env.DB_COMM_USER,
  pwd: process.env.DB_COMM_PASSWORD,
  roles: [{ role: 'readWrite', db: process.env.DB_COMM_DATABASE }],
});
db.createCollection('init-db');

// DB_TXN_DATABASE
db = db.getSiblingDB(process.env.DB_TXN_DATABASE);
db.createUser({
  user: process.env.DB_TXN_USER,
  pwd: process.env.DB_TXN_PASSWORD,
  roles: [{ role: 'readWrite', db: process.env.DB_TXN_DATABASE }],
});
db.createCollection('init-db');


