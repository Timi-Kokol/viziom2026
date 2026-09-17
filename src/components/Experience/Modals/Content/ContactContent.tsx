'use client';



import React, { useEffect, useRef, useState } from 'react';

import PixelateHero from './PixelateHero';

import { useModalContentReveal } from './useModalContentReveal';

import { getSoundManager, SOUND_IDS } from '../../../../audio';

import { useHaptics } from '@/haptics';

import {

	CONTACT_ACCEPT,

	CONTACT_MAX_FILES,

	formatFileSize,

	validateContactAttachments,

	validateContactForm,

	type ContactField,

	type ContactFieldErrors,

} from '@/lib/contactForm';

import {

	PopupContentWrapper,

	Hero,

	HeroCopy,

	HeroTitle,

	HeroKicker,

	Details,

	DetailsCol,

	Logo,

	Address,

	ContactLinks,

	ContactLink,

	FormSection,

	FormIntro,

	Form,

	FormRow,

	FieldWrap,

	Field,

	SelectField,

	SelectTrigger,

	SelectMenu,

	SelectOption,

	AttachmentField,

	OptionalTag,

	AttachmentHint,

	AttachmentActions,

	AttachmentTrigger,

	FileList,

	FileItem,

	FileMeta,

	FileName,

	FileSize,

	FileRemove,

	Submit,

	Honeypot,

	FormStatus,

} from './ContactContent.styles';



const TYPE_OPTIONS = [

	{ value: 'website', label: 'Website' },

	{ value: 'webapp', label: 'Web application' },

	{ value: '3d', label: '3D / interactive' },

	{ value: 'other', label: 'Other' },

] as const;



const MailIcon = () => (

	<svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">

		<path

			d="M1 2.5L9 8.5L17 2.5M1 12.5H17V2.5H1V12.5Z"

			stroke="currentColor"

			strokeWidth="1.5"

			strokeLinejoin="round"

		/>

	</svg>

);



const PhoneIcon = () => (

	<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">

		<path

			d="M4.5 2H7L8.5 6.5L6.5 7.5C7.4 9.6 8.9 11.1 11 12L12 10L16.5 11.5V14C16.5 14.4 16.2 14.7 15.8 14.7C8.6 15.2 2.8 9.4 3.3 2.2C3.3 1.8 3.6 1.5 4 1.5L4.5 2Z"

			stroke="currentColor"

			strokeWidth="1.5"

			strokeLinejoin="round"

		/>

	</svg>

);



type TypeSelectProps = {

	name: string;

	disabled?: boolean;

	sending?: boolean;

	error?: string;

	onChange?: () => void;

};



const TypeSelect: React.FC<TypeSelectProps> = ({ name, disabled, sending, error, onChange }) => {

	const wrapRef = useRef<HTMLDivElement>(null);

	const [open, setOpen] = useState(false);

	const [value, setValue] = useState('');

	const selected = TYPE_OPTIONS.find((opt) => opt.value === value);



	useEffect(() => {

		if (!open) return;

		const close = (event: PointerEvent) => {

			if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);

		};

		document.addEventListener('pointerdown', close);

		return () => document.removeEventListener('pointerdown', close);

	}, [open]);



	return (

		<FieldWrap>

			<SelectField

				ref={wrapRef}

				data-open={open ? 'true' : undefined}

				data-invalid={error ? 'true' : undefined}

				data-sending={sending ? 'true' : undefined}

			>

				<span data-required="true">Type</span>

				<SelectTrigger

					type="button"

					data-open={open ? 'true' : undefined}

					data-placeholder={value ? undefined : 'true'}

					aria-expanded={open}

					aria-haspopup="listbox"

					aria-invalid={error ? true : undefined}

					disabled={disabled}

					onClick={() => {

						if (disabled) return;

						setOpen((current) => !current);

					}}

				>

					{selected?.label ?? 'Select type'}

				</SelectTrigger>

				<input type="hidden" name={name} value={value} />

				{open && (

					<SelectMenu role="listbox">

						{TYPE_OPTIONS.map((opt) => (

							<SelectOption key={opt.value} data-active={value === opt.value ? 'true' : undefined}>

								<button

									type="button"

									role="option"

									aria-selected={value === opt.value}

									onClick={() => {

										setValue(opt.value);

										setOpen(false);

										onChange?.();

									}}

								>

									{opt.label}

								</button>

							</SelectOption>

						))}

					</SelectMenu>

				)}

			</SelectField>

		</FieldWrap>

	);

};



const ContactContent: React.FC = () => {

	const rootRef = useRef<HTMLDivElement>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const { triggerHover, triggerPress } = useHaptics();

	const [formKey, setFormKey] = useState(0);

	const [attachments, setAttachments] = useState<File[]>([]);

	const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});

	const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

	useModalContentReveal(rootRef);



	const disabled = status === 'sending';



	const clearFieldError = (field: ContactField) => {

		setFieldErrors((current) => {

			if (!current[field]) return current;

			const next = { ...current };

			delete next[field];

			return next;

		});

	};



	const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {

		const picked = Array.from(event.target.files ?? []);

		event.target.value = '';



		if (!picked.length) return;



		const next = [...attachments, ...picked].slice(0, CONTACT_MAX_FILES);

		const validation = validateContactAttachments(next);



		if (validation.attachments) {

			setFieldErrors((current) => ({ ...current, attachments: validation.attachments }));

			return;

		}



		clearFieldError('attachments');

		setAttachments(next);

	};



	const removeAttachment = (index: number) => {

		setAttachments((current) => current.filter((_, i) => i !== index));

		clearFieldError('attachments');

	};



	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {

		event.preventDefault();

		if (status === 'sending' || status === 'sent') return;



		const form = event.currentTarget;

		const data = new FormData(form);

		const values = {

			name: String(data.get('name') ?? ''),

			email: String(data.get('email') ?? ''),

			type: String(data.get('type') ?? ''),

			subject: String(data.get('subject') ?? ''),

			message: String(data.get('message') ?? ''),

		};



		const nextErrors = validateContactForm(values, attachments);

		if (Object.keys(nextErrors).length) {

			setFieldErrors(nextErrors);

			setStatus('idle');

			const firstKey = (Object.keys(nextErrors)[0] ?? null) as ContactField | null;

			if (firstKey) {

				const target =

					firstKey === 'attachments'

						? form.querySelector('[data-field="attachments"]')

						: form.querySelector(`[name="${firstKey}"]`);

				target?.scrollIntoView({ behavior: 'smooth', block: 'center' });

			}

			return;

		}



		const payload = new FormData();

		payload.set('name', values.name.trim());

		payload.set('email', values.email.trim());

		payload.set('type', values.type.trim());

		payload.set('subject', values.subject.trim());

		payload.set('message', values.message.trim());

		payload.set('website', String(data.get('website') ?? ''));

		attachments.forEach((file) => payload.append('attachments', file));



		setFieldErrors({});

		setStatus('sending');

		try {

			const response = await fetch('/api/contact', {

				method: 'POST',

				body: payload,

			});

			const result = (await response.json().catch(() => ({}))) as {

				fieldErrors?: ContactFieldErrors;

			};

			if (!response.ok) {

				setStatus('idle');

				if (result.fieldErrors) setFieldErrors(result.fieldErrors);

				return;

			}

			setStatus('sent');

			form.reset();

			setAttachments([]);

			setFormKey((key) => key + 1);

		} catch {

			setStatus('idle');

		}

	};



	const handleSubmitHover = () => {

		if (status === 'sending' || status === 'sent') return;

		getSoundManager()?.play(SOUND_IDS.BUTTON_HOVER);

		triggerHover();

	};



	const handleSubmitPress = () => {

		if (status === 'sending' || status === 'sent') return;

		getSoundManager()?.play(SOUND_IDS.BUTTON_PRESS);

		triggerPress();

	};



	return (

		<PopupContentWrapper ref={rootRef}>

			<Hero>

				<PixelateHero />

				<HeroCopy>

					<HeroTitle data-reveal="hero">

						Let&apos;s build

						<br />

						something

					</HeroTitle>

					<HeroKicker data-reveal="hero">If the brief is real, so am I.</HeroKicker>

				</HeroCopy>

			</Hero>



			<Details>

				<DetailsCol data-reveal>

					<Logo src="/logo.svg" alt="VIZIOM" />

					<Address>

						{`VIZIOM, Timi KOKOL, s.p.,\nŽoherjeva ulica 31,\n2000 Maribor,\nSlovenia`}

					</Address>

				</DetailsCol>

				<DetailsCol data-reveal>

					<ContactLinks>

						<ContactLink href="mailto:info@viziom.si" data-underline="true">

							<MailIcon />

							info@viziom.si

						</ContactLink>

						<ContactLink href="tel:+38640908585">

							<PhoneIcon />

							+386 40 908 585

						</ContactLink>

					</ContactLinks>

				</DetailsCol>

			</Details>



			<FormSection>

				<FormIntro data-reveal>

					<p>Tell me what you are trying to ship. I will reply with a clear yes, no, or not yet.</p>

					<p>I usually get back within 24–48 hours.</p>

				</FormIntro>



				<Form key={formKey} data-reveal onSubmit={handleSubmit} noValidate>

					<Honeypot aria-hidden="true">

						<label>

							Website

							<input type="text" name="website" tabIndex={-1} autoComplete="off" />

						</label>

					</Honeypot>

					<FormRow>

						<FieldWrap>

							<Field
								data-invalid={fieldErrors.name ? 'true' : undefined}
								data-sending={disabled ? 'true' : undefined}
							>

								<span data-required="true">Full name</span>

								<input

									type="text"

									name="name"

									autoComplete="name"

									disabled={disabled}

									aria-invalid={fieldErrors.name ? true : undefined}

									onChange={() => clearFieldError('name')}

								/>

							</Field>

						</FieldWrap>

						<FieldWrap>

							<Field
								data-invalid={fieldErrors.email ? 'true' : undefined}
								data-sending={disabled ? 'true' : undefined}
							>

								<span data-required="true">Email</span>

								<input

									type="email"

									name="email"

									autoComplete="email"

									disabled={disabled}

									aria-invalid={fieldErrors.email ? true : undefined}

									onChange={() => clearFieldError('email')}

								/>

							</Field>

						</FieldWrap>

					</FormRow>

					<FormRow>

						<TypeSelect

							name="type"

							disabled={disabled}

							sending={disabled}

							error={fieldErrors.type}

							onChange={() => clearFieldError('type')}

						/>

						<FieldWrap>

							<Field
								data-invalid={fieldErrors.subject ? 'true' : undefined}
								data-sending={disabled ? 'true' : undefined}
							>

								<span data-required="true">Subject</span>

								<input

									type="text"

									name="subject"

									disabled={disabled}

									aria-invalid={fieldErrors.subject ? true : undefined}

									onChange={() => clearFieldError('subject')}

								/>

							</Field>

						</FieldWrap>

					</FormRow>

					<FieldWrap>

						<Field
							data-invalid={fieldErrors.message ? 'true' : undefined}
							data-sending={disabled ? 'true' : undefined}
						>

							<span data-required="true">Message</span>

							<textarea

								name="message"

								disabled={disabled}

								aria-invalid={fieldErrors.message ? true : undefined}

								onChange={() => clearFieldError('message')}

							/>

						</Field>

					</FieldWrap>



					<FieldWrap>

						<AttachmentField

							data-field="attachments"

							data-invalid={fieldErrors.attachments ? 'true' : undefined}

							data-sending={disabled ? 'true' : undefined}

						>

							<span>

								Attachments

								<OptionalTag>optional</OptionalTag>

							</span>

							<AttachmentHint>

								Attach a brief or mockup. PDF, images, or ZIP. Up to {CONTACT_MAX_FILES} files,{' '}

								{formatFileSize(5 * 1024 * 1024)} each.

							</AttachmentHint>

							<AttachmentActions>

								<input

									ref={fileInputRef}

									type="file"

									name="attachments"

									accept={CONTACT_ACCEPT}

									multiple

									hidden

									disabled={disabled || attachments.length >= CONTACT_MAX_FILES}

									onChange={handleFilesSelected}

								/>

								<AttachmentTrigger

									type="button"

									disabled={disabled || attachments.length >= CONTACT_MAX_FILES}

									onClick={() => fileInputRef.current?.click()}

								>

									{attachments.length >= CONTACT_MAX_FILES ? 'File limit reached' : 'Choose files'}

								</AttachmentTrigger>

							</AttachmentActions>

							{attachments.length > 0 && (

								<FileList>

									{attachments.map((file, index) => (

										<FileItem key={`${file.name}-${file.size}-${index}`}>

											<FileMeta>

												<FileName title={file.name}>{file.name}</FileName>

												<FileSize>{formatFileSize(file.size)}</FileSize>

											</FileMeta>

											<FileRemove

												type="button"

												disabled={disabled}

												onClick={() => removeAttachment(index)}

											>

												Remove

											</FileRemove>

										</FileItem>

									))}

								</FileList>

							)}

						</AttachmentField>

					</FieldWrap>



					<Submit

						type="submit"

						disabled={status === 'sending' || status === 'sent'}

						data-sending={status === 'sending' ? 'true' : undefined}

						onMouseEnter={handleSubmitHover}

						onClick={handleSubmitPress}

					>

						<span>
							<span>{status === 'sending' ? 'Sending' : status === 'sent' ? 'Sent' : 'Send'}</span>
						</span>
						<i className="send-bar" aria-hidden />

					</Submit>

					{status === 'sent' && (

						<FormStatus data-tone="ok">Got it. I&apos;ll get back within 24–48 hours.</FormStatus>

					)}

				</Form>

			</FormSection>

		</PopupContentWrapper>

	);

};



ContactContent.displayName = 'ContactContent';

export default ContactContent;


