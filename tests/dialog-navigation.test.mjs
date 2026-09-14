import assert from "node:assert/strict";
import test from "node:test";
import { initializeDialogNavigation } from "../src/scripts/dialog-navigation.js";

for (const count of [4, 5]) {
  test(`dialog navigation manages ${count} panels without wrapping`, () => {
    const node = () => ({
      events: new Map(),
      classList: { toggle() {} },
      setAttribute(name, value) { this[name] = value; },
      addEventListener(type, callback) { this.events.set(type, callback); },
      scrollIntoView() {},
      focus() { this.focused = true; }
    });
    const dialog = { ...node(), open: true };
    const tabs = Array.from({ length: count }, node);
    const panels = Array.from({ length: count }, node);
    const previous = node();
    const next = node();
    const progress = node();
    const content = { scrollTop: 100 };
    const navigation = initializeDialogNavigation({
      dialog, tabs, panels, previous, next, progress, content
    });
    assert.equal(progress.textContent, `1 / ${count}`);
    assert.ok(previous.disabled);
    tabs[count - 1].events.get("click")();
    assert.ok(next.disabled);
    next.events.get("click")();
    assert.equal(progress.textContent, `${count} / ${count}`);
    assert.equal(tabs[count - 1]["aria-selected"], "true");
    assert.equal(tabs[0].tabIndex, -1);
    const event = {
      key: "ArrowLeft", target: { closest: () => null },
      preventDefault() {}, stopPropagation() {}
    };
    tabs[count - 1].events.get("keydown")(event);
    assert.ok(tabs[count - 2].focused);
    assert.equal(progress.textContent, `${count - 1} / ${count}`);
    dialog.events.get("keydown")({ ...event, target: { closest: () => ({}) } });
    assert.equal(progress.textContent, `${count - 1} / ${count}`);
    dialog.events.get("keydown")(event);
    assert.equal(progress.textContent, `${count - 2} / ${count}`);
    navigation.reset();
    assert.equal(progress.textContent, `1 / ${count}`);
    assert.equal(content.scrollTop, 0);
    assert.ok(!panels[0].hidden);
    assert.ok(panels.slice(1).every(panel => panel.hidden));
  });
}
