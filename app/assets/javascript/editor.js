let textarea = null;

$(function() {
  $("a.nav-icon").on("click", function(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!textarea || textarea.selectionStart === textarea.selectionEnd) {
      return;
    }

    const text = textarea.value;
    let [start, end] = [textarea.selectionStart, textarea.selectionEnd];

    textarea.focus();

    if ($(this).find(".fa-bold,.fa-italic").length) {
      const tag = $(this).find(".fa-bold").length ? "**" : "_";

      textarea.value = text.slice(0, start) + tag + text.slice(start, end) + tag + text.slice(end);
      textarea.selectionStart = start;
      textarea.selectionEnd = end + 2*tag.length;

      console.log(textarea.selectionStart, textarea.selectionEnd);
    } else if ($(this).find(".fa-font")) {
      start = text.lastIndexOf('\n', textarea.selectionStart) + 1;

      textarea.value = text.slice(0, start) + "### " + text.slice(start);
      textarea.selectionStart = textarea.selectionEnd = start;
    }
  });

  $("textarea").on("focus", function() {
    textarea = this;
  });
});