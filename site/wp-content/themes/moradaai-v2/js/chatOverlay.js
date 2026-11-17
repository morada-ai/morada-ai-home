// Immersive chat overlay controller for the Home hero CTA.
// Progressive enhancement + lazy load: with JS off, the CTA's href (WhatsApp)
// works as-is. With JS on, the first click injects the Mia widget script, opens
// the overlay, and auto-sends the seed once the widget is ready. If the widget
// never connects within the deadline, it degrades to the WhatsApp link.
document.addEventListener("DOMContentLoaded", function () {
    var overlay = document.getElementById("miaChatOverlay");
    if (!overlay) {
        return;
    }

    var triggers = document.querySelectorAll("[data-mia-chat-trigger]");
    var closers = overlay.querySelectorAll("[data-mia-chat-close]");
    var mount = overlay.querySelector("#miaChatMount");
    var seed = overlay.getAttribute("data-seed") || "";
    var fallbackUrl = overlay.getAttribute("data-chat-fallback") || "";
    var heroInput = document.querySelector("[data-mia-chat-input]");
    // "whatsapp" (MVP) = CTA/input go straight to WhatsApp with the typed text;
    // "chat" = the full embedded chat overlay below. Set in footer-home.php.
    var mode = overlay.getAttribute("data-mia-mode") || "chat";

    // How long to wait for the widget to actually connect (socket + instance)
    // before treating it as a failure and degrading to WhatsApp.
    var CONNECT_DEADLINE_MS = 12000;

    var lastFocused = null;
    var hideTimer = null;
    var failTimer = null;
    var injected = false;
    var overlayOpen = false;
    var conversationStarted = false; // open() called for the current open cycle
    var seeded = false;              // seed message auto-sent once per page load
    var inerted = [];                // background elements made inert while open
    var pendingMessage = seed;       // first message for this open (typed text or seed)

    function widgetReady() {
        return window.MoradaChatWidget && typeof window.MoradaChatWidget.open === "function";
    }

    // The overlay is role="dialog" aria-modal="true"; make the rest of the page
    // inert (and aria-hidden) while it is open so AT and Tab order stay inside.
    function setBackgroundInert(on) {
        if (on) {
            inerted = [];
            Array.prototype.forEach.call(document.body.children, function (el) {
                if (el === overlay || el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "LINK") {
                    return;
                }
                var rec = { el: el, hadAria: el.hasAttribute("aria-hidden") };
                if (!rec.hadAria) {
                    el.setAttribute("aria-hidden", "true");
                }
                if ("inert" in el) {
                    el.inert = true;
                }
                inerted.push(rec);
            });
        } else {
            inerted.forEach(function (rec) {
                if (!rec.hadAria) {
                    rec.el.removeAttribute("aria-hidden");
                }
                if ("inert" in rec.el) {
                    rec.el.inert = false;
                }
            });
            inerted = [];
        }
    }

    // Inject the widget loader once, carrying config as data-* the loader reads.
    function injectWidget() {
        if (injected) {
            return;
        }
        injected = true;
        var s = document.createElement("script");
        s.src = overlay.getAttribute("data-chat-src");
        s.setAttribute("data-id", overlay.getAttribute("data-chat-id") || "");
        s.setAttribute("data-token", overlay.getAttribute("data-chat-token") || "");
        s.setAttribute("data-locale", overlay.getAttribute("data-chat-locale") || "pt-BR");
        s.setAttribute("data-render-mode", "embedded");
        s.setAttribute("data-container-selector", "#miaChatMount");
        s.defer = true;
        document.body.appendChild(s);
    }

    function clearFailTimer() {
        if (failTimer) {
            window.clearTimeout(failTimer);
            failTimer = null;
        }
    }

    // The widget didn't connect in time: degrade to WhatsApp. Use location (not
    // window.open) — a timer-driven window.open is not a user gesture and gets
    // popup-blocked / opens in the same tab unreliably.
    function onConnectFail() {
        failTimer = null;
        if (!overlayOpen) {
            return;
        }
        closeOverlay();
        if (fallbackUrl) {
            window.location.href = fallbackUrl;
        }
    }

    // Open the widget. Seed the first message only once per page load; later
    // reopens just re-show the existing conversation (no duplicate auto-send).
    function startConversation() {
        if (conversationStarted) {
            return;
        }
        conversationStarted = true;
        if (seeded) {
            window.MoradaChatWidget.open({});
        } else {
            seeded = true;
            window.MoradaChatWidget.open({ defaultMessage: pendingMessage || seed, autoSend: true });
        }
    }

    // Poll until the widget API is ready (start the conversation) and until the
    // thread is genuinely connected (#chat-application-id.initialized) — only
    // then drop the loading greeting, so the stage is never blank.
    function poll() {
        if (!overlayOpen) {
            return;
        }
        if (!conversationStarted && widgetReady()) {
            startConversation();
        }
        if (mount && mount.querySelector("#chat-application-id.initialized")) {
            overlay.classList.remove("is-loading");
            clearFailTimer();
            return;
        }
        window.setTimeout(poll, 150);
    }

    function openOverlay(evt) {
        if (evt) {
            evt.preventDefault();
        }
        if (hideTimer) {
            window.clearTimeout(hideTimer);
            hideTimer = null;
        }

        overlayOpen = true;
        conversationStarted = false;
        // First message = whatever the user typed in the hero input, else the seed.
        pendingMessage = (heroInput && heroInput.value.trim()) ? heroInput.value.trim() : seed;
        lastFocused = document.activeElement;
        overlay.hidden = false;
        overlay.classList.add("is-loading");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("miaChatLock");
        setBackgroundInert(true);
        window.requestAnimationFrame(function () {
            overlay.classList.add("is-open");
        });

        clearFailTimer();
        failTimer = window.setTimeout(onConnectFail, CONNECT_DEADLINE_MS);

        injectWidget();
        poll();

        var back = overlay.querySelector(".miaChatOverlay__back");
        if (back) {
            back.focus();
        }
    }

    function closeOverlay() {
        overlayOpen = false;
        clearFailTimer();
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("miaChatLock");
        setBackgroundInert(false);

        if (widgetReady() && window.MoradaChatWidget.isOpen()) {
            window.MoradaChatWidget.close();
        }

        // Remove from layout/a11y tree after the fade (matches the 280ms CSS).
        hideTimer = window.setTimeout(function () {
            overlay.hidden = true;
        }, 300);

        if (lastFocused && typeof lastFocused.focus === "function") {
            lastFocused.focus();
        }
    }

    // MVP path: open the site's WhatsApp lead form (the WPCode modal,
    // window.moradaOpenWaModal). It captures the lead and then opens WhatsApp
    // with a message that reads the hero input (via the WPCode snippet), so the
    // typed text becomes the question. Falls back to a direct wa.me link with
    // the typed text if the modal global isn't present.
    function openWaModal(evt) {
        if (evt) {
            evt.preventDefault();
        }
        if (typeof window.moradaOpenWaModal === "function") {
            window.moradaOpenWaModal();
            return;
        }
        if (!fallbackUrl) {
            return;
        }
        var typed = (heroInput && heroInput.value) ? heroInput.value.trim() : "";
        var url = typed ? (fallbackUrl.split("?")[0] + "?text=" + encodeURIComponent(typed)) : fallbackUrl;
        window.open(url, "_blank", "noopener");
    }

    // MVP mode: hero CTA + input open the WhatsApp lead form; the typed text is
    // carried into the WhatsApp message. The full embedded-chat flow above stays
    // built but dormant — flip data-mia-mode to "chat" in footer-home.php to
    // re-enable it.
    if (mode === "whatsapp") {
        triggers.forEach(function (trigger) {
            trigger.addEventListener("click", openWaModal);
        });
        if (heroInput) {
            heroInput.addEventListener("keydown", function (e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    openWaModal(e);
                }
            });
        }
        return;
    }

    // The floating widget (part-miaChatWidget.php) and the embedded overlay are
    // the same script and cannot both run on a page. When the floating one is
    // there, the hero CTA and input open it with the typed question instead.
    if (document.querySelector("script[data-mia-chat-floating]")) {
        var openFloating = function (evt) {
            if (evt) {
                evt.preventDefault();
            }
            var message = (heroInput && heroInput.value.trim()) ? heroInput.value.trim() : seed;
            var waited = 0;
            (function tryOpen() {
                if (widgetReady()) {
                    window.MoradaChatWidget.open({ defaultMessage: message, autoSend: true });
                    return;
                }
                waited += 150;
                if (waited >= CONNECT_DEADLINE_MS) {
                    if (fallbackUrl) {
                        window.location.href = fallbackUrl;
                    }
                    return;
                }
                window.setTimeout(tryOpen, 150);
            })();
        };
        triggers.forEach(function (trigger) {
            trigger.addEventListener("click", openFloating);
        });
        if (heroInput) {
            heroInput.addEventListener("keydown", function (e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    openFloating(e);
                }
            });
        }
        return;
    }

    triggers.forEach(function (trigger) {
        trigger.addEventListener("click", openOverlay);
    });
    closers.forEach(function (closer) {
        closer.addEventListener("click", closeOverlay);
    });

    // Enter in the hero input opens the overlay and sends the typed question as
    // the first message (the form has onsubmit="return false" to block reload).
    if (heroInput) {
        heroInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                openOverlay(e);
            }
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && overlay.classList.contains("is-open")) {
            closeOverlay();
        }
    });

    // Trap Tab focus within the overlay while open. Include the widget's
    // contenteditable input and skip hidden controls so the cycle is correct.
    overlay.addEventListener("keydown", function (e) {
        if (e.key !== "Tab" || !overlayOpen) {
            return;
        }
        var nodes = overlay.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [contenteditable=""], [contenteditable="true"], [tabindex]:not([tabindex="-1"])'
        );
        var focusable = Array.prototype.filter.call(nodes, function (el) {
            return el.offsetParent !== null || el === document.activeElement;
        });
        if (!focusable.length) {
            return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
});
