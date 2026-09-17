export const CONTACT_TYPE_LABELS: Record<string, string> = {
	website: 'Website',
	webapp: 'Web application',
	'3d': '3D / interactive',
	other: 'Other',
};

export const CONTACT_MAX_FILES = 2;
export const CONTACT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const CONTACT_ACCEPT =
	'.pdf,.png,.jpg,.jpeg,.webp,.gif,.zip,application/pdf,image/png,image/jpeg,image/webp,image/gif,application/zip';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.zip']);

const ALLOWED_MIME = new Set([
	'application/pdf',
	'image/png',
	'image/jpeg',
	'image/webp',
	'image/gif',
	'application/zip',
	'application/x-zip-compressed',
]);

export type ContactField = 'name' | 'email' | 'type' | 'subject' | 'message' | 'attachments';

export type ContactFieldErrors = Partial<Record<ContactField, string>>;

export type ContactFormValues = {
	name: string;
	email: string;
	type: string;
	subject: string;
	message: string;
};

const extensionOf = (name: string) => {
	const dot = name.lastIndexOf('.');
	return dot >= 0 ? name.slice(dot).toLowerCase() : '';
};

export const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const isAllowedAttachment = (file: { name: string; type: string }) => {
	const ext = extensionOf(file.name);
	if (ALLOWED_EXTENSIONS.has(ext)) return true;
	return ALLOWED_MIME.has(file.type);
};

export const validateContactFields = (values: ContactFormValues): ContactFieldErrors => {
	const errors: ContactFieldErrors = {};

	if (!values.name.trim()) {
		errors.name = 'Enter your name.';
	} else if (values.name.trim().length > 120) {
		errors.name = 'Name is too long.';
	}

	if (!values.email.trim()) {
		errors.email = 'Enter your email.';
	} else if (!EMAIL_RE.test(values.email.trim())) {
		errors.email = 'Enter a valid email address.';
	}

	if (!values.type.trim()) {
		errors.type = 'Pick a project type.';
	} else if (!CONTACT_TYPE_LABELS[values.type]) {
		errors.type = 'Pick a valid project type.';
	}

	if (!values.subject.trim()) {
		errors.subject = 'Add a subject.';
	} else if (values.subject.trim().length > 200) {
		errors.subject = 'Subject is too long.';
	}

	if (!values.message.trim()) {
		errors.message = 'Tell me what you need.';
	} else if (values.message.trim().length > 5000) {
		errors.message = 'Message is too long.';
	}

	return errors;
};

export const validateContactAttachments = (files: File[]): ContactFieldErrors => {
	if (!files.length) return {};

	const errors: ContactFieldErrors = {};

	if (files.length > CONTACT_MAX_FILES) {
		errors.attachments = `You can attach up to ${CONTACT_MAX_FILES} files.`;
		return errors;
	}

	for (const file of files) {
		if (file.size > CONTACT_MAX_FILE_BYTES) {
			errors.attachments = `"${file.name}" is too large. Max ${formatFileSize(CONTACT_MAX_FILE_BYTES)} per file.`;
			return errors;
		}
		if (!isAllowedAttachment(file)) {
			errors.attachments = `"${file.name}" is not allowed. Use PDF, images, or ZIP.`;
			return errors;
		}
	}

	return errors;
};

export const validateContactForm = (
	values: ContactFormValues,
	files: File[] = []
): ContactFieldErrors => ({
	...validateContactFields(values),
	...validateContactAttachments(files),
});
