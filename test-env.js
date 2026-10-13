const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
console.log("SERVICE KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "EXISTS" : "NOT FOUND");
