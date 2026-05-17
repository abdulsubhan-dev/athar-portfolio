// ============================================================
// ATHAR JAMIL PORTFOLIO — script.js
// Public website: animations, Firebase data fetch, interactions
// ============================================================

import { db } from './firebase-config.js';
import {
  collection, getDocs, addDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Default data (shown if Firebase is empty or not configured) ──
const DEFAULT_SERVICES = [
  { icon: '🎨', title: 'Graphic Design',       description: 'Eye-catching visuals that communicate your brand story with clarity and style.' },
  { icon: '🎬', title: 'Video Editing',         description: 'Professional video edits with seamless cuts, color grading, and sound design.' },
  { icon: '📱', title: 'Social Media Posts',   description: 'Scroll-stopping content tailored for Instagram, Facebook, TikTok and more.' },
  { icon: '💼', title: 'Branding',              description: 'Complete brand identity systems — logos, palettes, typography and guidelines.' },
  { icon: '🎞️', title: 'Reels Editing',        description: 'Engaging short-form video content optimized for maximum reach and impact.' },
  { icon: '🖼️', title: 'Thumbnail Design',     description: 'High-CTR thumbnails that compel clicks for YouTube and other platforms.' },
];

// Local portfolio projects bundled with the website. These make the portfolio work even before Firebase/Cloudinary uploads are added.
const DEFAULT_PROJECTS = [
  {
    "id": "local-01",
    "title": "Big Bite Burger Campaign",
    "category": "Food Design",
    "description": "A bold burger promotional design with warm lighting, product-focused styling, and a premium fast-food visual direction.",
    "imageUrl": "assets/projects/project-01.jpg"
  },
  {
    "id": "local-02",
    "title": "Scenic Bites Food Post",
    "category": "Food Design",
    "description": "A lifestyle food poster combining scenic travel visuals with appetizing food photography for social media engagement.",
    "imageUrl": "assets/projects/project-02.jpg"
  },
  {
    "id": "local-03",
    "title": "It’s Fry-Day Fries Poster",
    "category": "Food Design",
    "description": "A catchy fries campaign design with rustic textures, playful copy, and restaurant-style product presentation.",
    "imageUrl": "assets/projects/project-03.jpg"
  },
  {
    "id": "local-04",
    "title": "Premium Slice Pizza Creative",
    "category": "Food Design",
    "description": "A high-impact pizza poster featuring cheese pull visuals, cinematic lighting, and appetizing brand composition.",
    "imageUrl": "assets/projects/project-04.jpg"
  },
  {
    "id": "local-05",
    "title": "Royal Taste Combo Design",
    "category": "Food Design",
    "description": "A clean restaurant combo advertisement highlighting burger and fries with elegant product placement.",
    "imageUrl": "assets/projects/project-05.jpg"
  },
  {
    "id": "local-06",
    "title": "Pizza Time Creative Poster",
    "category": "Food Design",
    "description": "A conceptual pizza design using time-based visual storytelling to create a memorable promotional post.",
    "imageUrl": "assets/projects/project-06.jpg"
  },
  {
    "id": "local-07",
    "title": "Scene Set Hai Food Campaign",
    "category": "Food Design",
    "description": "A vibrant pizza campaign with dramatic restaurant ambiance and strong social media appeal.",
    "imageUrl": "assets/projects/project-07.jpg"
  },
  {
    "id": "local-08",
    "title": "Hungry History Burger Poster",
    "category": "Food Design",
    "description": "A creative burger advertisement with cinematic background treatment and bold food-focused typography.",
    "imageUrl": "assets/projects/project-08.jpg"
  },
  {
    "id": "local-09",
    "title": "Wrap Addiction Poster",
    "category": "Food Design",
    "description": "A premium wrap promotional design using minimal composition, warm lighting, and clean restaurant branding.",
    "imageUrl": "assets/projects/project-09.jpg"
  },
  {
    "id": "local-10",
    "title": "Amazing Style Fashion Sale",
    "category": "Fashion Design",
    "description": "A colorful fashion sale poster with modern typography, model-focused layout, and high-energy visual styling.",
    "imageUrl": "assets/projects/project-10.jpg"
  },
  {
    "id": "local-11",
    "title": "Center Seed Corporation Ad",
    "category": "Agriculture Design",
    "description": "An agriculture product advertisement designed with clear product visibility, Urdu copy, and commercial layout.",
    "imageUrl": "assets/projects/project-11.jpg"
  },
  {
    "id": "local-12",
    "title": "Center Seed Field Campaign",
    "category": "Agriculture Design",
    "description": "A professional Urdu agriculture poster featuring field visuals, product packaging, and promotional messaging.",
    "imageUrl": "assets/projects/project-12.jpg"
  },
  {
    "id": "local-13",
    "title": "Awareness Program Poster",
    "category": "Event Design",
    "description": "A community awareness poster designed with institutional branding, Urdu content, and structured information layout.",
    "imageUrl": "assets/projects/project-13.jpg"
  },
  {
    "id": "local-14",
    "title": "Mall of Central Square Promotion",
    "category": "Real Estate Design",
    "description": "A lifestyle real estate promotional creative with bold color overlay, mall branding, and premium city appeal.",
    "imageUrl": "assets/projects/project-14.jpg"
  },
  {
    "id": "local-15",
    "title": "Swat Kalam Malam Jabba Tour Flyer",
    "category": "Travel Design",
    "description": "A detailed travel tour flyer with itinerary, attractions, pricing, and strong destination-focused visuals.",
    "imageUrl": "assets/projects/project-15.jpg"
  },
  
  {
    "id": "local-17",
    "title": "Bite Mania Burger Poster",
    "category": "Food Design",
    "description": "A modern burger poster with warm restaurant mood, bold typography, and clean product-centered design.",
    "imageUrl": "assets/projects/project-17.jpg"
  },
  {
    "id": "local-18",
    "title": "Punjab Open Golf Championship Flyer",
    "category": "Sports Design",
    "description": "A sports event flyer for golf championship promotion with sponsor placement and prize highlight.",
    "imageUrl": "assets/projects/project-18.jpg"
  },
  {
    "id": "local-19",
    "title": "Grand Opening Scooter Ad",
    "category": "Automotive Design",
    "description": "A vertical grand opening advertisement for scooter promotion with product details and dealership branding.",
    "imageUrl": "assets/projects/project-19.jpg"
  },
  {
    "id": "local-20",
    "title": "Engineering Seminar Poster",
    "category": "Event Design",
    "description": "A professional academic seminar poster with event title, resource person details, and institutional layout.",
    "imageUrl": "assets/projects/project-20.jpg"
  },
  {
    "id": "local-21",
    "title": "IGI Securities Payment Flyer",
    "category": "Corporate Design",
    "description": "A financial services flyer with QR code layout, instructions, and corporate-style visual structure.",
    "imageUrl": "assets/projects/project-21.jpg"
  },
  {
    "id": "local-22",
    "title": "A4 Punjab Open Golf Banner",
    "category": "Sports Design",
    "description": "A tall event banner for golf championship promotion with city visuals, sponsor branding, and clean hierarchy.",
    "imageUrl": "assets/projects/project-22.jpg"
  },
  {
    "id": "local-23",
    "title": "Soccer Crunch Sports Creative",
    "category": "Sports Design",
    "description": "A dynamic sports poster combining football action, product imagery, and energetic motion-inspired composition.",
    "imageUrl": "assets/projects/project-23.jpg"
  },
  {
    "id": "local-24",
    "title": "Haunted Hunger Burger Concept",
    "category": "Food Design",
    "description": "A dramatic Halloween-style food creative with dark atmosphere, glowing effects, and cinematic burger presentation.",
    "imageUrl": "assets/projects/project-24.jpg"
  },
  {
    "id": "local-25",
    "title": "Human Trap Burger Concept",
    "category": "Food Design",
    "description": "A unique conceptual burger advertisement with creative prop styling and strong visual storytelling.",
    "imageUrl": "assets/projects/project-25.jpg"
  }
];


// ============================================================
// PRELOADER
// ============================================================
window.addEventListener('load', () => {
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    preloader.classList.add('hidden');
    document.body.style.overflow = '';
  }, 2600);
});

document.body.style.overflow = 'hidden';


// ============================================================
// PARTICLE CANVAS — continuous loop
// ============================================================
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const COUNT = 55;
  const COLORS = ['rgba(168,85,247,0.6)', 'rgba(34,211,238,0.5)', 'rgba(255,255,255,0.3)'];

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * 1200,
      y: Math.random() * 800,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.6 + 0.2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(168,85,247,${0.15 * (1 - dist/120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();


// ============================================================
// NAVBAR — scroll behavior & hamburger
// ============================================================
(function initNavbar() {
  const navbar     = document.getElementById('navbar');
  const hamburger  = document.getElementById('hamburger');
  const navMobile  = document.getElementById('navMobile');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  hamburger.addEventListener('click', () => {
    navMobile.classList.toggle('open');
  });

  // Close mobile menu on link click
  navMobile.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navMobile.classList.remove('open'));
  });
})();


// ============================================================
// TYPED TEXT — continuous loop
// ============================================================
(function initTyped() {
  const el = document.getElementById('typedText');
  if (!el) return;

  const phrases = [
    'Graphics Designer',
    'Video Editor',
    'Brand Specialist',
    'Visual Storyteller',
    'Reels Creator',
  ];
  let pi = 0, ci = 0, deleting = false;

  function type() {
    const phrase = phrases[pi];
    el.textContent = deleting
      ? phrase.slice(0, ci--)
      : phrase.slice(0, ci++);

    if (!deleting && ci > phrase.length) {
      deleting = true;
      setTimeout(type, 1800);
      return;
    }
    if (deleting && ci < 0) {
      deleting = false;
      pi = (pi + 1) % phrases.length;
      setTimeout(type, 300);
      return;
    }
    setTimeout(type, deleting ? 40 : 80);
  }
  type();
})();


// ============================================================
// SCROLL REVEAL
// ============================================================
(function initReveal() {
  const els = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
})();


// ============================================================
// FOOTER YEAR
// ============================================================
document.getElementById('footerYear').textContent = new Date().getFullYear();


// ============================================================
// SMOOTH SCROLL for anchor links
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


// ============================================================
// FIREBASE — Load Services
// ============================================================
async function loadServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  try {
    const snap = await getDocs(collection(db, 'services'));
    const items = [];
    snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

    if (items.length === 0) {
      renderServices(DEFAULT_SERVICES, grid);
    } else {
      renderServices(items, grid);
    }
  } catch (err) {
    console.warn('Firebase services error — using defaults:', err.message);
    renderServices(DEFAULT_SERVICES, grid);
  }
}

function renderServices(items, grid) {
  grid.innerHTML = '';
  items.forEach(s => {
    const card = document.createElement('div');
    card.className = 'service-card reveal-up';
    card.innerHTML = `
      <span class="service-icon">${s.icon || '✦'}</span>
      <h3>${s.title}</h3>
      <p>${s.description || ''}</p>
      <div class="service-line"></div>
    `;
    grid.appendChild(card);
  });
  // Re-observe new elements
  const els = grid.querySelectorAll('.reveal-up');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}


// ============================================================
// FIREBASE — Load Projects
// ============================================================
let allProjects = [];

async function loadProjects() {
  const grid   = document.getElementById('projectsGrid');
  const filterBar = document.getElementById('filterBar');
  if (!grid) return;

  allProjects = [...DEFAULT_PROJECTS];

  try {
    const snap = await getDocs(collection(db, 'projects'));
    const firebaseProjects = [];
    snap.forEach(doc => firebaseProjects.push({ id: doc.id, ...doc.data() }));
    // Show admin-added projects first, then bundled portfolio samples.
    allProjects = [...firebaseProjects, ...DEFAULT_PROJECTS];
  } catch (err) {
    console.warn('Firebase projects error — using local portfolio projects:', err.message);
  }

  // Build category filter buttons
  const cats = ['All', ...new Set(allProjects.map(p => p.category).filter(Boolean))];
  filterBar.innerHTML = '';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === 'All' ? ' active' : '');
    btn.dataset.filter = cat === 'All' ? 'all' : cat;
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterProjects(btn.dataset.filter);
    });
    filterBar.appendChild(btn);
  });

  renderProjects(allProjects, grid);
}

function filterProjects(cat) {
  const filtered = cat === 'all'
    ? allProjects
    : allProjects.filter(p => p.category === cat);
  renderProjects(filtered, document.getElementById('projectsGrid'));
}

function renderProjects(items, grid) {
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-image"></i><p>No projects yet. Check back soon!</p></div>`;
    return;
  }

  items.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card reveal-up';
    card.innerHTML = `
      <div class="project-img-wrap">
        ${p.imageUrl
          ? `<img src="${p.imageUrl}" alt="${p.title}" loading="lazy" />`
          : `<div class="project-img-placeholder"><i class="fa-solid fa-image"></i></div>`}
        <div class="project-overlay">
          <span class="project-view-btn"><i class="fa-solid fa-expand"></i> View</span>
        </div>
      </div>
      <div class="project-body">
        <span class="project-cat">${p.category || 'Design'}</span>
        <h3>${p.title}</h3>
      </div>
    `;
    card.addEventListener('click', () => openLightbox(p));
    grid.appendChild(card);
  });

  const els = grid.querySelectorAll('.reveal-up');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

// Lightbox
function openLightbox(p) {
  document.getElementById('lightboxImg').src = p.imageUrl || '';
  document.getElementById('lightboxImg').style.display = p.imageUrl ? 'block' : 'none';
  document.getElementById('lightboxCat').textContent   = p.category || '';
  document.getElementById('lightboxTitle').textContent = p.title    || '';
  document.getElementById('lightboxDesc').textContent  = p.description || '';
  document.getElementById('lightbox').classList.add('open');
}

document.getElementById('lightboxClose').addEventListener('click', () => {
  document.getElementById('lightbox').classList.remove('open');
});
document.getElementById('lightboxOverlay').addEventListener('click', () => {
  document.getElementById('lightbox').classList.remove('open');
});


// ============================================================
// FIREBASE — Load Videos
// ============================================================
async function loadVideos() {
  const grid = document.getElementById('videosGrid');
  if (!grid) return;

  let videos = [];
  try {
    const snap = await getDocs(collection(db, 'videos'));
    snap.forEach(doc => videos.push({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Firebase videos error:', err.message);
  }

  grid.innerHTML = '';

  if (videos.length === 0) {
    grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-film"></i><p>No videos yet. Coming soon!</p></div>`;
    return;
  }

  videos.forEach(v => {
    const card = document.createElement('div');
    card.className = 'video-card reveal-up';
    card.innerHTML = `
      <div class="video-thumb-wrap">
        ${v.thumbnailUrl
          ? `<img src="${v.thumbnailUrl}" alt="${v.title}" loading="lazy" />`
          : `<div class="video-thumb-placeholder"><i class="fa-solid fa-film"></i></div>`}
        <div class="video-play-btn"><i class="fa-solid fa-play"></i></div>
      </div>
      <div class="video-body">
        <h3>${v.title}</h3>
        <p>${v.description || ''}</p>
      </div>
    `;
    card.addEventListener('click', () => openVideoModal(v));
    grid.appendChild(card);
  });

  const els = grid.querySelectorAll('.reveal-up');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

// Convert video URLs to embeddable format
function toEmbedUrl(url) {
  if (!url) return '';
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  return url;
}

function openVideoModal(v) {
  document.getElementById('videoFrame').src = toEmbedUrl(v.videoUrl);
  document.getElementById('videoModalTitle').textContent = v.title || '';
  document.getElementById('videoModalDesc').textContent  = v.description || '';
  document.getElementById('videoModal').classList.add('open');
}

function closeVideoModal() {
  document.getElementById('videoFrame').src = '';
  document.getElementById('videoModal').classList.remove('open');
}

document.getElementById('videoModalClose').addEventListener('click', closeVideoModal);
document.getElementById('videoModalOverlay').addEventListener('click', closeVideoModal);


// ============================================================
// INIT
// ============================================================
loadServices();
loadProjects();
loadVideos();
