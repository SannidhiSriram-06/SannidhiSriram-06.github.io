/* ===================================================================
   PORTFOLIO — SANNIDHI SRIRAM
   Interactive behaviors: navbar shrink, dark mode, scroll reveal
   =================================================================== */

(function () {
  'use strict';

  // ---------- STARTUP SPLASH CLEANUP ----------
  var splash = document.getElementById('splashOverlay');
  if (splash) {
    setTimeout(function () { splash.remove(); }, 2000);
  }

  // ---------- DOM REFERENCES ----------
  const html = document.documentElement;
  const navbar = document.getElementById('navbar');
  const themeToggle = document.getElementById('themeToggle');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.querySelector('.navbar-links');
  const allNavLinks = document.querySelectorAll('.nav-link');
  const emailCard = document.getElementById('emailCard');
  const toast = document.getElementById('toast');
  const sections = document.querySelectorAll('.section, .hero');

  // ---------- THEME ----------
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  // Restore saved theme, default to system preference
  (function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      applyTheme(saved);
    } else {
      applyTheme('dark'); // default to dark — portfolio looks best in dark mode
    }
  })();

  themeToggle.addEventListener('click', function () {
    const current = html.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ---------- NAVBAR SHRINK ----------
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        handleNavbarShrink();
        highlightActiveSection();
        ticking = false;
      });
      ticking = true;
    }
  }

  function handleNavbarShrink() {
    if (window.scrollY > 80) {
      navbar.classList.add('shrunk');
    } else {
      navbar.classList.remove('shrunk');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- ACTIVE NAV HIGHLIGHT ----------
  function highlightActiveSection() {
    let current = '';
    sections.forEach(function (section) {
      const top = section.offsetTop - 150;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    allNavLinks.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  // ---------- SMOOTH SCROLL NAV ----------
  allNavLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      // Close mobile menu
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        mobileToggle.classList.remove('active');
      }
    });
  });

  // ---------- MOBILE MENU ----------
  mobileToggle.addEventListener('click', function () {
    this.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // ---------- SCROLL REVEAL — APPLE STYLE ----------
  var revealSelectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale';

  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Auto-stagger child reveals inside this element
          var children = entry.target.querySelectorAll(revealSelectors);
          children.forEach(function (child, index) {
            if (!child.classList.contains('visible')) {
              child.style.transitionDelay = (index * 0.1) + 's';
              // Trigger child reveal after a microtask so the delay applies
              requestAnimationFrame(function () {
                child.classList.add('visible');
              });
            }
          });
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
  );

  document.querySelectorAll(revealSelectors).forEach(function (el) {
    revealObserver.observe(el);
  });

  // ---------- COPY EMAIL ----------
  if (emailCard) {
    emailCard.addEventListener('click', function (e) {
      e.preventDefault();
      navigator.clipboard.writeText('sannidhisriram8@gmail.com').then(function () {
        showToast();
      });
    });
  }

  function showToast() {
    toast.classList.add('show');
    setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  }

  // ---------- PROJECTS CAROUSEL ----------
  const carouselTrack = document.getElementById('carouselTrack');
  const carouselPrev = document.getElementById('carouselPrev');
  const carouselNext = document.getElementById('carouselNext');
  const carouselDots = document.querySelectorAll('.carousel-dot');
  const slides = document.querySelectorAll('.carousel-slide');
  let currentSlide = 0;
  const totalSlides = slides.length;

  // Initialize first slide as active
  slides[0].classList.add('slide-active');

  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    if (index === currentSlide) return;

    // Remove active from all slides
    slides.forEach(function (slide) {
      slide.classList.remove('slide-active', 'slide-exit-up');
    });

    // Activate the new slide
    slides[index].classList.add('slide-active');
    currentSlide = index;

    // Update dots
    carouselDots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  carouselPrev.addEventListener('click', function () {
    goToSlide(currentSlide - 1);
  });

  carouselNext.addEventListener('click', function () {
    goToSlide(currentSlide + 1);
  });

  carouselDots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      goToSlide(i);
    });
  });

  // Touch / swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  carouselTrack.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  carouselTrack.addEventListener('touchend', function (e) {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToSlide(currentSlide + 1);   // swipe left → next
      else goToSlide(currentSlide - 1);    // swipe right → prev
    }
  }, { passive: true });

  // Run initial checks
  handleNavbarShrink();
  highlightActiveSection();

  // ---------- EARTH + COMET ANIMATION ----------
  (function initEarth() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    camera.position.set(0, 0.5, 5);

    var loader = new THREE.TextureLoader();

    // --- EARTH ---
    var earthGeometry = new THREE.SphereGeometry(2.4, 64, 64);
    var earthMaterial = new THREE.MeshPhongMaterial({
      map: loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg'),
      specularMap: loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg'),
      normalMap: loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg'),
      specular: new THREE.Color(0x333333),
      shininess: 15,
    });
    var earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(0, -3.6, -1);
    scene.add(earth);

    // Cloud layer
    var cloudGeometry = new THREE.SphereGeometry(2.44, 64, 64);
    var cloudMaterial = new THREE.MeshPhongMaterial({
      map: loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png'),
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    var clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earth.add(clouds);

    // Inner atmosphere
    var atmosphereGeometry = new THREE.SphereGeometry(2.52, 64, 64);
    var atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.10,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    var atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earth.add(atmosphere);

    // Outer limb glow ring
    var limbGeometry = new THREE.SphereGeometry(2.65, 64, 64);
    var limbMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a9fff,
      transparent: true,
      opacity: 0.055,
      side: THREE.BackSide,
      depthWrite: false,
    });
    var limb = new THREE.Mesh(limbGeometry, limbMaterial);
    earth.add(limb);

    // --- LIGHTING ---
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    var sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // --- SHOOTING STARS (fairy-tale orbiting) ---
    var shootingStarCount = 6;
    var shootingStars = [];

    for (var s = 0; s < shootingStarCount; s++) {
      var group = new THREE.Group();
      scene.add(group);

      // Glowing head
      var headGeo = new THREE.SphereGeometry(0.025 + Math.random() * 0.02, 12, 12);
      var headMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.55 + Math.random() * 0.15, 0.3, 0.9),
        transparent: true,
        opacity: 0.9,
      });
      var head = new THREE.Mesh(headGeo, headMat);
      group.add(head);

      // Trail — series of points forming a wispy tail
      var trailLen = 12;
      var trailGeo = new THREE.BufferGeometry();
      var trailPos = new Float32Array(trailLen * 3);
      var trailCol = new Float32Array(trailLen * 3);
      for (var tp = 0; tp < trailLen; tp++) {
        var f = 1 - tp / trailLen;
        trailCol[tp * 3] = f;
        trailCol[tp * 3 + 1] = f * 0.95;
        trailCol[tp * 3 + 2] = Math.min(1, f * 1.4);
      }
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
      trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));
      var trailMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.5 + Math.random() * 0.3,
      });
      var trail = new THREE.Line(trailGeo, trailMat);
      group.add(trail);

      // Orbital parameters — each star has a unique elliptical path
      shootingStars.push({
        group: group,
        head: head,
        trail: trail,
        trailLen: trailLen,
        trailPositions: trailPos,
        // Ellipse radii
        rx: 3.5 + Math.random() * 4,
        ry: 2.0 + Math.random() * 3,
        rz: -1 + Math.random() * 2,
        // Speed and phase
        speed: 0.002 + Math.random() * 0.003,
        phase: Math.random() * Math.PI * 2,
        // Tilt the orbit plane
        tiltX: (Math.random() - 0.5) * 0.8,
        tiltZ: (Math.random() - 0.5) * 0.6,
        // History for trail
        history: [],
      });
    }

    // --- ANIMATE ---
    function animateEarth() {
      requestAnimationFrame(animateEarth);

      earth.rotation.y += 0.0015;
      earth.rotation.x += 0.0003;
      earth.rotation.z += 0.0001;
      clouds.rotation.y += 0.0008;
      clouds.rotation.x += 0.0004;
      clouds.rotation.z -= 0.0001;

      // Update shooting stars
      for (var si = 0; si < shootingStars.length; si++) {
        var ss = shootingStars[si];
        ss.phase += ss.speed;

        // Elliptical orbit position
        var px = Math.cos(ss.phase) * ss.rx;
        var py = Math.sin(ss.phase) * ss.ry + Math.sin(ss.phase * 0.7) * 0.5;
        var pz = Math.sin(ss.phase * 0.5) * ss.rz;

        // Apply tilt
        var tilted_y = py * Math.cos(ss.tiltX) - pz * Math.sin(ss.tiltX);
        var tilted_z = py * Math.sin(ss.tiltX) + pz * Math.cos(ss.tiltX);

        ss.head.position.set(px, tilted_y, tilted_z);

        // Store history for trail
        ss.history.unshift({ x: px, y: tilted_y, z: tilted_z });
        if (ss.history.length > ss.trailLen) ss.history.pop();

        // Update trail positions
        for (var ti = 0; ti < ss.trailLen; ti++) {
          if (ti < ss.history.length) {
            ss.trailPositions[ti * 3] = ss.history[ti].x;
            ss.trailPositions[ti * 3 + 1] = ss.history[ti].y;
            ss.trailPositions[ti * 3 + 2] = ss.history[ti].z;
          }
        }
        ss.trail.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    }

    animateEarth();

    // Handle resize
    window.addEventListener('resize', function () {
      var w = canvas.offsetWidth;
      var h = canvas.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  })();

})();
