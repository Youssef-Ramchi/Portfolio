// Vendor libraries are loaded as globals from /js/vendor (see index.html)
const { gsap, ScrollTrigger, Lenis } = window

if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger)
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]

/* --------------------------------------------------------------------------
   Smooth scroll + anchor links
   -------------------------------------------------------------------------- */

let lenis = null

if (!reduceMotion && Lenis) {
  lenis = new Lenis({ lerp: 0.1 })
  if (ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update)
  }
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
}

$$('[data-scroll-to]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const target = $(el.dataset.scrollTo)
    if (!target) return
    e.preventDefault()
    if (lenis) lenis.scrollTo(target, { duration: 1.6 })
    else target.scrollIntoView({ behavior: 'smooth' })
  })
})

// Floating controls hide while the footer is on screen
if (ScrollTrigger) {
  ScrollTrigger.create({
    trigger: '.footer',
    start: 'top 85%',
    onToggle: (self) => document.body.classList.toggle('is-footer', self.isActive),
  })

  // Footer dark edge: smooth dome reveal reaching Figma maximum curvature (2.34vw = 45px) at 100% bottom of screen
  gsap.fromTo(
    '.footer',
    { '--rise': 0 },
    {
      '--rise': 2.34,
      ease: 'none',
      scrollTrigger: {
        trigger: '.footer',
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: true,
      },
    }
  )

  // Scroll reveals on elements with [data-reveal]
  if (!reduceMotion) {
    $$('[data-reveal]').forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 32 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true,
          },
        }
      )
    })
  }
}

/* --------------------------------------------------------------------------
   Interactive Cursor
   -------------------------------------------------------------------------- */

const cursor = $('.cursor')
if (cursor && !window.matchMedia('(pointer: coarse)').matches) {
  let mouseX = -100
  let mouseY = -100
  let currentX = -100
  let currentY = -100

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
  })

  const updateCursor = () => {
    currentX += (mouseX - currentX) * 0.2
    currentY += (mouseY - currentY) * 0.2
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
    requestAnimationFrame(updateCursor)
  }
  requestAnimationFrame(updateCursor)

  const interactiveElements = 'a, button, [role="button"]'
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveElements)) {
      cursor.classList.add('is-hover')
    }
  })
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactiveElements)) {
      cursor.classList.remove('is-hover')
    }
  })
}
