/* eslint-disable sort-imports */
/* Copyright 2016 Mozilla Foundation
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

 // #2687 modified by ngx-extended-pdf-viewer (applies to the entire file)
 // the modification allows for a unified bundle (pdf.js + viewer.js merged into a single file)

import {
  AbortException,
  AnnotationEditorParamsType,
  AnnotationEditorType,
  AnnotationMode,
  CMapCompressionType,
  createValidAbsoluteUrl,
  FeatureTest,
  ImageKind,
  InvalidPDFException,
  normalizeUnicode,
  OPS,
  PasswordResponses,
  PermissionFlag,
  shadow,
  UnexpectedResponseException,
  Util,
  VerbosityLevel,
} from "../src/shared/util.js";

import { build, getDocument } from "../src/display/api.js";
import { getFilenameFromUrl, getPdfFilenameFromUrl, isDataScheme, isPdfFile, noContextMenu } from "../src/display/display_utils.js";

import {
  fetchData,
  getXfaPageViewport,
  DOMSVGFactory,
  GlobalWorkerOptions,
  OutputScale,
  PDFDataRangeTransport,
  PDFDateString,
  PDFWorker,
  PixelsPerInch,
  RenderingCancelledException,
  setLayerDimensions,
  version,
  AnnotationEditorLayer,
  AnnotationEditorUIManager,
  AnnotationLayer,
  ColorPicker,
  DrawLayer,
  MissingPDFException,
  TextLayer,
  XfaLayer,
} from "../src/pdf.js";

export {
  AbortException,
  AnnotationEditorLayer,
  AnnotationEditorParamsType,
  AnnotationEditorType,
  AnnotationEditorUIManager,
  AnnotationLayer,
  AnnotationMode,
  build,
  CMapCompressionType,
  ColorPicker,
  createValidAbsoluteUrl,
  DOMSVGFactory,
  DrawLayer,
  FeatureTest,
  fetchData,
  getDocument,
  getFilenameFromUrl,
  getPdfFilenameFromUrl,
  getXfaPageViewport,
  GlobalWorkerOptions,
  ImageKind,
  InvalidPDFException,
  isDataScheme,
  isPdfFile,
  MissingPDFException,
  noContextMenu,
  normalizeUnicode,
  OPS,
  OutputScale,
  PasswordResponses,
  PDFDataRangeTransport,
  PDFDateString,
  PDFWorker,
  PermissionFlag,
  PixelsPerInch,
  RenderingCancelledException,
  setLayerDimensions,
  shadow,
  TextLayer,
  UnexpectedResponseException,
  Util,
  VerbosityLevel,
  version,
  XfaLayer,
};
