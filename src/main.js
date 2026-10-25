// Vendor libraries are loaded as globals from /js/vendor (see index.html)
const { gsap, ScrollTrigger, Lenis } = window

gsap.registerPlugin(ScrollTrigger)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]

/* --------------------------------------------------------------------------
   Smooth scroll + anchor links
   -------------------------------------------------------------------------- */

let lenis = null

if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.1 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
}

$$('[data-scroll-to]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const target = $(el.dataset.scrollTo)
    if (!target) return
    e.preventDefault()
    if (lenis) lenis.scrollTo(target, { duration: 1.6 })
    else target.scrollIntoView()
  })
})

// Floating controls hide while the footer is on screen
ScrollTrigger.create({
  trigger: '.footer',
  start: 'top 85%',
  onToggle: (self) => document.body.classList.toggle('is-footer', self.isActive),
})

/* --------------------------------------------------------------------------
   Marquee bands — duplicate the content so the loop is seamless
   -------------------------------------------------------------------------- */

$$('.band__track').forEach((track) => {
  const group = document.createElement('div')
  group.className = 'band__group'
  group.append(...track.children)
  track.append(group)
  for (let i = 0; i < 3; i++) track.append(group.cloneNode(true))
  track.classList.add('is-running')
})

/* --------------------------------------------------------------------------
   Experience timeline — the green line
   -------------------------------------------------------------------------- */

// Geometry of the curve inside its SVG (viewBox 369.506 x 1207.01, 23px stroke padding)
const CURVE = { height: 1207.01, pathSpan: 1161, pad: 23.0063 }

const xp = {
  rows: $('.xp__rows'),
  curve: $('.xp__curve'),
  path: $('.xp__curve path'),
  glow: $('.xp__glow'),
  dots: $$('.xp__dot'),
  ys: [],
  span: 0,
  glowBase: 0,
  barTop: 0,
  barLength: 0,
}

// Stretch the curve from the first dot to the last one, and anchor the progress bar
function layoutTimeline() {
  const top = xp.rows.getBoundingClientRect().top
  xp.ys = xp.dots.map((dot) => {
    const r = dot.getBoundingClientRect()
    return r.top + r.height / 2 - top
  })
  xp.span = xp.ys[xp.ys.length - 1] - xp.ys[0]

  const k = xp.span / CURVE.pathSpan
  xp.curve.style.top = `${xp.ys[0] - CURVE.pad * k}px`
  xp.curve.style.height = `${CURVE.height * k}px`

  // the bar's CSS height is the mockup's resting segment, centred on the first dot:
  // it gives the overhang above the first dot and below the last one
  xp.glow.style.height = ''
  xp.glowBase = xp.glow.offsetHeight
  xp.barTop = xp.ys[0] - xp.glowBase / 2
  xp.barLength = xp.span + xp.glowBase
  xp.glow.style.top = `${xp.barTop}px`
}

layoutTimeline()

if (reduceMotion) {
  xp.dots[0].classList.add('is-active')
  window.addEventListener('resize', layoutTimeline)
} else {
  const length = xp.path.getTotalLength()
  const state = { progress: 0 }

  gsap.set(xp.path, { strokeDasharray: length, strokeDashoffset: length, autoAlpha: 0 })

  // One progress value drives the bar, the dots and the curve, so the curve's tip
  // stays level with the bar's tip
  const render = () => {
    const tip = state.progress * xp.barLength
    const drawn = gsap.utils.clamp(0, 1, (tip - xp.glowBase / 2) / xp.span)

    xp.glow.style.height = `${tip}px`
    xp.dots.forEach((dot, i) => dot.classList.toggle('is-active', xp.ys[i] <= xp.barTop + tip))
    // a round line cap paints a dot even at zero length, so hide the path until it starts
    gsap.set(xp.path, { strokeDashoffset: length * (1 - drawn), autoAlpha: drawn > 0.002 ? 1 : 0 })
  }

  ScrollTrigger.addEventListener('refreshInit', layoutTimeline)
  ScrollTrigger.addEventListener('refresh', render)

  // Same pacing as the reference: the bar starts filling while its tip is low on screen
  // and finishes with the tip high on screen, so it travels slower than the page scrolls
  gsap.to(state, {
    progress: 1,
    ease: 'none',
    onUpdate: render,
    scrollTrigger: {
      trigger: xp.rows,
      start: () => `top+=${xp.barTop} 78%`,
      end: () => `top+=${xp.barTop + xp.barLength} 32%`,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  })

  render()

  // Hero/dark edge: flat at rest, then gently domes up as the dark block climbs into view
  gsap.fromTo(
    '.dark',
    { '--rise': 0 },
    {
      '--rise': 6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.dark',
        start: 'top bottom',
        end: 'top 20%',
        scrub: 1,
      },
    }
  )

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
}

/* --------------------------------------------------------------------------
   Reveals
   -------------------------------------------------------------------------- */

function splitWords(el) {
  el.innerHTML = el.textContent
    .trim()
    .split(/\s+/)
    .map((word) => `<span class="word">${word}</span>`)
    .join(' ')
  return $$('.word', el)
}

function splitLetters(el) {
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment()
      for (const ch of node.textContent) {
        if (ch.trim() === '') {
          frag.append(ch)
        } else {
          const span = document.createElement('span')
          span.className = 'char'
          span.textContent = ch
          frag.append(span)
        }
      }
      node.replaceWith(frag)
    } else {
      node.classList.add('char')
    }
  })
  return $$('.char', el)
}

if (!reduceMotion) {
  // Hero intro
  gsap
    .timeline({ defaults: { ease: 'power4.out' } })
    .from('.hero__title .line > span', { yPercent: 115, duration: 1.3, stagger: 0.12 }, 0.15)
    .from('.hero__portrait', { autoAlpha: 0, scale: 1.06, duration: 1.8, ease: 'power2.out' }, 0)
    // .wa-tab and .fab stay out of this: their visibility belongs to the .is-footer class,
    // and a from() tween started on a page restored at the footer would pin them at 0
    .from('.nav > *, .hero__socials li, .hero__scroll', { autoAlpha: 0, duration: 1, stagger: 0.05 }, 0.6)
    .from('.hero__rail', { scaleY: 0, transformOrigin: 'top', duration: 1.2 }, 0.6)

  // Hero drifts away under the dark curve
  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    })
    .to('.hero__title', { yPercent: -35 }, 0)
    .to('.hero__portrait img', { yPercent: 12 }, 0)

  // "scroll down" stays visible until the curve rises up to meet it
  gsap.to('.hero__scroll', {
    autoAlpha: 0,
    ease: 'power2.in',
    scrollTrigger: {
      trigger: '.dark',
      start: 'top 70%',
      end: 'top 35%',
      scrub: true,
    },
  })

  // About statement lights up word by word
  $$('[data-words]').forEach((el) => {
    gsap.fromTo(
      splitWords(el),
      { opacity: 0.16 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: 0.6 },
      }
    )
  })

  // Generic fade-up
  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 48,
      autoAlpha: 0,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    })
  })

  // Timeline entries
  gsap.from('.xp__title', {
    autoAlpha: 0,
    y: 30,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.xp__title', start: 'top 85%', once: true },
  })

  $$('.xp__body').forEach((body) => {
    gsap.from(body.children, {
      y: 40,
      autoAlpha: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: body, start: 'top 82%', once: true },
    })
  })

  // Footer name rises letter by letter
  $$('[data-letters]').forEach((el) => {
    gsap.from(splitLetters(el), {
      yPercent: 100,
      duration: 1.2,
      ease: 'power4.out',
      stagger: 0.04,
      scrollTrigger: { trigger: el.parentElement, start: 'top 96%', once: true },
    })
  })
}

/* --------------------------------------------------------------------------
   Cursor follower (fine pointers only)
   -------------------------------------------------------------------------- */

const cursor = $('.cursor')

if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const moveX = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' })
  const moveY = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' })

  window.addEventListener(
    'mousemove',
    (e) => {
      gsap.set(cursor, { x: e.clientX, y: e.clientY, opacity: 1 })
    },
    { once: true }
  )

  window.addEventListener('mousemove', (e) => {
    moveX(e.clientX)
    moveY(e.clientY)
  })

  $$('a, button').forEach((el) => {
    el.addEventListener('mouseenter', () => gsap.to(cursor, { scale: 1.8, duration: 0.3 }))
    el.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 1, duration: 0.3 }))
  })
}

/* --------------------------------------------------------------------------
   Layout shifts (webfont swap, late images) move every trigger
   -------------------------------------------------------------------------- */

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh())
}

window.addEventListener('load', () => ScrollTrigger.refresh())
