/* /courses/ page: shelves that unfold one at a time, and the course pop-up dialog.
   - Opening a shelf rewrites the URL to /courses/#<shelf> (replaceState, no history spam).
   - Opening a course pushes /courses/#<course>, so Back closes the dialog.
   - /courses/#<shelf> and /courses/#<course> deep-link.
   - Tags filter the books (AND), picked from a searchable full-screen index;
     the selection lives in ?tags=a,b and every shelf with a match unfolds.
   Without JS: #<shelf> still opens via :target, and book cards link to the
   standalone course pages. */
(function () {
  "use strict";

  var root = document.querySelector(".course-shelves");
  if (!root) return;
  root.classList.add("is-enhanced");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setHash(hash) {
    history.replaceState(history.state, "", hash ? "#" + hash : location.pathname + location.search);
  }

  /* ---------- Shelves ---------- */

  var shelves = [].slice.call(root.querySelectorAll(".shelf")).map(function (node) {
    var shelf = {
      key: node.id,
      node: node,
      summary: node.querySelector(".shelf__summary"),
      panel: node.querySelector(".shelf__panel"),
      isOpen: false
    };
    shelf.panel.inert = true;
    return shelf;
  });
  var byKey = {};
  shelves.forEach(function (s) { byKey[s.key] = s; });
  var active = null;

  function setOpen(shelf, open) {
    shelf.isOpen = open;
    shelf.node.classList.toggle("is-open", open);
    shelf.summary.setAttribute("aria-expanded", String(open));
    shelf.panel.inert = !open;
  }

  // Close a shelf with no transition (used for shelves above the clicked one,
  // so the clicked strip can be held still under the pointer).
  function closeInstantly(shelf) {
    shelf.node.classList.add("is-snapping");
    setOpen(shelf, false);
    void shelf.node.offsetHeight;
    requestAnimationFrame(function () { shelf.node.classList.remove("is-snapping"); });
  }

  var holdTimer = null;

  // Keep the page from getting shorter while panels swap; otherwise the browser
  // clamps scrollY and the clicked strip jumps even though we compensate.
  function holdHeight() {
    clearTimeout(holdTimer);
    root.style.minHeight = root.offsetHeight + "px";
    holdTimer = setTimeout(function () { root.style.minHeight = ""; }, 420);
  }

  function show(shelf) {
    var anchorTop = shelf ? shelf.summary.getBoundingClientRect().top : 0;
    if (shelf && active && active !== shelf) holdHeight();
    shelves.forEach(function (other) {
      if (filtering || other === shelf || !other.isOpen) return;   // no accordion while filtering
      var above = shelf && (other.node.compareDocumentPosition(shelf.node) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (above) closeInstantly(other); else setOpen(other, false);
    });
    if (shelf && !shelf.isOpen) setOpen(shelf, true);
    active = shelf;
    if (shelf) {
      var moved = shelf.summary.getBoundingClientRect().top - anchorTop;
      if (moved) window.scrollBy({ top: moved, behavior: "instant" });
    }
  }

  function toggle(shelf) {
    if (shelf.isOpen) {
      setOpen(shelf, false);
      active = null;
      setHash("");
    } else {
      show(shelf);
      setHash(shelf.key);
    }
  }

  root.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var summary = event.target.closest(".shelf__summary");
    if (!summary) return;
    event.preventDefault();
    toggle(byKey[summary.parentNode.id]);
  });

  /* ---------- Course dialog ---------- */

  var modal = document.getElementById("course-modal");
  var dialog = modal.querySelector(".course-modal__dialog");
  var body = modal.querySelector(".course-modal__body");
  var current = null;          // slug shown in the dialog
  var lastTrigger = null;
  var pushedHistory = false;
  var hideTimer = null;

  function cardFor(slug) { return root.querySelector('.book[data-course="' + slug + '"]'); }

  function showCourse(slug) {
    var tpl = document.getElementById("course-tpl-" + slug);
    if (!tpl || current === slug) return;
    current = slug;
    clearTimeout(hideTimer);
    body.innerHTML = "";
    body.appendChild(tpl.content.cloneNode(true));
    dialog.setAttribute("aria-labelledby", "course-title-" + slug);
    modal.hidden = false;
    document.documentElement.classList.add("course-modal-open");
    void modal.offsetWidth;    // commit the closed state so the opening transition runs
    modal.classList.add("is-open");
    dialog.scrollTop = 0;
    dialog.focus({ preventScroll: true });
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([body]);
  }

  function hideCourse() {
    if (!current) return;
    current = null;
    modal.classList.remove("is-open");
    document.documentElement.classList.remove("course-modal-open");
    hideTimer = setTimeout(function () {
      modal.hidden = true;
      body.innerHTML = "";
    }, reduce.matches ? 0 : 260);
    var trigger = lastTrigger;
    lastTrigger = null;
    if (!trigger) return;
    trigger.focus({ preventScroll: true });
    // Going Back to #<shelf> is a fragment navigation, which resets focus to
    // <body> after we return it; put it back once that has happened.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (document.activeElement === document.body) trigger.focus({ preventScroll: true });
      });
    });
  }

  function requestClose() {
    if (pushedHistory) {
      pushedHistory = false;
      history.back();          // popstate -> route() -> hideCourse()
    } else {
      hideCourse();
      setHash(active ? active.key : "");
    }
  }

  root.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var card = event.target.closest(".book[data-course]");
    if (!card) return;
    event.preventDefault();
    var slug = card.getAttribute("data-course");
    lastTrigger = card;
    history.pushState(history.state, "", "#" + slug);
    pushedHistory = true;
    showCourse(slug);
  });

  modal.addEventListener("click", function (event) {
    if (event.target.closest("[data-modal-close]")) { requestClose(); return; }
    var tag = event.target.closest(".course-tag[data-tag]");
    if (tag && !(event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
      // close the dialog, then filter by just this tag
      event.preventDefault();
      pendingTags = [tag.getAttribute("data-tag")];
      var viaHistory = pushedHistory;
      requestClose();
      if (!viaHistory) applyPending();   // otherwise popstate applies it
      return;
    }
    var jump = event.target.closest("[data-scroll-to]");
    if (jump) {
      event.preventDefault();
      var target = document.getElementById(jump.getAttribute("data-scroll-to"));
      if (target) target.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
    }
  });

  document.addEventListener("keydown", function (event) {
    if (searchOpen) {
      if (event.key === "Escape") { event.preventDefault(); closeSearch(); }
      else if (event.key === "Tab") trapFocus(event, search.querySelector(".tag-search__panel"));
      return;
    }
    if (event.key === "Escape") {
      if (current) { requestClose(); return; }
      if (active) { var shelf = active; toggle(shelf); shelf.summary.focus({ preventScroll: true }); }
      return;
    }
    if (event.key === "Tab" && current) trapFocus(event, dialog);
  });

  // keep Tab focus inside an open dialog
  function trapFocus(event, box) {
    var focusable = [].filter.call(box.querySelectorAll("a[href], button:not([disabled]), input"), function (el) {
      return !el.closest("[hidden]");
    });
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === box)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  /* ---------- Tag filter ---------- */

  // The bar under the title shows the selected tags; clicking it (or "/")
  // opens a full-screen index of all tags, A-Z with semesters first, that
  // narrows as you type. Picking tags there filters the shelves live.
  var filterBar = root.querySelector(".course-filter");
  var search = document.getElementById("tag-search");
  var books = [].slice.call(root.querySelectorAll(".book[data-course]")).map(function (node) {
    var tags = node.getAttribute("data-tags");
    return { node: node, tags: tags ? tags.split("|") : [], match: true };
  });
  var selected = [];
  var filtering = false;
  var pendingTags = null;

  var totals = {};
  books.forEach(function (b) { b.tags.forEach(function (t) { totals[t] = (totals[t] || 0) + 1; }); });
  var allTags = Object.keys(totals);

  // "Fall 2025" style tags come first, oldest first; the rest go A-Z,
  // ignoring case and reading digits as numbers (CS61A before CS106B).
  var SEASONS = { winter: 0, spring: 1, summer: 2, fall: 3 };
  function termKey(tag) {
    var m = /^(Winter|Spring|Summer|Fall)\s+(\d{4})$/i.exec(tag);
    return m ? Number(m[2]) * 4 + SEASONS[m[1].toLowerCase()] : null;
  }
  function compareTags(a, b) {
    var ta = termKey(a), tb = termKey(b);
    if (ta !== null || tb !== null) {
      if (ta === null) return 1;
      if (tb === null) return -1;
      return ta - tb;
    }
    return a.localeCompare(b, "en", { sensitivity: "base", numeric: true });
  }
  allTags.sort(compareTags);

  function matches(book, tags) {
    return tags.every(function (t) { return book.tags.indexOf(t) !== -1; });
  }
  function countFor(tags) {
    return books.filter(function (b) { return matches(b, tags); }).length;
  }

  function readQuery() {
    var raw = new URLSearchParams(location.search).get("tags");
    return raw ? raw.split(",") : [];
  }

  function writeQuery() {
    var query = selected.length ? "?tags=" + selected.map(encodeURIComponent).join(",") : "";
    history.replaceState(history.state, "", location.pathname + query + location.hash);
  }

  /* index */

  var items = [];   // { tag, node, count, group }
  var groups = [];  // { node, items }
  if (search) {
    var index = search.querySelector(".tag-index");
    var empty = index.querySelector(".tag-index__empty");
    search.querySelector(".tag-index__total").textContent = allTags.length + " 个标签";
    var group = null;
    allTags.forEach(function (tag) {
      var label = termKey(tag) !== null ? "Semester" : /^[a-z]/i.test(tag) ? tag[0].toUpperCase() : "#";
      if (!group || group.label !== label) {
        group = { label: label, node: document.createElement("div"), items: [] };
        group.node.className = "tag-index__group";
        var h = document.createElement("h2");
        h.textContent = label;
        group.node.appendChild(h);
        index.insertBefore(group.node, empty);
        groups.push(group);
      }
      var node = document.createElement("button");
      node.type = "button";
      node.className = "tag-index__item" + (totals[tag] >= 5 ? " is-large" : "");
      node.setAttribute("data-tag", tag);
      node.innerHTML = '<span class="tag-index__name"></span><small class="tag-index__count"></small>';
      node.firstChild.textContent = tag;
      group.node.appendChild(node);
      var item = { tag: tag, node: node, group: group };
      group.items.push(item);
      items.push(item);
    });
  }

  function filterIndex() {
    var q = search.querySelector(".tag-search__input").value.trim().toLowerCase();
    var any = false;
    groups.forEach(function (g) {
      var shown = 0;
      g.items.forEach(function (item) {
        var hit = !q || item.tag.toLowerCase().indexOf(q) !== -1;
        item.node.hidden = !hit;
        if (hit) shown++;
      });
      g.node.hidden = !shown;
      if (shown) any = true;
    });
    search.querySelector(".tag-index__empty").hidden = any;
  }

  function chip(tag) {
    var li = document.createElement("li");
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tag-chip";
    b.setAttribute("data-remove-tag", tag);
    b.setAttribute("aria-label", "移除标签 " + tag);
    b.innerHTML = '<span></span><i class="fas fa-xmark" aria-hidden="true"></i>';
    b.firstChild.textContent = tag;
    li.appendChild(b);
    return li;
  }

  function applyFilter(tags) {
    selected = tags.filter(function (t, i) { return totals[t] && tags.indexOf(t) === i; });
    var wasFiltering = filtering;
    filtering = selected.length > 0;
    root.classList.toggle("is-filtering", filtering);

    var total = 0;
    books.forEach(function (book) {
      book.match = matches(book, selected);
      book.node.hidden = !book.match;
      if (book.match) total++;
    });

    shelves.forEach(function (shelf) {
      var hits = books.some(function (b) { return b.match && shelf.node.contains(b.node); });
      shelf.node.hidden = !hits;
      if (filtering) setOpen(shelf, hits);
    });
    if (filtering) {
      active = null;
    } else if (wasFiltering) {
      // back to one shelf at a time
      shelves.forEach(function (shelf) { setOpen(shelf, false); });
      active = null;
      var key = decodeURIComponent(location.hash.slice(1));
      if (byKey[key]) show(byKey[key]);
    }

    // counts are for "the current selection plus this tag", so a tag that
    // would leave nothing is greyed out
    items.forEach(function (item) {
      var on = selected.indexOf(item.tag) !== -1;
      var n = on ? total : countFor(selected.concat(item.tag));
      item.node.setAttribute("aria-pressed", String(on));
      item.node.disabled = !on && n === 0;
      item.node.lastChild.textContent = n;
    });

    [filterBar, search].forEach(function (box) {
      if (!box) return;
      var list = box.querySelector(".tag-bar__chips, .tag-search__chips");
      list.innerHTML = "";
      selected.forEach(function (t) { list.appendChild(chip(t)); });
      var counter = box.querySelector(".course-filter__count");
      counter.textContent = "匹配 " + total + " 门";
      counter.parentNode.hidden = !filtering;
    });
    if (filterBar) filterBar.classList.toggle("has-selection", filtering);
  }

  function setTags(tags) {
    applyFilter(tags);
    writeQuery();
  }

  function toggleTag(tag) {
    var on = selected.indexOf(tag) !== -1;
    setTags(on ? selected.filter(function (t) { return t !== tag; }) : selected.concat(tag));
  }

  function applyPending() {
    if (!pendingTags) return;
    var tags = pendingTags;
    pendingTags = null;
    setTags(tags);
    if (filterBar) filterBar.scrollIntoView({ block: "nearest", behavior: reduce.matches ? "auto" : "smooth" });
  }

  /* overlay */

  var searchOpen = false;
  var searchHideTimer = null;
  var searchInput = search && search.querySelector(".tag-search__input");

  function openSearch() {
    if (!search || searchOpen) return;
    searchOpen = true;
    clearTimeout(searchHideTimer);
    searchInput.value = "";
    filterIndex();
    search.hidden = false;
    document.documentElement.classList.add("course-modal-open");
    void search.offsetWidth;
    search.classList.add("is-open");
    searchInput.focus({ preventScroll: true });
  }

  function closeSearch() {
    if (!searchOpen) return;
    searchOpen = false;
    search.classList.remove("is-open");
    document.documentElement.classList.remove("course-modal-open");
    searchHideTimer = setTimeout(function () { search.hidden = true; }, reduce.matches ? 0 : 220);
    var opener = filterBar.querySelector(".tag-bar__open");
    opener.focus({ preventScroll: true });
  }

  if (filterBar && search) {
    filterBar.hidden = false;

    filterBar.addEventListener("click", function (event) {
      var remove = event.target.closest("[data-remove-tag]");
      // the chips are rebuilt, so hand focus to the bar
      if (remove) { toggleTag(remove.getAttribute("data-remove-tag")); filterBar.querySelector(".tag-bar__open").focus(); return; }
      if (event.target.closest(".course-filter__clear")) { setTags([]); filterBar.querySelector(".tag-bar__open").focus(); return; }
      if (event.target.closest(".tag-bar")) openSearch();
    });

    search.addEventListener("click", function (event) {
      if (event.target.closest("[data-tag-search-close]")) { closeSearch(); return; }
      var remove = event.target.closest("[data-remove-tag]");
      if (remove) { toggleTag(remove.getAttribute("data-remove-tag")); searchInput.focus(); return; }
      if (event.target.closest(".course-filter__clear")) { setTags([]); searchInput.focus(); return; }
      var item = event.target.closest(".tag-index__item");
      if (item && !item.disabled) toggleTag(item.getAttribute("data-tag"));
    });

    searchInput.addEventListener("input", filterIndex);
    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        // pick the best tag the query still shows (exact, then prefix, then a
        // word prefix, then anywhere), then start over
        event.preventDefault();
        var q = searchInput.value.trim().toLowerCase();
        if (!q) return;
        var rank = function (tag) {
          tag = tag.toLowerCase();
          return tag === q ? 0 : tag.indexOf(q) === 0 ? 1 : (" " + tag).indexOf(" " + q) !== -1 ? 2 : 3;
        };
        var best = null;
        items.forEach(function (i) {
          if (i.node.hidden || i.node.disabled) return;
          if (!best || rank(i.tag) < rank(best.tag)) best = i;
        });
        if (!best) return;
        toggleTag(best.tag);
        searchInput.value = "";
        filterIndex();
      } else if (event.key === "Backspace" && !searchInput.value && selected.length) {
        setTags(selected.slice(0, -1));
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "/" || searchOpen || current || event.metaKey || event.ctrlKey || event.altKey) return;
    var t = event.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    event.preventDefault();
    openSearch();
  });

  /* ---------- Routing: #<shelf> or #<course> ---------- */

  function route(instant) {
    var key = decodeURIComponent(location.hash.slice(1));
    var card = key && cardFor(key);
    var shelf = byKey[key] || (card && byKey[card.closest(".shelf").id]) || null;

    if (!card) { pushedHistory = false; hideCourse(); }
    if (!shelf) return;

    if (instant) root.classList.add("is-instant");
    if (!shelf.node.hidden) show(shelf);
    if (card) { lastTrigger = lastTrigger || card; showCourse(key); }
    if (instant) {
      (card || shelf.summary).scrollIntoView({ block: card ? "center" : "start" });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { root.classList.remove("is-instant"); });
      });
    }
  }

  window.addEventListener("popstate", function () {
    var tags = readQuery();
    if (tags.join(",") !== selected.join(",")) applyFilter(tags);
    route(false);
    applyPending();
  });
  window.addEventListener("hashchange", function () { route(false); });

  // a ?tags= link opens its shelves without animating, like a deep link
  root.classList.add("is-instant");
  applyFilter(readQuery());
  route(true);
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.remove("is-instant"); });
  });
})();
