const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const query = (text, params) => pool.query(text, params);

// --- User & Coin Management ---
const findUserById = (id) => query('SELECT * FROM users WHERE id = $1', [id]);
const createUser = (id, firstName, username, referrerId = null) => query('INSERT INTO users (id, first_name, username, referrer_id) VALUES ($1, $2, $3, $4) RETURNING *', [id, firstName, username, referrerId]);
const updateUserCoins = (id, amount) => query('UPDATE users SET coins = coins + $1 WHERE id = $2 RETURNING coins', [id, amount]);
const getUserCoins = async (id) => (await query('SELECT coins FROM users WHERE id = $1', [id])).rows[0]?.coins || 0;

// --- Profile Management ---
const findProfileById = (userId) => query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
const createProfile = (userId) => query('INSERT INTO profiles (user_id) VALUES ($1)', [userId]);
const updateProfile = (userId, field, value) => query(`UPDATE profiles SET ${field} = $1 WHERE user_id = $2`, [value, userId]);

// --- Interaction Management ---
const blockUser = (blockerId, blockedId) => query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [blockerId, blockedId]);
const createChatRequest = (requesterId, requestedId) => query('INSERT INTO chat_requests (requester_id, requested_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [requesterId, requestedId]);

// --- Partner Search ---
const findPartners = async (userId, filters) => {
    let sql = `
        SELECT p.*, u.first_name FROM profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.profile_status = 'ACTIVE'
        AND p.user_id != $1
        AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = p.user_id) OR (blocker_id = p.user_id AND blocked_id = $1))
        AND NOT EXISTS (SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = p.user_id)
    `;
    const params = [userId];
    let paramIndex = 2;

    if (filters.gender) { sql += ` AND p.gender = $${paramIndex++}`; params.push(filters.gender); }
    if (filters.city) { sql += ` AND p.city ILIKE $${paramIndex++}`; params.push(`%${filters.city}%`); }
    if (filters.orientation) { sql += ` AND p.orientation = $${paramIndex++}`; params.push(filters.orientation); }
    if (filters.fantasy) { sql += ` AND p.fantasy = $${paramIndex++}`; params.push(filters.fantasy); }
    if (filters.minAge) { sql += ` AND p.age >= $${paramIndex++}`; params.push(filters.minAge); }
    if (filters.maxAge) { sql += ` AND p.age <= $${paramIndex++}`; params.push(filters.maxAge); }

    sql += ' ORDER BY random() LIMIT 20';
    return query(sql, params);
};


module.exports = {
    findUserById, createUser, updateUserCoins, getUserCoins,
    findProfileById, createProfile, updateProfile,
    blockUser, createChatRequest, findPartners
};
