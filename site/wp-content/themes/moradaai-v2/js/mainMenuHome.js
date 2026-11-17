document.addEventListener("DOMContentLoaded", function () {
    var header = document.querySelector(".siteHeader");
    var hamburger = document.querySelector(".siteHeaderHamburger");
    var bar = document.querySelector(".MainNavSiteHome");

    // Publish the collapsed header height so CSS scroll-padding-top can offset
    // in-page anchor jumps below the fixed header (independent of the welcome
    // bar or viewport). Measured while closed so the open menu doesn't skew it.
    function syncHeaderHeight() {
        if (bar && !(header && header.classList.contains("is-open"))) {
            document.documentElement.style.setProperty("--home-header-h", bar.offsetHeight + "px");
        }
    }
    syncHeaderHeight();
    window.addEventListener("resize", syncHeaderHeight);

    if (!header || !hamburger) {
        return;
    }

    hamburger.addEventListener("click", function () {
        var isOpen = header.classList.toggle("is-open");
        hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close the open mobile menu after a nav link is tapped, so it doesn't
    // cover the section that an in-page anchor scrolls to.
    header.querySelectorAll(".siteHeaderNav a").forEach(function (link) {
        link.addEventListener("click", function () {
            header.classList.remove("is-open");
            hamburger.setAttribute("aria-expanded", "false");
        });
    });
});
