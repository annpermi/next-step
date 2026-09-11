import { useEffect, useRef, useState } from "react";
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

// Imagery below is representative Cape Cod work generated for this demo site —
// swap in real project photos before using it for a live business.
const featuredProjects: Project[] = [
  {
    title: "Trim & Finish Carpentry",
    location: "Chatham, MA",
    images: [
      {
        src: "/projects/trim-1.jpg",
        alt: "Deep white window casing with a stool, apron and cushioned window seat",
      },
      {
        src: "/projects/trim-2.jpg",
        alt: "Raised-panel wainscoting running up a hallway over a wide-plank floor",
      },
      {
        src: "/projects/trim-3.jpg",
        alt: "Crown molding meeting a door casing in crisp painted white woodwork",
      },
      {
        src: "/projects/trim-4.jpg",
        alt: "Painted white beamed ceiling with tongue-and-groove infill in a living room",
      },
    ],
    description:
      "Custom casing, wainscot, crown and window seats fitted so the joinery reads as original to the house.",
  },
  {
    title: "Custom Built-Ins",
    location: "Barnstable, MA",
    images: [
      {
        src: "/projects/builtins-1.jpg",
        alt: "White shaker built-in bookcases flanking a stone fireplace",
      },
      {
        src: "/projects/builtins-2.jpg",
        alt: "Custom mudroom bench with cubbies, shiplap wall and iron coat hooks",
      },
      {
        src: "/projects/builtins-3.jpg",
        alt: "Window-seat storage bench under a bay window with the lids open",
      },
      {
        src: "/projects/builtins-4.jpg",
        alt: "Navy painted pantry cabinetry with open shelving and brass cup pulls",
      },
    ],
    description:
      "Bookcases, mudroom benches and cabinetry, beadboard-backed and painted in place for a built-with-the-house look.",
  },
  {
    title: "Stairs & Railings",
    location: "Yarmouth Port, MA",
    images: [
      {
        src: "/projects/stairs-1.jpg",
        alt: "Staircase with square painted balusters, white-oak treads and a square newel",
      },
      {
        src: "/projects/stairs-2.jpg",
        alt: "Close-up of a stair newel post and profiled oak handrail joinery",
      },
      {
        src: "/projects/stairs-3.jpg",
        alt: "Staircase landing with a run of balusters against a white shiplap wall",
      },
      {
        src: "/projects/stairs-4.jpg",
        alt: "Exterior covered-porch railing with square balusters against cedar shingles",
      },
    ],
    description:
      "Square balusters, white-oak treads and handrails profiled to match the trim package, inside and out.",
  },
  {
    title: "Repairs & Restoration",
    location: "Wellfleet, MA",
    images: [
      {
        src: "/projects/repairs-1.jpg",
        alt: "Cape Cod house exterior with new weathered-grey cedar shingles and white trim",
      },
      {
        src: "/projects/repairs-2.jpg",
        alt: "Rebuilt covered front porch with square painted columns and a beadboard ceiling",
      },
      {
        src: "/projects/repairs-3.jpg",
        alt: "Restored historic double-hung windows with wood storm sash on a shingled wall",
      },
      {
        src: "/projects/repairs-4.jpg",
        alt: "Exterior trim carpentry in progress on a house gable with new rake boards",
      },
    ],
    description:
      "Cedar siding, porch rebuilds, historic window restoration and exterior trim that keeps a home tight against the weather.",
  },
];

type RoomWalkStop = {
  title: string;
  copy: string;
  projectIndex: number;
};

// Stop 0 is the establishing view, shown under the static title with no
// preview row. Stops 1-3 land near the 1/3, 2/3 and end of the frame run as
// the camera walks in, each surfacing its matching project's real photos.
const roomWalkStops: RoomWalkStop[] = [
  {
    title: "Trim & finish carpentry",
    copy: "Custom casing, wainscot and window seats fitted so the joinery looks original to the house.",
    projectIndex: 0,
  },
  {
    title: "Custom built-ins",
    copy: "Floor-to-ceiling bookcases and cabinetry, beadboard-backed and painted in place.",
    projectIndex: 1,
  },
  {
    title: "Stairs & railings",
    copy: "Square balusters, white-oak treads and a handrail profiled to match the trim package.",
    projectIndex: 2,
  },
  {
    title: "Repairs & restoration",
    copy: "The details that keep a Cape Cod home tight against the weather, inside and out.",
    projectIndex: 3,
  },
];

// Scroll rhythm for the frame scrubber: brief hold at each stop, most of the
// scroll spent travelling. Holds sit on the segment boundaries (0, 1/3, 2/3, 1).
// Retuning this is a few numbers, never a regeneration.
const roomWalkTimeline = [
  { to: 0.04, scroll: 1 }, // settle at the establishing view
  { to: 0.31, scroll: 3 }, // travel to the built-ins
  { to: 0.37, scroll: 1 }, // hold on the built-ins (~1/3)
  { to: 0.63, scroll: 3 }, // travel to the staircase
  { to: 0.7, scroll: 1 }, //  hold on the staircase (~2/3)
  { to: 1.0, scroll: 3 }, // travel in to the stair-foot detail
];

function RoomWalkHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [stopIndex, setStopIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) {
      return undefined;
    }

    let cancelled = false;
    let seq: InstanceType<
      typeof import("./roomwalk/scrollFrames.js").default
    > | null = null;
    let resizeObserver: ResizeObserver | null = null;

    // The scrubber attaches its own rAF-throttled scroll handler. This second
    // handler draws synchronously off the same math, so a starved rAF (some
    // mobile browsers, backgrounded tabs) can't leave the hero frozen. Scroll
    // events are already coalesced by the browser and a canvas blit is cheap.
    const backupScroll = () => {
      if (!seq) {
        return;
      }
      const last = seq.indices.length - 1;
      const slot = Math.min(
        last,
        Math.max(0, Math.round(seq.curve(seq.progress()) * last)),
      );
      seq.draw(slot);
    };

    const wait = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    // Paint the poster onto the canvas ourselves. The scrubber takes a 2d
    // context with `alpha: false`, which turns the canvas opaque black and hides
    // the CSS background, so without this the section is black until frame 0
    // decodes — and stays black if the frames can't be fetched at all.
    const poster = new Image();
    const paintPoster = () => {
      if (cancelled || !poster.complete || poster.naturalWidth === 0) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) {
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      const scale = Math.max(
        canvas.width / poster.naturalWidth,
        canvas.height / poster.naturalHeight,
      );
      const w = poster.naturalWidth * scale;
      const h = poster.naturalHeight * scale;
      ctx.drawImage(
        poster,
        (canvas.width - w) / 2,
        (canvas.height - h) / 2,
        w,
        h,
      );
    };
    poster.onload = paintPoster;
    poster.src = "/roomwalk/poster.jpg";

    (async () => {
      try {
        const manifest = await fetch("/roomwalk/frames/manifest.json", {
          cache: "force-cache",
        });
        const contentType = manifest.headers.get("content-type") || "";
        if (!manifest.ok || !contentType.includes("json") || cancelled) {
          // Frames not deployed (e.g. the server isn't serving /roomwalk/):
          // leave the poster in place and don't grow the section.
          return;
        }
        const { default: ScrollFrames } =
          await import("./roomwalk/scrollFrames.js");
        if (cancelled) {
          return;
        }

        // Apply the tall scroll-spacer height first, then wait for layout so the
        // scrubber measures a real canvas size (it caches width/height on start
        // and only re-reads them on a window resize).
        setIsScrubbing(true);
        for (let tries = 0; tries < 40; tries += 1) {
          await wait(50);
          if (cancelled) {
            return;
          }
          if (canvas.getBoundingClientRect().height > 0) {
            break;
          }
        }

        seq = new ScrollFrames({
          canvas,
          scroller: section,
          dir: "/roomwalk/frames",
          manifest: "/roomwalk/frames/manifest.json",
          fit: "cover",
          timeline: roomWalkTimeline,
          // This is the hero — it must respond to scroll even with reduced
          // motion (the scrub is driven by the user, not autoplay).
          respectReducedMotion: false,
          onFrame: (progress: number) => {
            const next =
              progress < 0.28 ? 0 : progress < 0.6 ? 1 : progress < 0.9 ? 2 : 3;
            setStopIndex((prev) => (prev === next ? prev : next));
          },
        });
        await seq.start();
        if (cancelled) {
          return;
        }

        // If frame 0 never blitted (all fetches failed), fall back to the poster
        // and a short static section instead of a tall black one.
        if (seq.drawn < 0) {
          seq.destroy();
          seq = null;
          setIsScrubbing(false);
          paintPoster();
          console.warn("Room walk frames could not be loaded; showing poster.");
          return;
        }

        // Recover if the canvas was measured at 0 (hidden tab, late layout):
        // any real size change re-triggers the scrubber's own resize handler.
        resizeObserver = new ResizeObserver(() => {
          window.dispatchEvent(new Event("resize"));
        });
        resizeObserver.observe(canvas);

        window.addEventListener("scroll", backupScroll, { passive: true });
        backupScroll();
      } catch (error) {
        // No frames yet, or the module failed to load: the poster image stays.
        if (!cancelled) {
          console.warn("Room walk hero unavailable:", error);
        }
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", backupScroll);
      resizeObserver?.disconnect();
      seq?.destroy?.();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={isScrubbing ? "roomwalk is-scrubbing" : "roomwalk"}
      aria-label="NextStepConstruction — Cape Cod finish carpentry"
    >
      <div className="roomwalk-stage">
        <canvas ref={canvasRef} className="roomwalk-canvas" />
        <div className="roomwalk-bar">
          <div className="roomwalk-bar-main">
            <h2>Cape Cod finish carpentry, built to last</h2>
            <a className="primary-btn" href="#estimate">
              Request a Free Estimate
            </a>
          </div>
          {stopIndex > 0 ? (
            <div className="roomwalk-preview" key={stopIndex}>
              <div className="roomwalk-preview-text">
                <p className="roomwalk-preview-title">
                  {roomWalkStops[stopIndex].title}
                </p>
                <p>{roomWalkStops[stopIndex].copy}</p>
              </div>
              <div className="roomwalk-proof">
                {featuredProjects[roomWalkStops[stopIndex].projectIndex].images
                  .slice(0, 3)
                  .map((image) => (
                    <a
                      key={image.src}
                      className="roomwalk-proof-item"
                      href="#projects"
                      aria-label={`See ${
                        featuredProjects[roomWalkStops[stopIndex].projectIndex]
                          .title
                      } in projects`}
                    >
                      <img src={image.src} alt={image.alt} loading="lazy" />
                    </a>
                  ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

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
  {},
);

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  // True while the roomwalk hero is (at least partly) in view: the nav floats
  // transparent over it, logo only. Starts true — the page always loads at the
  // top, on the hero — so server and client render the same on first paint.
  const [navOverHero, setNavOverHero] = useState(true);
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
    >,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const changeSlide = (
    projectTitle: string,
    totalImages: number,
    delta: number,
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

  useEffect(() => {
    const heroSection = document.querySelector<HTMLElement>(".roomwalk");
    if (!heroSection) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setNavOverHero(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(heroSection);

    return () => observer.disconnect();
  }, []);

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
      <header
        className={
          navOverHero ? "site-header site-header--transparent" : "site-header"
        }
        id="top"
      >
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
                width={160}
                height={80}
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

      <RoomWalkHero />

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
            Representative Cape Cod work — imagery shown for demonstration.
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
        <p className="footer-note">
          The walkthrough interior is a styled Cape Cod set used to frame the
          work, not a photograph of a specific project. Project thumbnails are
          real NextStepConstruction jobs.
        </p>
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
