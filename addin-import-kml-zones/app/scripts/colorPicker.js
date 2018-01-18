(function () {
    "use strict";
    let ColorPicker = () => {
        let quickColorsBox = null,
            transparencyControl = null,
            colorToInitWith = null,
            defaultColor = [255, 69, 0, 38],
            defaultColorHex = "#FF4500",
            arrDefaultColorRGBA = { r: 255, g: 69, b: 0, a: 38 },
            defaultTransparencyValue = 85,
            picker = null,
            setVariables = () => {
                quickColorsBox = kml.args.container.querySelector("#colorPicker").querySelectorAll(".quickColorsBox");
                colorToInitWith = kml.utils.colorObjToArr(arrDefaultColorRGBA || defaultColor);
                transparencyControl = (function (content) {
                    let sliderEl = content.getElementsByClassName("transparencySlider")[0],
                        buttonEls = content.getElementsByClassName("transparencyButtonSet")[0],
                        slider = () => {
                            let transparencySliderValue = content.getElementsByClassName("transparencySliderValue")[0],
                                transparencySlider = content.getElementsByClassName("transparencySliderControl")[0],
                                getValue = newVal => Math.round(100 - (newVal <= 1 ? newVal : newVal / 255) * 100),
                                sliderUI = kml.vanillaSlider.slider(transparencySlider, {
                                    min: 0,
                                    max: 100,
                                    step: 5,
                                    value: transparencySliderValue.textContent = getValue(colorToInitWith[3])
                                });

                            return {
                                get: () => sliderUI ? Math.round((100 - sliderUI.getValue()) / 100 * 255) : 0,
                                set: function (val) {
                                    sliderUI.setValue((val.a ? val.a : val[3]) || 0);
                                }
                            };
                        },
                        chooseElement = function (useful, useless) {
                            useless.parentNode.removeChild(useless);
                            useful.style.display = "block";
                        },
                        control = slider();

                    chooseElement(sliderEl, buttonEls);
                    return control;
                })(kml.args.container.querySelector("#colorPicker"));
            };

        return {
            getDefaultColor: () => defaultColor,
            getDefaultColorHex: () => defaultColorHex,
            getTransparencyControl: () => transparencyControl,
            getDefaultTransparencyValue: () => defaultTransparencyValue,
            getPicker: () => picker,
            setVariables,
            formColorPicker: () => {
                setVariables();
                let quickColors = ["#ff4500", "#ffa500", "#008000", "#ffff00", "#ADD8E6", "#0000ff", "#800080"],
                    listeners = [],
                    getColorElement = () => kml.args.container.querySelector("#colorPicker INPUT:not([type='radio'])"),
                    customColorToInternal = function (customColor) {
                        let rgbColor = typeof customColor === "string" ? kml.utils.hexToRGBArray(customColor) : customColor,
                            color = kml.utils.colorObjToArr(rgbColor);
                        if (Math.max.apply(Math, color) > 1) {
                            color = color.map(value => (typeof value === "undefined") ? 1 : value / 255);
                        }
                        while (color.length < 4) {
                            color.push(0);
                        }
                        return color.slice();
                    },
                    fireChangeEvent = function (value) {
                        listeners.forEach(function (listener) {
                            if (listener.eventType === "change") {
                                listener.callback(value);
                            }
                        });
                    },
                    createColorPicker = () => {
                        let isSupportColor = kml.utils.inputTypeSupport("color", "hello world"),
                            nativeColorPicker = () => {
                                let elem = getColorElement();
                                elem.type = "color";
                                elem.addEventListener("change", () => {
                                    fireChangeEvent(this.value);
                                }, false);

                                return {
                                    setValue: function (val) {
                                        let newValue = kml.utils.rgbToHex.apply(kml, kml.utils.colorObjToArr(val));
                                        elem.value = newValue;
                                        elem.style.opacity = (kml.utils.colorObjToArr(val)[3]) / 255;
                                        fireChangeEvent(newValue);
                                    },
                                    getValue: () => kml.utils.hexToRGBArray(elem.value),
                                    getHexValue: () => elem.value
                                };
                            },
                            jqueryColorPicker = () => {
                                let elem = getColorElement(),
                                    Jscolor = jscolor,
                                    colorPicker = new Jscolor(elem);

                                colorPicker.valueElement.addEventListener("change", () => {
                                    fireChangeEvent("#" + this.value);
                                }, false);

                                return {
                                    setValue: function (val) {
                                        let newVal = val.length > 3 ? val.slice(0, 3) : val,
                                            aVal = val.length > 3 ? val.slice(3, 4) :
                                                (kml.utils.colorObjToArr(defaultColor)[3]) * 255,
                                            newValue = kml.utils.rgbToHex.apply(kml.utils, kml.utils.colorObjToArr(newVal));

                                        colorPicker.fromRGB.apply(colorPicker, customColorToInternal(newVal));
                                        getColorElement().style.opacity = aVal / 255;
                                        getColorElement().style.backgroundColor = newValue;

                                        fireChangeEvent(newValue);
                                    },
                                    getValue: () => (colorPicker.rgb || defaultColor).map(val => val * 255),
                                    getHexValue: () => elem.value,
                                    originalPicker: colorPicker
                                };
                            };

                        return (isSupportColor ? nativeColorPicker : jqueryColorPicker)();
                    },
                    attachEvent = function (eventType, callback) {
                        listeners.push({
                            eventType: eventType,
                            callback: callback
                        });
                    };
                picker = createColorPicker();
                picker.setValue(colorToInitWith);

                quickColors.forEach(function (value) {
                    let quickColor = document.createElement("div");
                    quickColor.className = "quickColor";
                    quickColor.setAttribute("ng-click", "setQuickColor($event)");
                    quickColor.style.backgroundColor = value;
                    quickColorsBox[0].appendChild(quickColor);
                });

                return {
                    /**
                     * Gets or sets current color and transparency
                     * @param {Array|object} value new color and transparency.
                     * The following values are all valid:
                     * @returns {object} rgba object with their values between 0 and 255
                     */
                    value: function (value) {
                        let rgb;
                        if (value) {
                            picker.setValue(value);
                            transparencyControl.set(value);
                            return value;
                        } else {
                            rgb = picker.getValue();
                            return {
                                r: rgb[0],
                                g: rgb[1],
                                b: rgb[2],
                                a: transparencyControl.get()
                            };
                        }
                    },
                    attachEvent: attachEvent
                };
            },
            setQuickColor: function (e) {
                if (!e.target.style.backgroundColor) {//clicked on container
                    return;
                }

                let backgroundColor = e.target.style.backgroundColor,
                    matches = backgroundColor.indexOf("#") < 0 ?
                        /\brgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g.exec(backgroundColor).splice(1) :
                        kml.utils.hexToRGBArray(backgroundColor),
                    rgba = [];

                rgba.push(parseInt(matches[0], 10));
                rgba.push(parseInt(matches[1], 10));
                rgba.push(parseInt(matches[2], 10));
                rgba.push(transparencyControl.get());

                picker.setValue(rgba);
                kml.args.container.querySelector("#colorPickerField").value = picker.getHexValue();
            },

            setDefaultColor: () => {
                picker.setValue(defaultColor);
            }
        };
    };

    let globals = (function () { return this || (0, eval)("this"); }());

    if (typeof module !== "undefined" && module.exports) {
        module.exports = ColorPicker;
    } else if (typeof define === "function" && define.amd) {
        define(function () { return ColorPicker; });
    } else {
        globals.ColorPicker = ColorPicker;
    }
}());
