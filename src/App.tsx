import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type EstimateFormData = {
  name: string;
  phone: string;
  email: string;
  projectType: string;
  timeline: string;
  details: string;
  company: string;
};

type SubmitStatus = {
  loading: boolean;
  message: string;
  error: boolean;
};

type ProjectImage = {
  src: string;
  alt: string;
};

type Project = {
  title: string;
  location: string;
  images: ProjectImage[];
  description: string;
};

type LightboxState = {
  projectIndex: number;
  imageIndex: number;
} | null;

type EstimateApiResponse = {
  ok: boolean;
  message: string;
};

const featuredProjects: Project[] = [
  {
    title: "Cedar Shingle Facade Refresh",
    location: "Chatham, MA",
    images: [
      {
        src: "/projects/cedar-facade.svg",
        alt: "Cedar shingle facade and white trim exterior renovation",
      },
      {
        src: "/projects/cedar-facade-2.svg",
        alt: "Cape Cod home with cedar siding and refreshed trim details",
      },
      {
        src: "/projects/cedar-facade-3.svg",
        alt: "Exterior carpentry detail on coastal style cedar facade",
      },
    ],
    description:
      "Full exterior trim restoration with weather-resistant cedar, custom window boxes, and seaside-grade finish work.",
  },
  {
    title: "Built-In Mudroom and Storage Wall",
    location: "Barnstable, MA",
    images: [
      {
        src: "/projects/mudroom-builtin.svg",
        alt: "Custom mudroom built-ins with bench and storage cabinetry",
      },
      {
        src: "/projects/mudroom-builtin-2.svg",
        alt: "Mudroom storage wall with hooks and overhead cabinets",
      },
      {
        src: "/projects/mudroom-builtin-3.svg",
        alt: "Built-in bench and cabinetry in a modern coastal mudroom",
      },
    ],
    description:
      "Space-saving built-ins with beadboard detailing, bench seating, and hidden utility storage for active families.",
  },
  {
    title: "Nantucket-Inspired Porch Rebuild",
    location: "Yarmouth Port, MA",
    images: [
      {
        src: "/projects/porch-rebuild.svg",
        alt: "Coastal style porch with railings and columns",
      },
      {
        src: "/projects/porch-rebuild-2.svg",
        alt: "Nantucket style porch columns and marine-grade trim work",
      },
      {
        src: "/projects/porch-rebuild-3.svg",
        alt: "Front porch rebuild with clean rail lines and coastal look",
      },
    ],
    description:
      "Rebuilt front porch with classic rail profile, marine paint system, and integrated lighting for evening curb appeal.",
  },
];

const initialFormData: EstimateFormData = {
  name: "",
  phone: "",
  email: "",
  projectType: "",
  timeline: "",
  details: "",
  company: "",
};

const initialCarouselIndexes = featuredProjects.reduce<Record<string, number>>(
  (acc, project) => {
    acc[project.title] = 0;
    return acc;
  },
  {}
);

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [formData, setFormData] = useState<EstimateFormData>(initialFormData);
  const [status, setStatus] = useState<SubmitStatus>({
    loading: false,
    message: "",
    error: false,
  });
  const [carouselIndexes, setCarouselIndexes] = useState<
    Record<string, number>
  >(initialCarouselIndexes);
  const [lightbox, setLightbox] = useState<LightboxState>(null);

  const onChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const changeSlide = (
    projectTitle: string,
    totalImages: number,
    delta: number
  ) => {
    setCarouselIndexes((prev) => {
      const currentIndex = prev[projectTitle] ?? 0;
      return {
        ...prev,
        [projectTitle]: (currentIndex + delta + totalImages) % totalImages,
      };
    });
  };

  const openLightbox = (projectIndex: number, imageIndex: number) => {
    setLightbox({ projectIndex, imageIndex });
  };

  const closeLightbox = () => {
    setLightbox(null);
  };

  const changeLightboxSlide = (delta: number) => {
    setLightbox((prev) => {
      if (!prev) {
        return prev;
      }

      const totalImages = featuredProjects[prev.projectIndex].images.length;
      return {
        ...prev,
        imageIndex: (prev.imageIndex + delta + totalImages) % totalImages,
      };
    });
  };

  useEffect(() => {
    if (!lightbox) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        changeLightboxSlide(-1);
      } else if (event.key === "ArrowRight") {
        changeLightboxSlide(1);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightbox]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ loading: true, message: "", error: false });

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const payload = (await response.json()) as EstimateApiResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Unable to submit request");
      }

      setStatus({ loading: false, message: payload.message, error: false });
      setFormData(initialFormData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit request";
      setStatus({ loading: false, message, error: true });
    }
  };

  return (
    <div className="site-shell">
      <header className="site-header" id="top">
        <nav className="site-nav" aria-label="Primary">
          <a
            className="brand-link"
            href="#top"
            onClick={() => setIsMenuOpen(false)}
          >
            {logoFailed ? null : (
              <img
                className="brand-logo"
                src="/logo.svg"
                alt="NextStep Construction logo"
                onError={() => setLogoFailed(true)}
              />
            )}
            <span
              className={logoFailed ? "brand-text is-visible" : "brand-text"}
            >
              NextStepConstruction
            </span>
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={isMenuOpen}
            aria-controls="primary-menu"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
          <div
            id="primary-menu"
            className={isMenuOpen ? "nav-links is-open" : "nav-links"}
          >
            <a href="#about" onClick={() => setIsMenuOpen(false)}>
              About
            </a>
            <a href="#projects" onClick={() => setIsMenuOpen(false)}>
              Projects
            </a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)}>
              Contact
            </a>
            <a
              className="cta"
              href="#estimate"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Estimate
            </a>
          </div>
        </nav>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <p className="eyebrow">BUILT TO LAST • CRAFTED WITH PRECISION</p>
          <h1 id="hero-title">
            Crafting Superior Woodwork &amp; Quality Interiors
          </h1>
          <p>
            Cape Cod finish carpentry and custom interiors. From custom trim and
            flooring to built-ins and woodwork, we bring your vision to life
            with timeless craftsmanship and attention to detail.
          </p>
          <a className="primary-btn" href="#estimate">
            Request a Free Estimate
          </a>
        </div>
      </section>

      <main>
        <section id="about" className="section about">
          <div>
            <h2>About NextStepConstruction</h2>
            <p>
              I am a local carpenter focused on thoughtful details, clear
              communication, and dependable timelines. Every project is planned
              around your home, your goals, and finishes that hold up to coastal
              weather.
            </p>
            <p>
              From one-room upgrades to full trim packages, I bring a practical
              approach with handcrafted quality at every step.
            </p>
          </div>
          <aside className="about-card">
            <h3>What You Can Expect</h3>
            <ul>
              <li>Transparent estimates</li>
              <li>Clean, organized job sites</li>
              <li>High-durability materials</li>
              <li>Consistent project updates</li>
            </ul>
          </aside>
        </section>

        <section id="projects" className="section projects">
          <h2>Featured Projects</h2>
          <div className="project-grid">
            {featuredProjects.map((project, projectIndex) => {
              const imageIndex = carouselIndexes[project.title] ?? 0;
              const currentImage = project.images[imageIndex];

              return (
                <article key={project.title} className="project-card">
                  <div className="project-media">
                    <button
                      type="button"
                      className="media-button"
                      onClick={() => openLightbox(projectIndex, imageIndex)}
                      aria-label={`Open ${project.title} gallery image`}
                    >
                      <img
                        src={currentImage.src}
                        alt={currentImage.alt}
                        loading="lazy"
                      />
                    </button>
                    <button
                      type="button"
                      className="carousel-arrow left"
                      onClick={() =>
                        changeSlide(project.title, project.images.length, -1)
                      }
                      aria-label={`Previous image for ${project.title}`}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="carousel-arrow right"
                      onClick={() =>
                        changeSlide(project.title, project.images.length, 1)
                      }
                      aria-label={`Next image for ${project.title}`}
                    >
                      ›
                    </button>
                    <div className="carousel-dots">
                      {project.images.map((_, dotIndex) => (
                        <button
                          type="button"
                          key={`${project.title}-dot-${dotIndex}`}
                          className={
                            dotIndex === imageIndex ? "dot active" : "dot"
                          }
                          onClick={() =>
                            setCarouselIndexes((prev) => ({
                              ...prev,
                              [project.title]: dotIndex,
                            }))
                          }
                          aria-label={`Go to image ${dotIndex + 1} for ${
                            project.title
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="location">{project.location}</p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </article>
              );
            })}
          </div>
          <p className="projects-note">
            Tip: replace files in <code>/public/projects</code> with your real
            project photos using the same names. Put your uploaded logo at{" "}
            <code>/public/logo.svg</code> (or update the path in the header).
          </p>
        </section>

        <section id="contact" className="section contact">
          <h2>Contact</h2>
          <div className="contact-grid">
            <p>
              <strong>Phone:</strong> (508) 555-0192
            </p>
            <p>
              <strong>Email:</strong> hello@nextstepconstruction.com
            </p>
            <p>
              <strong>Service Area:</strong> Cape Cod, MA and surrounding areas
            </p>
          </div>
        </section>

        <section id="estimate" className="section estimate">
          <h2>Request a Call for Estimate</h2>
          <form className="estimate-form" onSubmit={onSubmit}>
            <label className="hp-field" aria-hidden="true">
              Company
              <input
                name="company"
                value={formData.company}
                onChange={onChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
            <label>
              Name*
              <input
                name="name"
                value={formData.name}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Phone*
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
              />
            </label>
            <label>
              Project Type*
              <select
                name="projectType"
                value={formData.projectType}
                onChange={onChange}
                required
              >
                <option value="">Select one</option>
                <option value="trim-and-finish">
                  Trim and finish carpentry
                </option>
                <option value="custom-built-ins">Custom built-ins</option>
                <option value="porch-deck">Porch or deck</option>
                <option value="repairs-restoration">
                  Repairs and restoration
                </option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Desired Timeline
              <input
                name="timeline"
                value={formData.timeline}
                onChange={onChange}
                placeholder="e.g. Spring 2026"
              />
            </label>
            <label className="full-width">
              Project Details*
              <textarea
                name="details"
                value={formData.details}
                onChange={onChange}
                rows={5}
                required
                placeholder="Tell us what you want to build or improve"
              />
            </label>
            <button type="submit" disabled={status.loading}>
              {status.loading ? "Sending..." : "Request Estimate Call"}
            </button>
          </form>
          {status.message ? (
            <p className={status.error ? "status error" : "status success"}>
              {status.message}
            </p>
          ) : null}
        </section>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} NextStepConstruction</p>
      </footer>

      {lightbox ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Project image gallery"
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close gallery"
          >
            ×
          </button>
          <button
            type="button"
            className="lightbox-arrow left"
            onClick={(event) => {
              event.stopPropagation();
              changeLightboxSlide(-1);
            }}
            aria-label="Previous image"
          >
            ‹
          </button>
          <figure
            className="lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={
                featuredProjects[lightbox.projectIndex].images[
                  lightbox.imageIndex
                ].src
              }
              alt={
                featuredProjects[lightbox.projectIndex].images[
                  lightbox.imageIndex
                ].alt
              }
            />
            <figcaption>
              {featuredProjects[lightbox.projectIndex].title} • Image{" "}
              {lightbox.imageIndex + 1} of{" "}
              {featuredProjects[lightbox.projectIndex].images.length}
            </figcaption>
          </figure>
          <button
            type="button"
            className="lightbox-arrow right"
            onClick={(event) => {
              event.stopPropagation();
              changeLightboxSlide(1);
            }}
            aria-label="Next image"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
