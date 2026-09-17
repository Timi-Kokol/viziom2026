import { PROJECTS } from '@/content/projects';
import { SITE } from '@/lib/seo';

const SeoContent = () => (
	<section className="seo-content" aria-label={`${SITE.name} — ${SITE.tagline}`}>
		<h1>
			{SITE.name} — {SITE.tagline}
		</h1>
		<p>{SITE.kicker}</p>
		<p>{SITE.description}</p>

		<h2>About</h2>
		<p>
			{SITE.founder} builds custom web experiences for people that value quality. You work with him, not a
			chain of accounts — Next.js when it has to feel like a product, WordPress when you need to own the
			content, Three.js when a flat page is not the point.
		</p>

		<h2>Services</h2>
		<ul>
			<li>Custom Next.js and React Three Fiber sites — product showcases, campaign sites, interactive storytelling.</li>
			<li>Custom WordPress themes with ACF, GSAP, and Lenis — not a plugin pile.</li>
			<li>WebGL scenes that stay smooth, with motion that does not hitch.</li>
		</ul>

		<h2>Selected work</h2>
		<ul>
			{PROJECTS.map((project) => (
				<li key={project.slug}>
					<a href={project.url} rel="noopener noreferrer">
						{project.title}
					</a>
				</li>
			))}
		</ul>

		<h2>Contact</h2>
		<address>
			{SITE.legalName}
			<br />
			{SITE.address.street}
			<br />
			{SITE.address.postalCode} {SITE.address.locality}
			<br />
			{SITE.address.countryName}
			<br />
			<a href={`mailto:${SITE.email}`}>{SITE.email}</a>
			<br />
			<a href={`tel:${SITE.phone}`}>{SITE.phoneDisplay}</a>
		</address>
	</section>
);

SeoContent.displayName = 'SeoContent';
export default SeoContent;
