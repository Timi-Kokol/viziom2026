import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
	CONTACT_MAX_FILE_BYTES,
	CONTACT_MAX_FILES,
	CONTACT_TYPE_LABELS,
	isAllowedAttachment,
	validateContactForm,
} from '@/lib/contactForm';

export const runtime = 'nodejs';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

const trim = (value: FormDataEntryValue | null, max: number) =>
	typeof value === 'string' ? value.trim().slice(0, max) : '';

const clientIp = (request: Request) => {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
	return request.headers.get('x-real-ip') || 'unknown';
};

const tooMany = (ip: string) => {
	const now = Date.now();
	const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
	if (recent.length >= MAX_PER_WINDOW) {
		hits.set(ip, recent);
		return true;
	}
	recent.push(now);
	hits.set(ip, recent);
	return false;
};

export async function POST(request: Request) {
	if (tooMany(clientIp(request))) {
		return NextResponse.json({ error: 'Too many attempts. Try again in a bit.' }, { status: 429 });
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
	}

	if (trim(formData.get('website'), 200)) {
		return NextResponse.json({ ok: true });
	}

	const name = trim(formData.get('name'), 120);
	const email = trim(formData.get('email'), 254);
	const type = trim(formData.get('type'), 32);
	const subject = trim(formData.get('subject'), 200);
	const message = trim(formData.get('message'), 5000);

	const files = formData
		.getAll('attachments')
		.filter((entry): entry is File => entry instanceof File && entry.size > 0);

	const fieldErrors = validateContactForm({ name, email, type, subject, message }, files);
	if (Object.keys(fieldErrors).length) {
		const firstError = Object.values(fieldErrors)[0] ?? 'Check the form.';
		return NextResponse.json({ error: firstError, fieldErrors }, { status: 400 });
	}

	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		return NextResponse.json({ error: 'Mail is not configured.' }, { status: 500 });
	}

	const to = process.env.CONTACT_TO_EMAIL || 'info@viziom.si';
	const from = process.env.CONTACT_FROM_EMAIL || 'Viziom <beth.t@example.com>';
	const typeLabel = CONTACT_TYPE_LABELS[type];

	const attachments = await Promise.all(
		files.slice(0, CONTACT_MAX_FILES).map(async (file) => {
			if (file.size > CONTACT_MAX_FILE_BYTES || !isAllowedAttachment(file)) {
				throw new Error('Invalid attachment.');
			}
			const buffer = Buffer.from(await file.arrayBuffer());
			return {
				filename: file.name.slice(0, 180),
				content: buffer,
			};
		})
	);

	const resend = new Resend(apiKey);
	const { error } = await resend.emails.send({
		from,
		to,
		replyTo: email,
		subject: `[Viziom] ${subject}`,
		text: [
			`Name: ${name}`,
			`Email: ${email}`,
			`Type: ${typeLabel}`,
			`Subject: ${subject}`,
			attachments.length ? `Attachments: ${attachments.map((file) => file.filename).join(', ')}` : '',
			'',
			message,
		]
			.filter(Boolean)
			.join('\n'),
		...(attachments.length ? { attachments } : {}),
	});

	if (error) {
		return NextResponse.json({ error: 'Did not send. Try again, or mail info@viziom.si.' }, { status: 502 });
	}

	return NextResponse.json({ ok: true });
}
