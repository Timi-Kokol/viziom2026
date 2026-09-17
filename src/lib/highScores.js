import { supabase } from "./supabase";

const TABLE = "high_scores";

/**
 * Fetch top 10 high scores (score desc, created_at asc for ties).
 * @returns {Promise<Array<{ id: string, player_name: string, score: number, created_at: string }>>}
 */
export async function fetchTop10() {
	const result = await fetchTop10WithStatus();
	return result.error ? [] : result.data ?? [];
}

/**
 * Fetch top 10 with status; use when you need to know if the DB connection succeeded.
 * @returns {Promise<{ data: Array<...>, error?: { message: string } }>}
 */
export async function fetchTop10WithStatus() {
	if (!supabase) return { data: [], error: { message: "Supabase not configured" } };
	const { data, error } = await supabase
		.from(TABLE)
		.select("id, player_name, score, created_at")
		.order("score", { ascending: false })
		.order("created_at", { ascending: true })
		.limit(10);
	if (error) {
		return { data: [], error };
	}
	return { data: data ?? [] };
}

const MAX_NAME_LENGTH = 12;
function sanitizePlayerName(name) {
	const s = String(name).trim().slice(0, MAX_NAME_LENGTH).replace(/[^a-zA-Z0-9 \-']/g, "");
	return s || "Anonymous";
}

/**
 * Insert a new high score. DB trigger keeps only top 10.
 * @param {string} playerName - Sanitized to 12 chars.
 * @param {number} score
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function insertScore(playerName, score) {
	if (!supabase) return { ok: false, error: "Supabase not configured" };
	const { error } = await supabase.from(TABLE).insert({
		player_name: sanitizePlayerName(playerName),
		score: Number(score) || 0,
	});
	if (error) {
		return { ok: false, error: error.message };
	}
	return { ok: true };
}
