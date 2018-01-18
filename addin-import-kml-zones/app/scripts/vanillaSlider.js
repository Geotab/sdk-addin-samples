(function () {
    "use strict";
    var VanillaSlider = function () {
        var svgNameSpace = "http://www.w3.org/2000/svg",
            svgElements = {
                "path": true,
                "circle": true,
                "svg": true,
                "rect": true,
                "text": true
            };

        return {
            vanilla: (function () {
                var classNameCtrl = function (el) {
                    var obj = typeof el.className === "string" ? el : el.className,
                        param = typeof el.className === "string" ? "className" : "baseVal";
                    return {
                        get: function () {
                            return obj[param];
                        },
                        set: function (text) {
                            obj[param] = text;
                        }
                    };
                },
                    hasClass = function (el, className) {
                        return classNameCtrl(el).get().indexOf(className) !== -1;
                    },
                    addClass = function (el, className) {
                        if (el.classList) {
                            el.classList.add(className);
                        } else {
                            var classCtrl = classNameCtrl(el);
                            if (classCtrl.get().indexOf(className) < 0) {
                                classCtrl.set(classCtrl.get() + (classCtrl.get() ? " " : "") + className);
                            }
                        }
                    },
                    isArray = function (arr) {
                        return Object.prototype.toString.call(arr).indexOf("Array") !== -1;
                    },
                    isUsualObject = function (obj) {
                        return Object.prototype.toString.call(obj).indexOf("Object") !== -1;
                    },
                    createElement = function (name) {
                        if (svgElements.hasOwnProperty(name.toLowerCase())) {
                            return document.createElementNS(svgNameSpace, name);
                        }
                        return document.createElement(name);
                    },
                    changeDisplay = function (element, newValue) {
                        element.style.display = newValue;
                        return element;
                    },
                    getRealDisplay = function (elem) {
                        var computedStyle;

                        if (elem.currentStyle) {
                            return elem.currentStyle.display;
                        } else if (window.getComputedStyle) {
                            computedStyle = window.getComputedStyle(elem, null);

                            return computedStyle.getPropertyValue("display");
                        }
                    },
                    show = function (el) {
                        var nodeName, body = document.body, testElem, display;

                        if (getRealDisplay(el) !== "none") {
                            return el;
                        }

                        changeDisplay(el, "");

                        if (getRealDisplay(el) === "none") {
                            nodeName = el.nodeName;

                            testElem = document.createElement(nodeName);
                            body.appendChild(testElem);
                            display = getRealDisplay(testElem);

                            if (display === "none") {
                                display = "block";
                            }

                            body.removeChild(testElem);

                            changeDisplay(el, display);
                        }

                        return el;
                    },
                    hide = function (element) {
                        return changeDisplay(element, "none");
                    },

                    vanilla = {
                        /**
                         * @param el {HTMLElement} Element for adding classes
                         * @param classes {String} string of classes separated by space
                         */
                        addClasses: function (el, classes) {
                            var classArr = classes.split(" "), i;

                            for (i = 0; i < classArr.length; i++) {
                                addClass(el, classArr[i]);
                            }
                        },
                        hasClass: hasClass,
                        /**
                         * @param el {HTMLElement} Element for adding styles
                         * @param cssValues {Object} Object with css rules
                         */
                        css: function (el, cssValues) {
                            var createIterator = function (element, values) {
                                return function (propertyName) {
                                    element.style[propertyName] = values[propertyName];
                                };
                            };
                            Object.keys(cssValues).forEach(createIterator(el, cssValues));
                        },
                        /**
                         * @param tagName {String} Tag name of HTML element
                         * @param attributes {Object} Object with attributes of the element
                         * @param css {Object} Object with css rules
                         * @return element {HTMLElement} A new HTMLElement with set attributes and css rules
                         */
                        create: function (tagName, attributes, css) {
                            var element = createElement((tagName || "").toUpperCase()),
                                createIterator = function (el, attrs) {
                                    return function (propertyName) {
                                        try {
                                            el.setAttribute(propertyName, attrs[propertyName]);
                                        } catch (e) {
                                            //try to catch 114827 error, should be removed when it will be fixed or will not happen in future
                                            throw new Error("Try to set " + propertyName +
                                                " attribute " + attrs[propertyName] + " to " + el.tagName +
                                                " (" + tagName + "). Connected with this error: " + e.message);
                                        }
                                    };
                                };
                            if (attributes) {
                                Object.keys(attributes).forEach(createIterator(element, attributes));
                            }
                            if (css) {
                                vanilla.css(element, css);
                            }
                            return element;
                        },
                        /**
                         * @return {Object} set of root elements
                         */
                        extend: function () {
                            var length = arguments.length,
                                src, srcKeys, srcAttr,
                                fullCopy = false,
                                resAttr,
                                res = arguments[0], i = 1, j;

                            if (typeof res === "boolean") {
                                fullCopy = res;
                                res = arguments[1];
                                i++;
                            }
                            while (i !== length) {
                                src = arguments[i];
                                srcKeys = Object.keys(src);
                                for (j = 0; j < srcKeys.length; j++) {
                                    srcAttr = src[srcKeys[j]];
                                    if (fullCopy && (isUsualObject(srcAttr) || isArray(srcAttr))) {
                                        resAttr = res[srcKeys[j]];
                                        resAttr = res[srcKeys[j]] = (isUsualObject(resAttr) || isArray(resAttr)) ?
                                            resAttr : (isArray(srcAttr) ? [] : {});
                                        vanilla.extend(fullCopy, resAttr, srcAttr);
                                    } else {
                                        res[srcKeys[j]] = src[srcKeys[j]];
                                    }
                                }
                                i++;
                            }
                            return res;
                        },
                        isArray: isArray,
                        show: show,
                        hide: hide,
                        /**
                         * Toggle a DOM elements display
                         * @param el {HTMLElement} DOM Element
                         * @param toggle {Boolean} true = show, false = hide
                         * */
                        toggle: function (el, toggle) {
                            if (toggle) {
                                this.show(el);
                            } else {
                                this.hide(el);
                            }
                        },
                        /**
                         * get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
                         * @param elem {HTMLElement} DOM Element
                         * @param selector {String}
                         * */
                        closest: function (elem, selector) {
                            var matchesSelector = elem && (elem.matches || elem.webkitMatchesSelector ||
                                elem.mozMatchesSelector || elem.msMatchesSelector);

                            if (matchesSelector) {
                                while (elem && elem !== document.body) {
                                    if (matchesSelector.bind(elem)(selector)) {
                                        return elem;
                                    } else {
                                        elem = elem.parentNode;
                                    }
                                }
                            }
                            return false;
                        },
                        offset: function (elem) {
                            var offsetLeft = 0,
                                tmp, offsetTop = 0,
                                result = {
                                    left: 0,
                                    top: 0
                                };

                            if (elem !== null) {
                                tmp = elem;
                                while (tmp !== null) {
                                    offsetLeft += tmp.offsetLeft;
                                    offsetTop += tmp.offsetTop;
                                    tmp = tmp.offsetParent;
                                }
                                result.left = offsetLeft;
                                result.top = offsetTop;
                            }
                            return result;
                        }
                    };
                return vanilla;
            })(),
            slider: function (elem, customOptions) {
                var defaultOptions = {
                    max: 100,
                    min: 0,
                    step: 5,
                    value: 0
                },
                    body = window.document.body,
                    isTouch = kml.utils.isBrowserSupportTouchEvents(),
                    options = customOptions ? Object.keys(customOptions).reduce(function (result, key) {
                        result[key] = customOptions[key];
                        return result;
                    }, defaultOptions) : defaultOptions,
                    slider = (kml.utils.inputTypeSupport("range", "a") ? function (parent) {
                        var self = parent.appendChild(kml.vanillaSlider.vanilla.create("INPUT", {
                            "class": "vanillaSlider",
                            type: "range",
                            max: options.max,
                            min: options.min,
                            step: options.step,
                            value: options.value,
                            "ng-model": "sliderValue"
                        })),
                            change = kml.utils.NOOP;
                        kml.slider = self;

                        if (typeof options.onChange === "function") {
                            change = options.onChange;
                            self.addEventListener("change", function (e) {
                                change.call(this, this.value, e);
                            }, false);
                            self.addEventListener("input", function (e) {
                                change.call(this, this.value, e);
                            }, false);
                        }

                        return {
                            set: function (prop, val) {
                                self[prop] = val;
                            },
                            get: function (prop) {
                                return self[prop];
                            },
                            disable: function () {
                                self.setAttribute("disabled", "disabled");
                            },
                            enable: function () {
                                self.removeAttribute("disabled");
                            }
                        };
                    } : function (parent) {
                        var change = kml.utils.NOOP,
                            span = parent.appendChild(kml.vanillaSlider.vanilla.create("SPAN", {
                                "class": "vanillaSliderElement"
                            })),
                            halfScrollableWidth = span.offsetWidth / 2,
                            scrollerWidth = parent.offsetWidth,
                            currentPos = 0,
                            tempPos = 0,
                            max = options.max,
                            min = options.min,
                            step = options.step,
                            amp = max - min,
                            positions = amp / step,
                            posWidth = scrollerWidth / positions,
                            handlers,
                            getInteractionEvent = function (eventName) {
                                var evt = document.createEvent("Event");
                                evt.initEvent(eventName, true, false);
                                return evt;
                            },
                            move = function (delta, currPoint) {
                                var relativeLength = posWidth && Math.round((Math.abs(delta) / posWidth)) * step,
                                    startPoint = typeof currPoint === "number" ? currPoint : currentPos;
                                if (relativeLength) {
                                    if (delta < 0) {
                                        tempPos = Math.max(min, startPoint - relativeLength);
                                    } else {
                                        tempPos = Math.min(max, startPoint + relativeLength);
                                    }
                                    tempPos = Math.round(tempPos / step) * step;
                                    setValue(tempPos);
                                    change.call(span, tempPos);
                                }
                                return tempPos;
                            },
                            setValue = function (val) {
                                span.style.left = ((val - min) / amp) * 100 + "%";
                            },
                            events = {
                                start: isTouch ? "touchstart" : "mousedown",
                                move: isTouch ? "touchmove" : "mousemove",
                                end: isTouch ? "touchend" : "mouseup"
                            },
                            xStart = 0,
                            mousemove = function (e) {
                                move(e.pageX - xStart);
                            },
                            click = function (e) {
                                var bbox;
                                if (e.target !== span) {
                                    bbox = this.getBoundingClientRect();
                                    posWidth = bbox.width / positions;
                                    currentPos = move(e.pageX - bbox.left, 0);
                                }
                            },
                            eventHandler = function (e) {
                                var event;
                                if ("changedTouches" in e) {//firefox has this property in prototype
                                    if (e.changedTouches.length === 1) {
                                        event = e.changedTouches[0];
                                    } else {
                                        return true;
                                    }
                                } else {
                                    event = e;
                                }
                                return handlers[e.type].call(this, event, e);
                            },
                            mouseup = function () {
                                currentPos = tempPos;
                                span.dispatchEvent(getInteractionEvent("blur"));
                                body.removeEventListener(events.move, eventHandler, false);
                                body.removeEventListener(events.end, eventHandler, false);
                            },
                            mousedown = function (e, originalEvent) {
                                originalEvent.preventDefault();
                                xStart = e.pageX;
                                scrollerWidth = parent.offsetWidth;
                                posWidth = scrollerWidth / positions;
                                halfScrollableWidth = span.offsetWidth / 2;
                                span.dispatchEvent(getInteractionEvent("focus"));
                                body.addEventListener(events.move, eventHandler, false);
                                body.addEventListener(events.end, eventHandler, false);
                            };

                        handlers = {
                            mousedown: mousedown,
                            touchstart: mousedown,
                            mousemove: mousemove,
                            touchmove: mousemove,
                            mouseup: mouseup,
                            touchend: mouseup
                        };

                        kml.vanillaSlider.vanilla.addClasses(parent, "vanillaSlider");
                        span.addEventListener(events.start, eventHandler, false);
                        parent.addEventListener("click", click, false);
                        span.style.left = -halfScrollableWidth + "px";
                        if (typeof options.onChange === "function") {
                            change = options.onChange;
                        }
                        if (options.value) {
                            currentPos = Math.max(Math.min(options.value, max), min);
                            setValue(currentPos);
                        }

                        return {
                            set: function (prop, val) {
                                currentPos = Math.max(Math.min(val, max), min);
                                setValue(currentPos);
                                change.call(span, currentPos);
                            },
                            get: function () {
                                return currentPos;
                            },
                            disable: function () {
                                span.removeEventListener(events.start, eventHandler, false);
                                parent.removeEventListener("click", click, false);
                                mouseup();
                            },
                            enable: function () {
                                span.addEventListener(events.start, eventHandler, false);
                                parent.addEventListener("click", click, false);
                            }
                        };
                    })(elem),
                    disabled = false;

                return {
                    getValue: function () {
                        return slider.get("value");
                    },
                    setValue: function (val) {
                        if (val < options.min) {
                            val = options.min;
                        }
                        if (val > options.max) {
                            val = options.max;
                        }
                        slider.set("value", val);
                        return val;
                    },
                    disable: function () {
                        if (!disabled) {
                            slider.disable();
                            disabled = true;
                        }
                    },
                    enable: function () {
                        if (disabled) {
                            slider.enable();
                            disabled = false;
                        }
                    }
                };
            }
        };
    };

    let globals = (function () { return this || (0, eval)("this"); }());

    if (typeof module !== "undefined" && module.exports) {
        module.exports = VanillaSlider;
    } else if (typeof define === "function" && define.amd) {
        define(function () { return VanillaSlider; });
    } else {
        globals.VanillaSlider = VanillaSlider;
    }
}());
