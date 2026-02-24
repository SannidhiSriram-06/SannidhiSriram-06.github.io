/* ===================================================================
   PORTFOLIO — SANNIDHI SRIRAM
   Interactive behaviors: navbar shrink, dark mode, scroll reveal
   =================================================================== */

(function () {
  'use strict';

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

    // --- STARS ---
    var starGeometry = new THREE.BufferGeometry();
    var starCount = 1200;
    var starPositions = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 80;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    var starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.7 });
    var stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

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

    // --- COMET ---
    var cometGroup = new THREE.Group();
    cometGroup.visible = false;
    scene.add(cometGroup);

    var cometGeometry = new THREE.SphereGeometry(0.065, 16, 16);
    var cometMaterialC = new THREE.MeshBasicMaterial({ color: 0xe8f4ff });
    var cometHead = new THREE.Mesh(cometGeometry, cometMaterialC);
    cometGroup.add(cometHead);

    // Comet tail — blue-white gradient
    var tailLength = 28;
    var tailGeometry = new THREE.BufferGeometry();
    var tailPositions = new Float32Array(tailLength * 3);
    var tailColors = new Float32Array(tailLength * 3);
    for (var t = 0; t < tailLength; t++) {
      tailPositions[t * 3] = t * 0.12;
      tailPositions[t * 3 + 1] = t * 0.02;
      tailPositions[t * 3 + 2] = 0;
      var fade = 1 - t / tailLength;
      tailColors[t * 3] = fade;
      tailColors[t * 3 + 1] = fade;
      tailColors[t * 3 + 2] = Math.min(1, fade * 1.3);
    }
    tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeometry.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
    var tailMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, linewidth: 2 });
    var tail = new THREE.Line(tailGeometry, tailMaterial);
    cometGroup.add(tail);

    // Comet animation state
    var cometT = 0;
    var cometDuration = 220;
    var cometPause = 300;
    var cometTimer = 0;
    var cometActive = false;

    var cometStartX = -6, cometStartY = 4.5;
    var cometEndX = 5, cometEndY = 0.8;

    function resetComet() {
      cometT = 0;
      cometActive = true;
      cometGroup.visible = true;
    }

    setTimeout(resetComet, 1500);

    // --- ANIMATE ---
    function animateEarth() {
      requestAnimationFrame(animateEarth);

      earth.rotation.y += 0.0015;
      clouds.rotation.y += 0.0008;
      clouds.rotation.x += 0.0002;
      // Star parallax handled below

      if (cometActive) {
        cometT++;
        var progress = cometT / cometDuration;
        var easedProgress = progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

        cometGroup.position.x = cometStartX + (cometEndX - cometStartX) * easedProgress;
        cometGroup.position.y = cometStartY + (cometEndY - cometStartY) * easedProgress;
        cometGroup.position.z = 0.5;

        cometGroup.rotation.z = Math.atan2(
          -(cometEndY - cometStartY),
          -(cometEndX - cometStartX)
        );

        if (cometT >= cometDuration) {
          cometActive = false;
          cometGroup.visible = false;
          cometTimer = 0;
        }
      } else {
        cometTimer++;
        if (cometTimer >= cometPause) {
          resetComet();
        }
      }

      // Smooth mouse follow for stars parallax
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      stars.rotation.x = mouseY * 0.3;
      stars.rotation.y += 0.00008 + mouseX * 0.01;

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

    // Mouse parallax for stars
    var mouseX = 0;
    var mouseY = 0;
    var targetMouseX = 0;
    var targetMouseY = 0;

    window.addEventListener('mousemove', function (e) {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
    });

    // Respect dark/light mode — adjust star opacity
    var themeObserver = new MutationObserver(function () {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      starMaterial.opacity = isDark ? 0.85 : 0.35;
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    starMaterial.opacity = isDark ? 0.85 : 0.35;
  })();

})();
