const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:sovr@localhost:5432/ORACLE-LEDGER'
});

(async () => {
  try {
    const res = await pool.query("SELECT id, email, role FROM users WHERE email = 'ADMIN@SOVR.CREDIT'");
    if (res.rows.length > 0) {
      console.log(JSON.stringify(res.rows[0]));
    } else {
      console.error('User not found');
      process.exit(1);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    pool.end();
  }
})();
