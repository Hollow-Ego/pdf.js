/* Copyright 2013 Rob Wu <rob@robwu.nl>
 * https://github.com/Rob--W/grab-to-pan.js
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Construct a GrabToPan instance for a given HTML element.
 * @param options.element {Element}
 * @param options.ignoreTarget {function} optional. See `ignoreTarget(node)`
 * @param options.onActiveChanged {function(boolean)} optional. Called
 *  when grab-to-pan is (de)activated. The first argument is a boolean that
 *  shows whether grab-to-pan is activated.
 */
function GrabToPan(options) {
  this.element = options.element;
  this.document = options.element.ownerDocument;
  if (typeof options.ignoreTarget === "function") {
    this.ignoreTarget = options.ignoreTarget;
  }
  this.onActiveChanged = options.onActiveChanged;

  // Bind the contexts to ensure that `this` always points to
  // the GrabToPan instance.
  this.activate = this.activate.bind(this);
  this.deactivate = this.deactivate.bind(this);
  this.toggle = this.toggle.bind(this);
  this._onmousedown = this._onmousedown.bind(this);
  this._onmousemove = this._onmousemove.bind(this);
  this._endPan = this._endPan.bind(this);

  // This overlay will be inserted in the document when the mouse moves during
  // a grab operation, to ensure that the cursor has the desired appearance.
  const overlay = (this.overlay = document.createElement("div"));
  overlay.className = "grab-to-pan-grabbing";
}
GrabToPan.prototype = {
  /**
   * Class name of element which can be grabbed
   */
  CSS_CLASS_GRAB: "grab-to-pan-grab",

  /**
   * Bind a mousedown event to the element to enable grab-detection.
   */
  activate: function GrabToPan_activate() {
    if (!this.active) {
      this.active = true;
      this.element.addEventListener("mousedown", this._onmousedown, true);
      this.element.classList.add(this.CSS_CLASS_GRAB);
      if (this.onActiveChanged) {
        this.onActiveChanged(true);
      }
    }
  },

  /**
   * Removes all events. Any pending pan session is immediately stopped.
   */
  deactivate: function GrabToPan_deactivate() {
    if (this.active) {
      this.active = false;
      this.element.removeEventListener("mousedown", this._onmousedown, true);
      this._endPan();
      this.element.classList.remove(this.CSS_CLASS_GRAB);
      if (this.onActiveChanged) {
        this.onActiveChanged(false);
      }
    }
  },

  toggle: function GrabToPan_toggle() {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  },

  /**
   * Whether to not pan if the target element is clicked.
   * Override this method to change the default behaviour.
   *
   * @param node {Element} The target of the event
   * @returns {boolean} Whether to not react to the click event.
   */
  ignoreTarget: function GrabToPan_ignoreTarget(node) {
    // Use matchesSelector to check whether the clicked element
    // is (a child of) an input element / link
    return node[matchesSelector](
      "a[href], a[href] *, input, textarea, button, button *, select, option"
    );
  },

  /**
   * @private
   */
  _onmousedown: function GrabToPan__onmousedown(event) {
    if (event.button !== 0 || this.ignoreTarget(event.target)) {
      return;
    }
    if (event.originalTarget) {
      try {
        // eslint-disable-next-line no-unused-expressions
        event.originalTarget.tagName;
      } catch (e) {
        // Mozilla-specific: element is a scrollbar (XUL element)
        return;
      }
    }

    this.scrollLeftStart = this.element.scrollLeft;
    this.scrollTopStart = this.element.scrollTop;
    this.clientXStart = event.clientX;
    this.clientYStart = event.clientY;

    /* modified by ngx-extended-pdf-viewer #469 */
    if (isOverPerfectScrollbar(this.clientXStart, this.clientYStart, "ps__rail-x")) {
      return;
    }
    if (isOverPerfectScrollbar(this.clientXStart, this.clientYStart, "ps__rail-y")) {
      return;
    }
    /* end of modification */

    this.document.addEventListener("mousemove", this._onmousemove, true);
    this.document.addEventListener("mouseup", this._endPan, true);
    // When a scroll event occurs before a mousemove, assume that the user
    // dragged a scrollbar (necessary for Opera Presto, Safari and IE)
    // (not needed for Chrome/Firefox)
    this.element.addEventListener("scroll", this._endPan, true);
    event.preventDefault();
    event.stopPropagation();

    const focusedElement = document.activeElement;
    if (focusedElement && !focusedElement.contains(event.target)) {
      focusedElement.blur();
    }
  },

  /**
   * @private
   */
  _onmousemove: function GrabToPan__onmousemove(event) {
    this.element.removeEventListener("scroll", this._endPan, true);
    if (isLeftMouseReleased(event)) {
      this._endPan();
      return;
    }
    const xDiff = event.clientX - this.clientXStart;
    const yDiff = event.clientY - this.clientYStart;
    const scrollTop = this.scrollTopStart - yDiff;
    const scrollLeft = this.scrollLeftStart - xDiff;
    if (this.element.scrollTo) {
      this.element.scrollTo({
        top: scrollTop,
        left: scrollLeft,
        behavior: "instant",
      });
    } else {
      this.element.scrollTop = scrollTop;
      this.element.scrollLeft = scrollLeft;
    }
    if (!this.overlay.parentNode) {
      document.body.appendChild(this.overlay);
    }
  },

  /**
   * @private
   */
  _endPan: function GrabToPan__endPan() {
    this.element.removeEventListener("scroll", this._endPan, true);
    this.document.removeEventListener("mousemove", this._onmousemove, true);
    this.document.removeEventListener("mouseup", this._endPan, true);
    // Note: ChildNode.remove doesn't throw if the parentNode is undefined.
    this.overlay.remove();
  },
};

// Get the correct (vendor-prefixed) name of the matches method.
let matchesSelector;
["webkitM", "mozM", "msM", "oM", "m"].some(function (prefix) {
  let name = prefix + "atches";
  if (name in document.documentElement) {
    matchesSelector = name;
  }
  name += "Selector";
  if (name in document.documentElement) {
    matchesSelector = name;
  }
  return matchesSelector; // If found, then truthy, and [].some() ends.
});

// Browser sniffing because it's impossible to feature-detect
// whether event.which for onmousemove is reliable
const isNotIEorIsIE10plus = !document.documentMode || document.documentMode > 9;
const chrome = window.chrome;
const isChrome15OrOpera15plus = chrome && (chrome.webstore || chrome.app);
//                                         ^ Chrome 15+       ^ Opera 15+
const isSafari6plus =
  /Apple/.test(navigator.vendor) &&
  /Version\/([6-9]\d*|[1-5]\d+)/.test(navigator.userAgent);

/**
 * Whether the left mouse is not pressed.
 * @param event {MouseEvent}
 * @returns {boolean} True if the left mouse button is not pressed,
 *                    False if unsure or if the left mouse button is pressed.
 */
function isLeftMouseReleased(event) {
  if ("buttons" in event && isNotIEorIsIE10plus) {
    // http://www.w3.org/TR/DOM-Level-3-Events/#events-MouseEvent-buttons
    // Firefox 15+
    // Internet Explorer 10+
    return !(event.buttons & 1);
  }
  if (isChrome15OrOpera15plus || isSafari6plus) {
    // Chrome 14+
    // Opera 15+
    // Safari 6.0+
    return event.which === 0;
  }
  return false;
}

/* modified by ngx-extended-pdf-viewer #469 */
function isOverPerfectScrollbar(x, y, divName) {
  const  perfectScrollbar = document.getElementsByClassName(divName);
  if (perfectScrollbar && perfectScrollbar.length === 1) {
    var {top, right, bottom, left} = perfectScrollbar[0].getBoundingClientRect();
    if (y >= top && y <= bottom) {
      if (x <= right && x >= left) {
        console.log("over scrollbar");
        return true;
      }
    }
  }
  console.log("out of scrollbar");
  return false;
}

/* end of modification */

export { GrabToPan };
