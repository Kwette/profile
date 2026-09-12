import assert from "node:assert/strict";
import test from "node:test";
import { initializeTechnicalCarousel } from "../src/scripts/technical-carousel.js";

function node() {
  const attributes = new Map();
  const classes = new Set();
  const listeners = new Map();
  return {
    dataset: {}, children: [], textContent: "",
    style: { setProperty() {}, removeProperty() {} },
    classList: {
      add: value => classes.add(value),
      toggle(value, enabled) { if (enabled) classes.add(value); else classes.delete(value); },
      contains: value => classes.has(value)
    },
    setAttribute: (key, value) => attributes.set(key, String(value)),
    getAttribute: key => attributes.get(key),
    toggleAttribute(key, enabled) {
      if (enabled) attributes.set(key, ""); else attributes.delete(key);
    },
    hasAttribute: key => attributes.has(key),
    addEventListener(key, callback) { listeners.set(key, callback); },
    dispatch(key, event = {}) { listeners.get(key)?.(event); },
    appendChild(child) { this.children.push(child); }
  };
}

function fixture(count = 4) {
  const carousel = node();
  carousel.dataset = {
    topicLabel: "Sujet", positionSeparator: "sur",
    slideRoleDescription: "slide", directLabel: "Afficher le sujet"
  };
  const viewport = node();
  const previous = node();
  const next = node();
  const indicators = node();
  const announcement = node();
  const controls = node();
  controls.hidden = true;
  const slides = Array.from({ length: count }, (_, index) => {
    const slide = node();
    slide.querySelector = () => ({ textContent: `Title ${index + 1}` });
    return slide;
  });
  const elements = new Map([
    [".technical-carousel-viewport", viewport], [".technical-focus-grid", node()],
    [".technical-carousel-controls", controls], ["[data-carousel-previous]", previous],
    ["[data-carousel-next]", next], ["[data-carousel-announcement]", announcement],
    ["[data-carousel-indicators]", indicators]
  ]);
  carousel.querySelector = selector => elements.get(selector);
  carousel.querySelectorAll = () => slides;
  carousel.closest = () => ({ getAttribute: () => "focus-title" });
  initializeTechnicalCarousel(carousel);
  const activeIndex = () => slides.findIndex(slide => slide.classList.contains("is-active"));
  return { carousel, viewport, previous, next, indicators, announcement, controls, slides, activeIndex };
}

test("technical carousel interactions", async t => {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  globalThis.document = { createElement: node };
  t.after(() => {
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
    else delete globalThis.document;
  });

  await t.test("initial state and arrows enforce boundaries without looping", () => {
    const f = fixture();
    assert.equal(f.activeIndex(), 0);
    assert.ok(f.previous.disabled);
    assert.ok(!f.next.disabled);
    assert.ok(!f.controls.hidden);
    assert.equal(f.announcement.textContent, "");
    for (let i = 0; i < 5; i++) f.next.dispatch("click");
    assert.equal(f.activeIndex(), 3);
    assert.ok(f.next.disabled);
    for (let i = 0; i < 5; i++) f.previous.dispatch("click");
    assert.equal(f.activeIndex(), 0);
  });

  await t.test("direct navigation updates a single active slide and accessibility state", () => {
    const f = fixture();
    f.indicators.children[2].dispatch("click");
    assert.equal(f.activeIndex(), 2);
    assert.equal(f.announcement.textContent, "Sujet 3 sur 4");
    f.slides.forEach((slide, index) => {
      assert.equal(slide.getAttribute("aria-hidden"), String(index !== 2));
      assert.equal(slide.hasAttribute("inert"), index !== 2);
      assert.equal(f.indicators.children[index].getAttribute("aria-current"), String(index === 2));
    });
  });

  await t.test("keyboard arrows navigate and unrelated keys remain untouched", () => {
    const f = fixture();
    let prevented = 0;
    const key = value => f.carousel.dispatch("keydown", {
      key: value, preventDefault() { prevented++; }
    });
    key("ArrowRight");
    assert.equal(f.activeIndex(), 1);
    key("ArrowLeft");
    assert.equal(f.activeIndex(), 0);
    key("Enter");
    assert.equal(prevented, 2);
  });

  await t.test("swipe respects distance, direction, cancellation and input type", () => {
    const f = fixture();
    const pointer = (type, x, pointerType = "touch") =>
      f.viewport.dispatch(type, { clientX: x, pointerType });
    pointer("pointerdown", 150);
    pointer("pointerup", 110);
    assert.equal(f.activeIndex(), 0);
    pointer("pointerdown", 150);
    pointer("pointerup", 50);
    assert.equal(f.activeIndex(), 1);
    pointer("pointerdown", 50);
    pointer("pointerup", 150);
    assert.equal(f.activeIndex(), 0);
    pointer("pointerdown", 150);
    f.viewport.dispatch("pointercancel");
    pointer("pointerup", 50);
    pointer("pointerdown", 150, "mouse");
    pointer("pointerup", 50, "mouse");
    assert.equal(f.activeIndex(), 0);
  });

  await t.test("a single slide does not enable carousel controls", () => {
    const f = fixture(1);
    assert.ok(f.controls.hidden);
    assert.equal(f.indicators.children.length, 0);
    assert.ok(!f.carousel.classList.contains("is-carousel-ready"));
  });
});
