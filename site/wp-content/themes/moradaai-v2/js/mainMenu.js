document.addEventListener("DOMContentLoaded", function() {
    const hamburger = document.querySelector(".hamburger");
    const menu = document.querySelector(".primary-menu");

    hamburger.addEventListener("click", function() {
        menu.classList.toggle("active");
    });

    const menuItems = document.querySelectorAll(".primary-menu > li");

    menuItems.forEach(item => {
        item.addEventListener("mouseenter", function() {
            const submenu = this.querySelector(".sub-menu");
            if (submenu) {
                submenu.classList.add("submenu-visible");
            }
        });

        item.addEventListener("mouseleave", function() {
            const submenu = this.querySelector(".sub-menu");
            if (submenu) {
                submenu.classList.remove("submenu-visible");
            }
        });
    });
});
