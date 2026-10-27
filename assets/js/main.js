/* Eric Appiah — site interactions */
(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var html = doc.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onReady(fn) {
    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function formatAccraTime() {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Accra",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date());
    } catch (err) {
      return "--:--";
    }
  }

  function updateClock() {
    var time = formatAccraTime();
    ["accraTime", "accraTimeContact", "accraTimeFooter"].forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) el.textContent = time;
    });
  }

  function initHeader() {
    var header = doc.getElementById("siteHeader");
    var progress = doc.getElementById("scrollProgress");
    if (!header) return;

    var onScroll = function () {
      var y = window.scrollY || window.pageYOffset;
      header.classList.toggle("is-scrolled", y > 24);
      if (progress) {
        var height = doc.documentElement.scrollHeight - window.innerHeight;
        var pct = height > 0 ? Math.min((y / height) * 100, 100) : 0;
        progress.style.width = pct + "%";
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  function initReveal() {
    var items = Array.prototype.slice.call(doc.querySelectorAll("[data-reveal]"));
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -7% 0px", threshold: 0.08 });

    items.forEach(function (el) { observer.observe(el); });
  }

  function revealHero() {
    body.classList.add("loaded");
  }

  function initHero() {
    if (doc.readyState === "complete") {
      window.setTimeout(revealHero, 120);
    } else {
      window.addEventListener("load", function () { window.setTimeout(revealHero, 120); }, { once: true });
    }
    window.setTimeout(revealHero, 2400);

    if (reduceMotion || window.innerWidth < 981) return;
    var wrap = doc.querySelector(".portrait-wrap");
    if (!wrap) return;
    var ticking = false;
    var update = function () {
      var y = window.scrollY || window.pageYOffset;
      if (y < window.innerHeight * 1.2) {
        wrap.style.transform = "translate3d(0," + Math.min(y * 0.045, 26) + "px,0)";
      }
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  function initCounters() {
    var row = doc.querySelector(".stat-row");
    if (!row) return;
    var nums = Array.prototype.slice.call(row.querySelectorAll("[data-count]"));
    if (!nums.length) return;

    var animate = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var duration = target > 100 ? 1600 : 1200;
      var start = null;
      var step = function (ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      nums.forEach(animate);
      return;
    }
    var seen = false;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !seen) {
          seen = true;
          nums.forEach(animate);
          observer.disconnect();
        }
      });
    }, { threshold: 0.35 });
    observer.observe(row);
  }

  function initActiveNav() {
    var links = Array.prototype.slice.call(doc.querySelectorAll(".nav-links a"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    links.forEach(function (link) {
      var id = link.getAttribute("href");
      if (id && id.charAt(0) === "#") map[id.slice(1)] = link;
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) { link.classList.remove("is-active"); });
        var link = map[entry.target.id];
        if (link) link.classList.add("is-active");
      });
    }, { rootMargin: "-38% 0px -52% 0px", threshold: 0 });

    Object.keys(map).forEach(function (id) {
      var section = doc.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  function initMenu() {
    var toggle = doc.getElementById("menuToggle");
    var menu = doc.getElementById("mobileMenu");
    if (!toggle || !menu) return;

    var focusable = function () {
      return Array.prototype.slice.call(menu.querySelectorAll("a, button")).filter(function (el) {
        return el.offsetParent !== null;
      });
    };

    var open = function () {
      body.classList.add("menu-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      menu.setAttribute("aria-hidden", "false");
      var first = focusable()[0];
      if (first) window.setTimeout(function () { first.focus(); }, 120);
    };

    var close = function (restore) {
      body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      menu.setAttribute("aria-hidden", "true");
      if (restore) toggle.focus();
    };

    toggle.addEventListener("click", function () {
      if (body.classList.contains("menu-open")) close(true);
      else open();
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { close(false); });
    });

    doc.addEventListener("keydown", function (e) {
      if (!body.classList.contains("menu-open")) return;
      if (e.key === "Escape") { close(true); return; }
      if (e.key !== "Tab") return;
      var items = focusable();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080 && body.classList.contains("menu-open")) close(false);
    });
  }

  function initForm() {
    var form = doc.getElementById("contactForm");
    if (!form) return;

    var status = doc.getElementById("formStatus");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var data = new FormData(form);
      var name = (data.get("name") || "").toString().trim();
      var org = (data.get("organisation") || "").toString().trim();
      var topic = (data.get("topic") || "a conversation").toString().trim();
      var message = (data.get("message") || "").toString().trim();

      var lines = ["Hello Eric,", "", "My name is " + name + (org ? " from " + org : "") + "."];
      lines.push("I'd like to talk about " + topic.toLowerCase() + ".");
      if (message) lines.push("", message);
      lines.push("", "Sent from your website.");

      var url = "https://wa.me/233547747833?text=" + encodeURIComponent(lines.join("\n"));
      if (status) status.textContent = "Opening WhatsApp…";
      var win = window.open(url, "_blank", "noopener");
      if (!win) window.location.href = url;
      window.setTimeout(function () {
        if (status) status.textContent = "If WhatsApp did not open, call +233 54 774 7833.";
      }, 1600);
    });
  }

  function initCopy() {
    var buttons = Array.prototype.slice.call(doc.querySelectorAll("[data-copy]"));
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-copy");
        var source = id ? doc.getElementById(id) : null;
        if (!source) return;
        var text = source.innerText || source.textContent || "";
        var done = function () {
          var original = btn.textContent;
          btn.textContent = "Copied";
          window.setTimeout(function () { btn.textContent = original; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
        } else {
          fallbackCopy(text, done);
        }
      });
    });

    function fallbackCopy(text, done) {
      var ta = doc.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      doc.body.appendChild(ta);
      ta.select();
      try { doc.execCommand("copy"); done(); } catch (err) {}
      doc.body.removeChild(ta);
    }
  }

  function initCurrentYear() {
    doc.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  onReady(function () {
    updateClock();
    window.setInterval(updateClock, 30000);
    initHeader();
    initReveal();
    initHero();
    initCounters();
    initActiveNav();
    initMenu();
    initForm();
    initCopy();
    initCurrentYear();
  });
})();
