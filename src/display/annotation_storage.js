/* Copyright 2020 Mozilla Foundation
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

import { objectFromMap, unreachable } from "../shared/util.js";
import { AnnotationEditor } from "./editor/editor.js";
import { MurmurHash3_64 } from "../shared/murmurhash3.js";

/**
 * Key/value storage for annotation data in forms.
 */
class AnnotationStorage {
  constructor() {
    this._storage = new Map();
    this._modified = false;

    // Callbacks to signal when the modification state is set or reset.
    // This is used by the viewer to only bind on `beforeunload` if forms
    // are actually edited to prevent doing so unconditionally since that
    // can have undesirable effects.
    this.onSetModified = null;
    this.onResetModified = null;
    this.onAnnotationEditor = null;
  }

  /**
   * Get the value for a given key if it exists, or return the default value.
   *
   * @public
   * @memberof AnnotationStorage
   * @param {string} key
   * @param {string} fieldName name of the input field
   * @param {Object} defaultValue
   * @returns {Object}
   */
  // #718 modified by ngx-extended-pdf-viewer
  getValue(key, fieldname, defaultValue, radioButtonField = undefined) {
    let obj = this._storage.get(key);
    if (obj === undefined) {
      if (window.getFormValue) {
        window.assignFormIdAndFieldName(key, fieldname, radioButtonField);
        // necessary because radio buttons don't have a reference to their field
        const ngObj = window.getFormValue(fieldname);
        if (ngObj !== undefined && ngObj.value !== undefined) {
          if (radioButtonField) {
            const value = { value: ngObj.value === radioButtonField };
            obj = value;
          } else {
            obj = ngObj;
          }
          // ngx-extended-pdf-viewer #1054 consider values from
          // window.getFormValues as default value
          this.setValue(key, undefined, obj, undefined, true); // second parameter is undefined to prevent infinite loops
        }
        if (obj === undefined && defaultValue !== undefined && defaultValue.value !== undefined && defaultValue.value !== "") {
          // send the pre-filled form value to Angular via (formDataChange)
          if (radioButtonField) {
            if (defaultValue.value) {
              window.setFormValue(fieldname, radioButtonField);
            }
          } else {
            window.setFormValue(fieldname, defaultValue.value);
          }
        }
      }
    }
    // #718 end of modification by ngx-extended-pdf-viewer
    if (obj === undefined) {
      return defaultValue;
    }
    return Object.assign(defaultValue, obj);
  }

  /**
   * Get the value for a given key.
   *
   * @public
   * @memberof AnnotationStorage
   * @param {string} key
   * @returns {Object}
   */
  getRawValue(key) {
    return this._storage.get(key);
  }

  /**
   * Remove a value from the storage.
   * @param {string} key
   */
  remove(key) {
    this._storage.delete(key);

    if (this._storage.size === 0) {
      this.resetModified();
    }

    if (typeof this.onAnnotationEditor === "function") {
      for (const value of this._storage.values()) {
        if (value instanceof AnnotationEditor) {
          return;
        }
      }
      this.onAnnotationEditor(null);
    }
  }

  /**
   * Set the value for a given key
   *
   * @public
   * @memberof AnnotationStorage
   * @param {string} key
   * @param {string} fieldName name of the input field
   * @param {Object} value
   */
  // #718, #1054 modified by ngx-extended-pdf-viewer
  setValue(key, fieldname, value, radioButtonField = undefined, isDefaultValue = false) {
    // #718 end of modification by ngx-extended-pdf-viewer
    const obj = this._storage.get(key);
    let modified = false;
    if (obj !== undefined) {
      for (const [entry, val] of Object.entries(value)) {
        if (
          entry !== "radioValue" && // #718 modified by ngx-extended-pdf-viewer
          entry !== "emitMessage" && // #718 modified by ngx-extended-pdf-viewer
          obj[entry] !== val
        ) {
          modified = true;
          obj[entry] = val;
        }
      }
    } else {
      // #1054 modified by ngx-extended-pdf-viewer
      if (!isDefaultValue) {
        modified = true;
      }
      // #1054 end of modification by ngx-extended-pdf-viewer
      this._storage.set(key, value);
    }
    if (modified) {
      this.#setModified();
      // #718 modified by ngx-extended-pdf-viewer
      if (fieldname?.constructor.name !== "FreeTextEditor") {
        if (fieldname || radioButtonField) {
          if (window.setFormValue) {
            if (value.items) {
              window.setFormValue(fieldname, value.items);
            } else if (value.emitMessage === false) {
              // ignore this field
            } else if (value.radioValue) {
              window.setFormValue(fieldname, value.radioValue);
            } else if (value.exportValue) { // #1183 modified by ngx-extended-pdf-viewer
              window.setFormValue(fieldname, value.exportValue);
            } else {
              for (const val of Object.values(value)) {
                window.setFormValue(fieldname, val);
              }
            }
          }
        }
      }
      // #718 end of modification by ngx-extended-pdf-viewer
    }

    if (
      value instanceof AnnotationEditor &&
      typeof this.onAnnotationEditor === "function"
    ) {
      this.onAnnotationEditor(value.constructor._type);
    }
  }

  /**
   * Check if the storage contains the given key.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this._storage.has(key);
  }

  getAll() {
    return this._storage.size > 0 ? objectFromMap(this._storage) : null;
  }

  get size() {
    return this._storage.size;
  }

  #setModified() {
    if (!this._modified) {
      this._modified = true;
      if (typeof this.onSetModified === "function") {
        this.onSetModified();
      }
    }
  }

  resetModified() {
    if (this._modified) {
      this._modified = false;
      if (typeof this.onResetModified === "function") {
        this.onResetModified();
      }
    }
  }

  /**
   * @returns {PrintAnnotationStorage}
   */
  get print() {
    return new PrintAnnotationStorage(this);
  }

  /**
   * PLEASE NOTE: Only intended for usage within the API itself.
   * @ignore
   */
  get serializable() {
    if (this._storage.size === 0) {
      return null;
    }
    const clone = new Map();

    for (const [key, val] of this._storage) {
      const serialized =
        val instanceof AnnotationEditor ? val.serialize() : val;
      if (serialized) {
        clone.set(key, serialized);
      }
    }
    return clone;
  }

  /**
   * PLEASE NOTE: Only intended for usage within the API itself.
   * @ignore
   */
  static getHash(map) {
    if (!map) {
      return "";
    }
    const hash = new MurmurHash3_64();

    for (const [key, val] of map) {
      hash.update(`${key}:${JSON.stringify(val)}`);
    }
    return hash.hexdigest();
  }
}

/**
 * A special `AnnotationStorage` for use during printing, where the serializable
 * data is *frozen* upon initialization, to prevent scripting from modifying its
 * contents. (Necessary since printing is triggered synchronously in browsers.)
 */
class PrintAnnotationStorage extends AnnotationStorage {
  #serializable = null;

  constructor(parent) {
    super();
    // Create a *copy* of the data, since Objects are passed by reference in JS.
    this.#serializable = structuredClone(parent.serializable);
  }

  /**
   * @returns {PrintAnnotationStorage}
   */
  // eslint-disable-next-line getter-return
  get print() {
    unreachable("Should not call PrintAnnotationStorage.print");
  }

  /**
   * PLEASE NOTE: Only intended for usage within the API itself.
   * @ignore
   */
  get serializable() {
    return this.#serializable;
  }
}

export { AnnotationStorage, PrintAnnotationStorage };
