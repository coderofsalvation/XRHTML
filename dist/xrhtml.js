import * as THREE from 'three';
import { Vector3, Quaternion, Matrix4, Object3D, Mesh, PlaneGeometry, MeshBasicMaterial, CanvasTexture, sRGBEncoding, LinearFilter } from 'three';

var __awaiter$5 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const WOFF = 'application/font-woff';
const JPEG = 'image/jpeg';
const mimes = {
    woff: WOFF,
    woff2: WOFF,
    ttf: 'application/font-truetype',
    eot: 'application/vnd.ms-fontobject',
    png: 'image/png',
    jpg: JPEG,
    jpeg: JPEG,
    gif: 'image/gif',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
};
function getExtension(url) {
    const match = /\.([^./]*?)$/g.exec(url);
    return match ? match[1] : '';
}
function getMimeType(url) {
    const extension = getExtension(url).toLowerCase();
    return mimes[extension] || '';
}
function resolveUrl(url, baseUrl) {
    // url is absolute already
    if (url.match(/^[a-z]+:\/\//i)) {
        return url;
    }
    // url is absolute already, without protocol
    if (url.match(/^\/\//)) {
        return window.location.protocol + url;
    }
    // dataURI, mailto:, tel:, etc.
    if (url.match(/^[a-z]+:/i)) {
        return url;
    }
    const doc = document.implementation.createHTMLDocument();
    const base = doc.createElement('base');
    const a = doc.createElement('a');
    doc.head.appendChild(base);
    doc.body.appendChild(a);
    if (baseUrl) {
        base.href = baseUrl;
    }
    a.href = url;
    return a.href;
}
function isDataUrl(url) {
    return url.search(/^(data:)/) !== -1;
}
function makeDataUrl(content, mimeType) {
    return `data:${mimeType};base64,${content}`;
}
function parseDataUrlContent(dataURL) {
    return dataURL.split(/,/)[1];
}
const uuid = (function uuid() {
    // generate uuid for className of pseudo elements.
    // We should not use GUIDs, otherwise pseudo elements sometimes cannot be captured.
    let counter = 0;
    // ref: http://stackoverflow.com/a/6248722/2519373
    const random = () => 
    // eslint-disable-next-line no-bitwise
    `0000${((Math.random() * Math.pow(36, 4)) << 0).toString(36)}`.slice(-4);
    return () => {
        counter += 1;
        return `u${random()}${counter}`;
    };
})();
function toArray(arrayLike) {
    const arr = [];
    for (let i = 0, l = arrayLike.length; i < l; i += 1) {
        arr.push(arrayLike[i]);
    }
    return arr;
}
function px(node, styleProperty) {
    const val = window.getComputedStyle(node).getPropertyValue(styleProperty);
    return parseFloat(val.replace('px', ''));
}
function getNodeWidth(node) {
    const leftBorder = px(node, 'border-left-width');
    const rightBorder = px(node, 'border-right-width');
    return node.clientWidth + leftBorder + rightBorder;
}
function getNodeHeight(node) {
    const topBorder = px(node, 'border-top-width');
    const bottomBorder = px(node, 'border-bottom-width');
    return node.clientHeight + topBorder + bottomBorder;
}
function getPixelRatio() {
    let ratio;
    let FINAL_PROCESS;
    try {
        FINAL_PROCESS = process;
    }
    catch (e) {
        // pass
    }
    const val = FINAL_PROCESS && FINAL_PROCESS.env
        ? FINAL_PROCESS.env.devicePixelRatio
        : null;
    if (val) {
        ratio = parseInt(val, 10);
        if (Number.isNaN(ratio)) {
            ratio = 1;
        }
    }
    return ratio || window.devicePixelRatio || 1;
}
function createImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.crossOrigin = 'anonymous';
        img.decoding = 'sync';
        img.src = url;
    });
}
function svgToDataURL(svg) {
    return __awaiter$5(this, void 0, void 0, function* () {
        return Promise.resolve()
            .then(() => new XMLSerializer().serializeToString(svg))
            .then(encodeURIComponent)
            .then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
    });
}
function nodeToDataURL(node, width, height) {
    return __awaiter$5(this, void 0, void 0, function* () {
        const xmlns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(xmlns, 'svg');
        const foreignObject = document.createElementNS(xmlns, 'foreignObject');
        svg.setAttribute('width', `${width}`);
        svg.setAttribute('height', `${height}`);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        foreignObject.setAttribute('width', '100%');
        foreignObject.setAttribute('height', '100%');
        foreignObject.setAttribute('x', '0');
        foreignObject.setAttribute('y', '0');
        foreignObject.setAttribute('externalResourcesRequired', 'true');
        svg.appendChild(foreignObject);
        foreignObject.appendChild(node);
        return svgToDataURL(svg);
    });
}

const cache = {};
function getCacheKey(url) {
    let key = url.replace(/\?.*/, '');
    // font resourse
    if (/ttf|otf|eot|woff2?/i.test(key)) {
        key = key.replace(/.*\//, '');
    }
    return key;
}
function getBlobFromURL(url, options) {
    const cacheKey = getCacheKey(url);
    if (cache[cacheKey] != null) {
        return cache[cacheKey];
    }
    // cache bypass so we dont have CORS issues with cached images
    // ref: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
    if (options.cacheBust) {
        // eslint-disable-next-line no-param-reassign
        url += (/\?/.test(url) ? '&' : '?') + new Date().getTime();
    }
    const failed = (reason) => {
        let placeholder = '';
        if (options.imagePlaceholder) {
            const parts = options.imagePlaceholder.split(/,/);
            if (parts && parts[1]) {
                placeholder = parts[1];
            }
        }
        let msg = `Failed to fetch resource: ${url}`;
        if (reason) {
            msg = typeof reason === 'string' ? reason : reason.message;
        }
        if (msg) {
            console.error(msg);
        }
        return {
            blob: placeholder,
            contentType: '',
        };
    };
    const deferred = window
        .fetch(url)
        .then((res) => 
    // eslint-disable-next-line promise/no-nesting
    res.blob().then((blob) => ({
        blob,
        contentType: res.headers.get('Content-Type') || '',
    })))
        .then(({ blob, contentType }) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({
            contentType,
            blob: reader.result,
        });
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    }))
        .then(({ blob, contentType }) => ({
        contentType,
        blob: parseDataUrlContent(blob),
    }))
        // on failed
        .catch(failed);
    // cache result
    cache[cacheKey] = deferred;
    return deferred;
}

function formatCSSText(style) {
    const content = style.getPropertyValue('content');
    return `${style.cssText} content: '${content.replace(/'|"/g, '')}';`;
}
function formatCSSProperties(style) {
    return toArray(style)
        .map((name) => {
        const value = style.getPropertyValue(name);
        const priority = style.getPropertyPriority(name);
        return `${name}: ${value}${priority ? ' !important' : ''};`;
    })
        .join(' ');
}
function getPseudoElementStyle(className, pseudo, style) {
    const selector = `.${className}:${pseudo}`;
    const cssText = style.cssText
        ? formatCSSText(style)
        : formatCSSProperties(style);
    return document.createTextNode(`${selector}{${cssText}}`);
}
function clonePseudoElement(nativeNode, clonedNode, pseudo) {
    const style = window.getComputedStyle(nativeNode, pseudo);
    const content = style.getPropertyValue('content');
    if (content === '' || content === 'none') {
        return;
    }
    const className = uuid();
    try {
        clonedNode.className = `${clonedNode.className} ${className}`;
    }
    catch (err) {
        return;
    }
    const styleElement = document.createElement('style');
    styleElement.appendChild(getPseudoElementStyle(className, pseudo, style));
    clonedNode.appendChild(styleElement);
}
function clonePseudoElements(nativeNode, clonedNode) {
    clonePseudoElement(nativeNode, clonedNode, ':before');
    clonePseudoElement(nativeNode, clonedNode, ':after');
}

var __awaiter$4 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function cloneCanvasElement(node) {
    return __awaiter$4(this, void 0, void 0, function* () {
        const dataURL = node.toDataURL();
        if (dataURL === 'data:,') {
            return Promise.resolve(node.cloneNode(false));
        }
        return createImage(dataURL);
    });
}
function cloneVideoElement(node, options) {
    return __awaiter$4(this, void 0, void 0, function* () {
        return Promise.resolve(node.poster)
            .then((url) => getBlobFromURL(url, options))
            .then((data) => makeDataUrl(data.blob, getMimeType(node.poster) || data.contentType))
            .then((dataURL) => createImage(dataURL));
    });
}
function cloneSingleNode(node, options) {
    return __awaiter$4(this, void 0, void 0, function* () {
        if (node instanceof HTMLCanvasElement) {
            return cloneCanvasElement(node);
        }
        if (node instanceof HTMLVideoElement && node.poster) {
            return cloneVideoElement(node, options);
        }
        return Promise.resolve(node.cloneNode(false));
    });
}
const isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === 'SLOT';
function cloneChildren(nativeNode, clonedNode, options) {
    var _a;
    return __awaiter$4(this, void 0, void 0, function* () {
        const children = isSlotElement(nativeNode) && nativeNode.assignedNodes
            ? toArray(nativeNode.assignedNodes())
            : toArray(((_a = nativeNode.shadowRoot) !== null && _a !== void 0 ? _a : nativeNode).childNodes);
        if (children.length === 0 || nativeNode instanceof HTMLVideoElement) {
            return Promise.resolve(clonedNode);
        }
        return children
            .reduce((deferred, child) => deferred
            // eslint-disable-next-line no-use-before-define
            .then(() => cloneNode(child, options))
            .then((clonedChild) => {
            // eslint-disable-next-line promise/always-return
            if (clonedChild) {
                clonedNode.appendChild(clonedChild);
            }
        }), Promise.resolve())
            .then(() => clonedNode);
    });
}
function cloneCSSStyle(nativeNode, clonedNode) {
    const source = window.getComputedStyle(nativeNode);
    const target = clonedNode.style;
    if (!target) {
        return;
    }
    if (source.cssText) {
        target.cssText = source.cssText;
    }
    else {
        toArray(source).forEach((name) => {
            target.setProperty(name, source.getPropertyValue(name), source.getPropertyPriority(name));
        });
    }
}
function cloneInputValue(nativeNode, clonedNode) {
    if (nativeNode instanceof HTMLTextAreaElement) {
        clonedNode.innerHTML = nativeNode.value;
    }
    if (nativeNode instanceof HTMLInputElement) {
        clonedNode.setAttribute('value', nativeNode.value);
    }
}
function decorate(nativeNode, clonedNode) {
    return __awaiter$4(this, void 0, void 0, function* () {
        if (!(clonedNode instanceof Element)) {
            return Promise.resolve(clonedNode);
        }
        return Promise.resolve()
            .then(() => cloneCSSStyle(nativeNode, clonedNode))
            .then(() => clonePseudoElements(nativeNode, clonedNode))
            .then(() => cloneInputValue(nativeNode, clonedNode))
            .then(() => clonedNode);
    });
}
function cloneNode(node, options, isRoot) {
    return __awaiter$4(this, void 0, void 0, function* () {
        if (!isRoot && options.filter && !options.filter(node)) {
            return Promise.resolve(null);
        }
        return Promise.resolve(node)
            .then((clonedNode) => cloneSingleNode(clonedNode, options))
            .then((clonedNode) => cloneChildren(node, clonedNode, options))
            .then((clonedNode) => decorate(node, clonedNode));
    });
}

var __awaiter$3 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
const URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["'])([^"']+)\1\)/g;
const FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function toRegex(url) {
    // eslint-disable-next-line no-useless-escape
    const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
    return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, 'g');
}
function parseURLs(cssText) {
    const result = [];
    cssText.replace(URL_REGEX, (raw, quotation, url) => {
        result.push(url);
        return raw;
    });
    return result.filter((url) => !isDataUrl(url));
}
function embed(cssText, resourceURL, baseURL, options, get) {
    const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
    return Promise.resolve(resolvedURL)
        .then((url) => get ? get(url) : getBlobFromURL(url, options))
        .then((data) => {
        if (typeof data === 'string') {
            return makeDataUrl(data, getMimeType(resourceURL));
        }
        return makeDataUrl(data.blob, getMimeType(resourceURL) || data.contentType);
    })
        .then((dataURL) => cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`))
        .then((content) => content, () => resolvedURL);
}
function filterPreferredFontFormat(str, { preferredFontFormat }) {
    return !preferredFontFormat
        ? str
        : str.replace(FONT_SRC_REGEX, (match) => {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const [src, , format] = URL_WITH_FORMAT_REGEX.exec(match) || [];
                if (!format) {
                    return '';
                }
                if (format === preferredFontFormat) {
                    return `src: ${src};`;
                }
            }
        });
}
function shouldEmbed(url) {
    return url.search(URL_REGEX) !== -1;
}
function embedResources(cssText, baseUrl, options) {
    return __awaiter$3(this, void 0, void 0, function* () {
        if (!shouldEmbed(cssText)) {
            return Promise.resolve(cssText);
        }
        const filteredCSSText = filterPreferredFontFormat(cssText, options);
        return Promise.resolve(filteredCSSText)
            .then(parseURLs)
            .then((urls) => urls.reduce((deferred, url) => 
        // eslint-disable-next-line promise/no-nesting
        deferred.then((css) => embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText)));
    });
}

var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function embedBackground(clonedNode, options) {
    var _a;
    return __awaiter$2(this, void 0, void 0, function* () {
        const background = (_a = clonedNode.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue('background');
        if (!background) {
            return Promise.resolve(clonedNode);
        }
        return Promise.resolve(background)
            .then((cssString) => embedResources(cssString, null, options))
            .then((cssString) => {
            clonedNode.style.setProperty('background', cssString, clonedNode.style.getPropertyPriority('background'));
            return clonedNode;
        });
    });
}
function embedImageNode(clonedNode, options) {
    return __awaiter$2(this, void 0, void 0, function* () {
        if (!(clonedNode instanceof HTMLImageElement && !isDataUrl(clonedNode.src)) &&
            !(clonedNode instanceof SVGImageElement &&
                !isDataUrl(clonedNode.href.baseVal))) {
            return Promise.resolve(clonedNode);
        }
        const src = clonedNode instanceof HTMLImageElement
            ? clonedNode.src
            : clonedNode.href.baseVal;
        return Promise.resolve(src)
            .then((url) => getBlobFromURL(url, options))
            .then((data) => makeDataUrl(data.blob, getMimeType(src) || data.contentType))
            .then((dataURL) => new Promise((resolve, reject) => {
            clonedNode.onload = resolve;
            clonedNode.onerror = reject;
            if (clonedNode instanceof HTMLImageElement) {
                clonedNode.srcset = '';
                clonedNode.src = dataURL;
            }
            else {
                clonedNode.href.baseVal = dataURL;
            }
        }))
            .then(() => clonedNode, () => clonedNode);
    });
}
function embedChildren(clonedNode, options) {
    return __awaiter$2(this, void 0, void 0, function* () {
        const children = toArray(clonedNode.childNodes);
        // eslint-disable-next-line no-use-before-define
        const deferreds = children.map((child) => embedImages(child, options));
        return Promise.all(deferreds).then(() => clonedNode);
    });
}
function embedImages(clonedNode, options) {
    return __awaiter$2(this, void 0, void 0, function* () {
        if (!(clonedNode instanceof Element)) {
            return Promise.resolve(clonedNode);
        }
        return Promise.resolve(clonedNode)
            .then((node) => embedBackground(node, options))
            .then((node) => embedImageNode(node, options))
            .then((node) => embedChildren(node, options));
    });
}

function applyStyleWithOptions(node, options) {
    const { style } = node;
    if (options.backgroundColor) {
        style.backgroundColor = options.backgroundColor;
    }
    if (options.width) {
        style.width = `${options.width}px`;
    }
    if (options.height) {
        style.height = `${options.height}px`;
    }
    const manual = options.style;
    if (manual != null) {
        Object.keys(manual).forEach((key) => {
            style[key] = manual[key];
        });
    }
    return node;
}

var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const cssFetchCache = {};
function fetchCSS(url) {
    const cache = cssFetchCache[url];
    if (cache != null) {
        return cache;
    }
    const deferred = window.fetch(url).then((res) => ({
        url,
        cssText: res.text(),
    }));
    cssFetchCache[url] = deferred;
    return deferred;
}
function embedFonts(meta) {
    return __awaiter$1(this, void 0, void 0, function* () {
        return meta.cssText.then((raw) => {
            let cssText = raw;
            const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
            const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
            const loadFonts = fontLocs.map((location) => {
                let url = location.replace(regexUrl, '$1');
                if (!url.startsWith('https://')) {
                    url = new URL(url, meta.url).href;
                }
                // eslint-disable-next-line promise/no-nesting
                return window
                    .fetch(url)
                    .then((res) => res.blob())
                    .then((blob) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        // Side Effect
                        cssText = cssText.replace(location, `url(${reader.result})`);
                        resolve([location, reader.result]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }));
            });
            // eslint-disable-next-line promise/no-nesting
            return Promise.all(loadFonts).then(() => cssText);
        });
    });
}
function parseCSS(source) {
    if (source == null) {
        return [];
    }
    const result = [];
    const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
    // strip out comments
    let cssText = source.replace(commentsRegex, '');
    const keyframesRegex = new RegExp('((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})', 'gi');
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const matches = keyframesRegex.exec(cssText);
        if (matches === null) {
            break;
        }
        result.push(matches[0]);
    }
    cssText = cssText.replace(keyframesRegex, '');
    const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
    // to match css & media queries together
    const combinedCSSRegex = '((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]' +
        '*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})';
    // unified regex
    const unifiedRegex = new RegExp(combinedCSSRegex, 'gi');
    // eslint-disable-next-line no-constant-condition
    while (true) {
        let matches = importRegex.exec(cssText);
        if (matches === null) {
            matches = unifiedRegex.exec(cssText);
            if (matches === null) {
                break;
            }
            else {
                importRegex.lastIndex = unifiedRegex.lastIndex;
            }
        }
        else {
            unifiedRegex.lastIndex = importRegex.lastIndex;
        }
        result.push(matches[0]);
    }
    return result;
}
function getCSSRules(styleSheets) {
    return __awaiter$1(this, void 0, void 0, function* () {
        const ret = [];
        const deferreds = [];
        // First loop inlines imports
        styleSheets.forEach((sheet) => {
            if ('cssRules' in sheet) {
                try {
                    toArray(sheet.cssRules).forEach((item, index) => {
                        if (item.type === CSSRule.IMPORT_RULE) {
                            let importIndex = index + 1;
                            const url = item.href;
                            const deferred = fetchCSS(url)
                                .then((metadata) => (metadata ? embedFonts(metadata) : ''))
                                .then((cssText) => parseCSS(cssText).forEach((rule) => {
                                try {
                                    sheet.insertRule(rule, rule.startsWith('@import')
                                        ? (importIndex += 1)
                                        : sheet.cssRules.length);
                                }
                                catch (error) {
                                    console.error('Error inserting rule from remote css', {
                                        rule,
                                        error,
                                    });
                                }
                            }))
                                .catch((e) => {
                                console.error('Error loading remote css', e.toString());
                            });
                            deferreds.push(deferred);
                        }
                    });
                }
                catch (e) {
                    const inline = styleSheets.find((a) => a.href == null) || document.styleSheets[0];
                    if (sheet.href != null) {
                        deferreds.push(fetchCSS(sheet.href)
                            .then((metadata) => (metadata ? embedFonts(metadata) : ''))
                            .then((cssText) => parseCSS(cssText).forEach((rule) => {
                            inline.insertRule(rule, sheet.cssRules.length);
                        }))
                            .catch((err) => {
                            console.error('Error loading remote stylesheet', err.toString());
                        }));
                    }
                    console.error('Error inlining remote css file', e.toString());
                }
            }
        });
        return Promise.all(deferreds).then(() => {
            // Second loop parses rules
            styleSheets.forEach((sheet) => {
                if ('cssRules' in sheet) {
                    try {
                        toArray(sheet.cssRules).forEach((item) => {
                            ret.push(item);
                        });
                    }
                    catch (e) {
                        console.error(`Error while reading CSS rules from ${sheet.href}`, e.toString());
                    }
                }
            });
            return ret;
        });
    });
}
function getWebFontRules(cssRules) {
    return cssRules
        .filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
        .filter((rule) => shouldEmbed(rule.style.getPropertyValue('src')));
}
function parseWebFontRules(node) {
    return __awaiter$1(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            if (node.ownerDocument == null) {
                reject(new Error('Provided element is not within a Document'));
            }
            resolve(toArray(node.ownerDocument.styleSheets));
        })
            .then((styleSheets) => getCSSRules(styleSheets))
            .then(getWebFontRules);
    });
}
function getWebFontCSS(node, options) {
    return __awaiter$1(this, void 0, void 0, function* () {
        return parseWebFontRules(node)
            .then((rules) => Promise.all(rules.map((rule) => {
            const baseUrl = rule.parentStyleSheet
                ? rule.parentStyleSheet.href
                : null;
            return embedResources(rule.cssText, baseUrl, options);
        })))
            .then((cssTexts) => cssTexts.join('\n'));
    });
}
function embedWebFonts(clonedNode, options) {
    return __awaiter$1(this, void 0, void 0, function* () {
        return (options.fontEmbedCSS != null
            ? Promise.resolve(options.fontEmbedCSS)
            : getWebFontCSS(clonedNode, options)).then((cssText) => {
            const styleNode = document.createElement('style');
            const sytleContent = document.createTextNode(cssText);
            styleNode.appendChild(sytleContent);
            if (clonedNode.firstChild) {
                clonedNode.insertBefore(styleNode, clonedNode.firstChild);
            }
            else {
                clonedNode.appendChild(styleNode);
            }
            return clonedNode;
        });
    });
}

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function getImageSize(node, options = {}) {
    const width = options.width || getNodeWidth(node);
    const height = options.height || getNodeHeight(node);
    return { width, height };
}
function toSvg(node, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const { width, height } = getImageSize(node, options);
        return Promise.resolve(node)
            .then((nativeNode) => cloneNode(nativeNode, options, true))
            .then((clonedNode) => embedWebFonts(clonedNode, options))
            .then((clonedNode) => embedImages(clonedNode, options))
            .then((clonedNode) => applyStyleWithOptions(clonedNode, options))
            .then((clonedNode) => nodeToDataURL(clonedNode, width, height));
    });
}
const dimensionCanvasLimit = 16384; // as per https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size
function checkCanvasDimensions(canvas) {
    if (canvas.width > dimensionCanvasLimit ||
        canvas.height > dimensionCanvasLimit) {
        if (canvas.width > dimensionCanvasLimit &&
            canvas.height > dimensionCanvasLimit) {
            if (canvas.width > canvas.height) {
                canvas.height *= dimensionCanvasLimit / canvas.width;
                canvas.width = dimensionCanvasLimit;
            }
            else {
                canvas.width *= dimensionCanvasLimit / canvas.height;
                canvas.height = dimensionCanvasLimit;
            }
        }
        else if (canvas.width > dimensionCanvasLimit) {
            canvas.height *= dimensionCanvasLimit / canvas.width;
            canvas.width = dimensionCanvasLimit;
        }
        else {
            canvas.width *= dimensionCanvasLimit / canvas.height;
            canvas.height = dimensionCanvasLimit;
        }
    }
}
function toCanvas(node, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        return toSvg(node, options)
            .then(createImage)
            .then((img) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const ratio = options.pixelRatio || getPixelRatio();
            const { width, height } = getImageSize(node, options);
            const canvasWidth = options.canvasWidth || width;
            const canvasHeight = options.canvasHeight || height;
            canvas.width = canvasWidth * ratio;
            canvas.height = canvasHeight * ratio;
            if (!options.skipAutoScale) {
                checkCanvasDimensions(canvas);
            }
            canvas.style.width = `${canvasWidth}`;
            canvas.style.height = `${canvasHeight}`;
            if (options.backgroundColor) {
                context.fillStyle = options.backgroundColor;
                context.fillRect(0, 0, canvas.width, canvas.height);
            }
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas;
        });
    });
}
function toPng(node, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        return toCanvas(node, options).then((canvas) => canvas.toDataURL());
    });
}

/**
 * Based on http://www.emagix.net/academic/mscs-project/item/camera-sync-with-css3-and-webgl-threejs
 */

const _position = new Vector3();
const _quaternion = new Quaternion();
const _scale = new Vector3();

class CSS3DObject extends Object3D {

	constructor( element = document.createElement( 'div' ) ) {

		super();

		this.element = element;
		this.element.style.position = 'absolute';
		this.element.style.pointerEvents = 'auto';
		this.element.style.userSelect = 'none';

		this.element.setAttribute( 'draggable', false );

		this.addEventListener( 'removed', function () {

			this.traverse( function ( object ) {

				if ( object.element instanceof Element && object.element.parentNode !== null ) {

					object.element.parentNode.removeChild( object.element );

				}

			} );

		} );

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.element = source.element.cloneNode( true );

		return this;

	}

}

CSS3DObject.prototype.isCSS3DObject = true;

class CSS3DSprite extends CSS3DObject {

	constructor( element ) {

		super( element );

		this.rotation2D = 0;

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.rotation2D = source.rotation2D;

		return this;

	}

}

CSS3DSprite.prototype.isCSS3DSprite = true;

//

const _matrix = new Matrix4();
const _matrix2 = new Matrix4();

class CSS3DRenderer {

	constructor( parameters = {} ) {

		const _this = this;

		let _width, _height;
		let _widthHalf, _heightHalf;

		const cache = {
			camera: { fov: 0, style: '' },
			objects: new WeakMap()
		};

		const domElement = parameters.element !== undefined ? parameters.element : document.createElement( 'div' );

		domElement.style.overflow = 'hidden';

		this.domElement = domElement;

		const cameraElement = document.createElement( 'div' );

		cameraElement.style.transformStyle = 'preserve-3d';
		cameraElement.style.pointerEvents = 'none';

		domElement.appendChild( cameraElement );

		this.getSize = function () {

			return {
				width: _width,
				height: _height
			};

		};

		this.render = function ( scene, camera ) {

			const fov = camera.projectionMatrix.elements[ 5 ] * _heightHalf;

			if ( cache.camera.fov !== fov ) {

				domElement.style.perspective = camera.isPerspectiveCamera ? fov + 'px' : '';
				cache.camera.fov = fov;

			}

			if ( scene.autoUpdate === true ) scene.updateMatrixWorld();
			if ( camera.parent === null ) camera.updateMatrixWorld();

			let tx, ty;

			if ( camera.isOrthographicCamera ) {

				tx = - ( camera.right + camera.left ) / 2;
				ty = ( camera.top + camera.bottom ) / 2;

			}

			const cameraCSSMatrix = camera.isOrthographicCamera ?
				'scale(' + fov + ')' + 'translate(' + epsilon( tx ) + 'px,' + epsilon( ty ) + 'px)' + getCameraCSSMatrix( camera.matrixWorldInverse ) :
				'translateZ(' + fov + 'px)' + getCameraCSSMatrix( camera.matrixWorldInverse );

			const style = cameraCSSMatrix +
				'translate(' + _widthHalf + 'px,' + _heightHalf + 'px)';

			if ( cache.camera.style !== style ) {

				cameraElement.style.transform = style;

				cache.camera.style = style;

			}

			renderObject( scene, scene, camera);

		};

		this.setSize = function ( width, height ) {

			_width = width;
			_height = height;
			_widthHalf = _width / 2;
			_heightHalf = _height / 2;

			domElement.style.width = width + 'px';
			domElement.style.height = height + 'px';

			cameraElement.style.width = width + 'px';
			cameraElement.style.height = height + 'px';

		};

		function epsilon( value ) {

			return Math.abs( value ) < 1e-10 ? 0 : value;

		}

		function getCameraCSSMatrix( matrix ) {

			const elements = matrix.elements;

			return 'matrix3d(' +
				epsilon( elements[ 0 ] ) + ',' +
				epsilon( - elements[ 1 ] ) + ',' +
				epsilon( elements[ 2 ] ) + ',' +
				epsilon( elements[ 3 ] ) + ',' +
				epsilon( elements[ 4 ] ) + ',' +
				epsilon( - elements[ 5 ] ) + ',' +
				epsilon( elements[ 6 ] ) + ',' +
				epsilon( elements[ 7 ] ) + ',' +
				epsilon( elements[ 8 ] ) + ',' +
				epsilon( - elements[ 9 ] ) + ',' +
				epsilon( elements[ 10 ] ) + ',' +
				epsilon( elements[ 11 ] ) + ',' +
				epsilon( elements[ 12 ] ) + ',' +
				epsilon( - elements[ 13 ] ) + ',' +
				epsilon( elements[ 14 ] ) + ',' +
				epsilon( elements[ 15 ] ) +
			')';

		}

		function getObjectCSSMatrix( matrix ) {

			const elements = matrix.elements;
			const matrix3d = 'matrix3d(' +
				epsilon( elements[ 0 ] ) + ',' +
				epsilon( elements[ 1 ] ) + ',' +
				epsilon( elements[ 2 ] ) + ',' +
				epsilon( elements[ 3 ] ) + ',' +
				epsilon( - elements[ 4 ] ) + ',' +
				epsilon( - elements[ 5 ] ) + ',' +
				epsilon( - elements[ 6 ] ) + ',' +
				epsilon( - elements[ 7 ] ) + ',' +
				epsilon( elements[ 8 ] ) + ',' +
				epsilon( elements[ 9 ] ) + ',' +
				epsilon( elements[ 10 ] ) + ',' +
				epsilon( elements[ 11 ] ) + ',' +
				epsilon( elements[ 12 ] ) + ',' +
				epsilon( elements[ 13 ] ) + ',' +
				epsilon( elements[ 14 ] ) + ',' +
				epsilon( elements[ 15 ] ) +
			')';

			return 'translate(-50%,-50%)' + matrix3d;

		}

		function renderObject( object, scene, camera, cameraCSSMatrix ) {

			if ( object.isCSS3DObject ) {

				const visible = ( object.visible === true ) && ( object.layers.test( camera.layers ) === true );
				object.element.style.display = ( visible === true ) ? '' : 'none';

				if ( visible === true ) {

					object.onBeforeRender( _this, scene, camera );

					let style;

					if ( object.isCSS3DSprite ) {

						// http://swiftcoder.wordpress.com/2008/11/25/constructing-a-billboard-matrix/

						_matrix.copy( camera.matrixWorldInverse );
						_matrix.transpose();

						if ( object.rotation2D !== 0 ) _matrix.multiply( _matrix2.makeRotationZ( object.rotation2D ) );

						object.matrixWorld.decompose( _position, _quaternion, _scale );
						_matrix.setPosition( _position );
						_matrix.scale( _scale );

						_matrix.elements[ 3 ] = 0;
						_matrix.elements[ 7 ] = 0;
						_matrix.elements[ 11 ] = 0;
						_matrix.elements[ 15 ] = 1;

						style = getObjectCSSMatrix( _matrix );

					} else {

						style = getObjectCSSMatrix( object.matrixWorld );

					}

					const element = object.element;
					const cachedObject = cache.objects.get( object );

					if ( cachedObject === undefined || cachedObject.style !== style ) {

						element.style.transform = style;

						const objectData = { style: style };
						cache.objects.set( object, objectData );

					}

					if ( element.parentNode !== cameraElement ) {

						cameraElement.appendChild( element );

					}

					object.onAfterRender( _this, scene, camera );

				}

			}

			for ( let i = 0, l = object.children.length; i < l; i ++ ) {

				renderObject( object.children[ i ], scene, camera);

			}

		}

	}

}

window.toPng = toPng;

class HTMLMesh extends Mesh {

	constructor( dom,opts, canvas ) {
		const texture = new HTMLTexture( dom, opts, canvas );

		const geometry = new PlaneGeometry( texture.image.width * 0.001, texture.image.height * 0.001 );
		const material = new MeshBasicMaterial( { map: texture, toneMapped: false } );


		super( geometry, material );

		function onEvent( event ) {

			material.map.dispatchDOMEvent( event );

		}

		this.addEventListener( 'mousedown', onEvent );
		this.addEventListener( 'mousemove', onEvent );
		this.addEventListener( 'mouseup', onEvent );
		this.addEventListener( 'click', onEvent );

		this.dispose = function () {

			geometry.dispose();
			material.dispose();

			material.map.dispose();

			this.removeEventListener( 'mousedown', onEvent );
			this.removeEventListener( 'mousemove', onEvent );
			this.removeEventListener( 'mouseup', onEvent );
			this.removeEventListener( 'click', onEvent );

		};

	}

}

class HTMLTexture extends CanvasTexture {

	constructor( dom,opts, canvas ) {
    super( canvas );
    this.dom = dom;
    this.opts = opts;
    this.refreshInterval = 64; 
    if( typeof window != 'undefined' && window.XRHTMLRefreshInterval )
      this.refreshInterval = window.XRHTMLRefreshInterval; 
    this.anisotropy = 16;
    this.encoding = sRGBEncoding;
    this.minFilter = LinearFilter;
    this.magFilter = LinearFilter;

    // Create an observer on the DOM, and run html2canvas update in the next loop
    const observer = new MutationObserver( () => {

      if ( ! this.scheduleUpdate ) {

        // ideally should use xr.requestAnimationFrame, here setTimeout to avoid passing the renderer
        this.scheduleUpdate = setTimeout( () => this.update(), this.refreshInterval );

      }

    });

    const config = { attributes: true, childList: true, subtree: true, characterData: true };
    observer.observe( dom, config );

    this.observer = observer;

	}

	dispatchDOMEvent( event ) {

		if ( event.data ) {

			htmlevent( this.dom, event.type, event.data.x, event.data.y );

		}

	}

	async update() {
    toCanvas(this.dom)
    .then( (canvas) => {
      this.image = canvas; 
      this.needsUpdate = true;
      this.scheduleUpdate = null;
    })
    .catch(console.error);

	}

	dispose() {

		if ( this.observer ) {

			this.observer.disconnect();

		}

		this.scheduleUpdate = clearTimeout( this.scheduleUpdate );

		super.dispose();

	}

}

function htmlevent( element, event, x, y ) {

	const mouseEventInit = {
		clientX: ( x * element.offsetWidth ) + element.offsetLeft,
		clientY: ( y * element.offsetHeight ) + element.offsetTop,
		view: element.ownerDocument.defaultView
	};

	window.dispatchEvent( new MouseEvent( event, mouseEventInit ) );

	const rect = element.getBoundingClientRect();

	x = x * rect.width + rect.left;
	y = y * rect.height + rect.top;

	function traverse( element ) {

		if ( element.nodeType !== Node.TEXT_NODE && element.nodeType !== Node.COMMENT_NODE ) {

			const rect = element.getBoundingClientRect();

			if ( x > rect.left && x < rect.right && y > rect.top && y < rect.bottom ) {

				element.dispatchEvent( new MouseEvent( event, mouseEventInit ) );

			}

			for ( let i = 0; i < element.childNodes.length; i ++ ) {

				traverse( element.childNodes[ i ] );

			}

		}

	}

	traverse( element );

}

class XRHTML extends THREE.Group {

  constructor(opts){
    super();
    this.opts = opts;
    this.scene = this.opts.scene;
    this.dom = this.setupElement(opts);
    this.renderer = opts.renderer;
		if( !this.renderer && typeof window != undefined ){
			this.renderer = window.XRHTMLRenderer;
			if( !this.renderer ) throw "XRHTML: please set 'window.XRHTMLRenderer = renderer'"
		}
    if( !this.scene ) throw "XRHTML: please pass scene-property as option"
    this.renderer.xr.addEventListener( 'sessionstart', () => this.init() );
    this.renderer.xr.addEventListener( 'sessionend',   () => this.init() );
    this.init();
    return this
  }
  
  setupElement(opts){
    let dom;
    if( opts.url ){
      dom = document.createElement("iframe");
      dom.src = opts.url;
      dom.setAttribute("frameborder", "0");
			dom.setAttribute("allowtransparency","true");
			dom.setAttribute("allowfullscreen","yes");
			dom.setAttribute("allowvr","yes");
    }else {
      dom = document.createElement("div");
      dom.innerHTML = opts.html;
      dom = dom.children[0];
    }
    dom.id = opts.name;
    dom.style.width = opts.size[0]+'px';
    dom.style.height = opts.size[1]+'px';
    dom.style.boxSizing = 'border-box';
    dom.style.pointerEvents = 'auto';
    dom.className = (dom.className||"") + " hmesh";
    dom.app = this;
    if( !opts.overflow ) document.body.style.overflow = 'hidden';
    return dom
  }
	
	update(){
		let compensate = 0.001;
    if( this.CSS )
			this.CSS.scale.set( this.scale.x * compensate, this.scale.y * compensate, this.scale.z * compensate );
		if( this.mesh )
			this.mesh.scale.set( this.scale.x , this.scale.y , this.scale.z  );
	}

  init(){
    //this.dom.remove() // remove (wherever) from dom
    this.renderer.domElement.style.zIndex = -1; // always show css over canvas
		if( this.opts.css )
			for( let i in this.opts.css ) this.getrealDOM().style[i] = this.opts.css[i];
    setTimeout( () => {
			this.renderer.xr.isPresenting ? this.HTMLMesh(true) : this.CSS3D(true);
			this.dispatchEvent("mode", this.renderer.xr.isPresenting);
		},100 );
  }

  CSS3D(enable){
    if( !enable ){
			this.dom.style.visibility = 'hidden';
      return
    }

		this.dom.style.visibility = 'visible';
    this.HTMLMesh(false);
    if( !this.renderer.CSS3D ){
      this.renderer.CSS3D = new CSS3DRenderer({});
      let dom = this.renderer.CSS3D.domElement;
      dom.setAttribute("id", "css3d");
      dom.style.position = this.renderer.domElement.style.position = 'absolute';
      dom.style.top      = this.renderer.domElement.style.top      = '0px';
      this.renderer.domElement.style.zIndex = 1; 
			dom.style.zIndex = 100;
			dom.style.pointerEvents = "none";
      document.body.appendChild( this.renderer.CSS3D.domElement );
      this.monkeyPatchRenderer();
    }
    this.CSS = new CSS3DObject(this.dom);
    this.CSS.scale.setScalar(0.001);
    this.CSS.name = this.opts.name;
		this.update();
    this.add(this.CSS);
    return this
  }

  HTMLMesh(enable){
    if( !enable ){
      if( this.mesh ) this.remove(this.mesh);
      return
    }
   
    this.CSS3D(false);
    this.renderer.domElement.style.zIndex = 999; // always show canvas over css
    if( !this.domhide ){
      this.domhide = document.createElement("div");
      this.domhide.id = "domhide";
      this.domhide.style.position = 'absolute';
      this.domhide.style.top = '0px';
      this.domhide.style.left = '0px';
      this.domhide.style.visibility = 'hidden';
      document.body.appendChild(this.domhide);
    }
		let opts = {
      scrollX: this.dom.tagName == "IFRAME" && this.dom.contentWindow ? this.dom.contentWindow.scrollX : 0, 
			scrollY: this.dom.tagName == "IFRAME" && this.dom.contentWindow ? this.dom.contentWindow.scrollY : 0
		};
		if( this.mesh ) this.mesh.dispose();
    toCanvas(this.capture())
    .then( (canvas) => {
      this.mesh = new HTMLMesh( this.capture(), opts, canvas );
      this.mesh.name = this.opts.name;
      if( !this.opts.singleside ) this.mesh.material.side = THREE.DoubleSide;
      if( !this.opts.opaque ) this.mesh.material.transparent = true;
      this.update();
      this.add(this.mesh);
    })
    .catch( console.error );
    return this
  }

	getrealDOM(){
		return this.dom.tagName == "IFRAME" && this.dom.contentDocument ? this.dom.contentDocument.body : this.dom 
	}

	capture(){
		let dom = this.getrealDOM();
		if( this.dom.tagName != "IFRAME" ) return dom
		// freeze viewport 
		dom.style.overflow = 'hidden';
		dom.style.height   = this.dom.style.height; 
		dom.style.width   = this.dom.style.width; 
		return dom
	}

  monkeyPatchRenderer(){
    let size = new THREE.Vector2();
    let render  = this.renderer.render.bind(this.renderer);
    let setSize = this.renderer.setSize.bind(this.renderer);
    this.renderer.render = (scene,camera) => {
      render(scene,camera);
      if( !this.renderer.xr.isPresenting ) this.renderer.CSS3D.render(scene,camera);
    };
    this.renderer.setSize = (w,h) => {
      setSize(w,h);
      this.renderer.CSS3D.setSize(w,h);
    };
    this.renderer.getSize(size);
    this.renderer.setSize(size.x,size.y);
  }

	dispose(){
		if( this.dom  ) this.dom.remove();
		if( this.mesh ) this.mesh.dispose();
	}

}

export { XRHTML };
