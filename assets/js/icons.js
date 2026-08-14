/**
 * Инлайновые иконки в стиле lucide.
 * viewBox 24, fill none, stroke currentColor, ширина штриха 2, круглые концы.
 * Вставляются через innerHTML — здесь только статические строки, без пользовательских данных.
 */
var ICONS = (function () {
  var OPEN =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';

  function icon(body) {
    return OPEN + body + '</svg>';
  }

  return {
    target: icon(
      '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
    ),
    check: icon('<path d="M20 6 9 17l-5-5"/>'),
    x: icon('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    clock: icon('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    layers: icon(
      '<path d="m12 2 10 5-10 5L2 7l10-5z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>'
    ),
    'bar-chart': icon('<path d="M6 20v-5"/><path d="M12 20V9"/><path d="M18 20V4"/><path d="M3 20h18"/>'),
    'arrow-right': icon('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
    'arrow-left': icon('<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>'),
    refresh: icon(
      '<path d="M21 12a9 9 0 0 1-9 9c-4 0-7.4-2.6-8.6-6.2"/>' +
        '<path d="M3 12a9 9 0 0 1 9-9c4 0 7.4 2.6 8.6 6.2"/>' +
        '<path d="M21 3v6h-6"/><path d="M3 21v-6h6"/>'
    ),
    'alert-triangle': icon(
      '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>' +
        '<path d="M12 9v4"/><path d="M12 17h.01"/>'
    ),
    'book-open': icon(
      '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/>' +
        '<path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>'
    ),
    calculator: icon(
      '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/>' +
        '<path d="M8 11h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/>' +
        '<path d="M8 15h.01"/><path d="M12 15h.01"/><path d="M16 15v3"/>'
    ),
    zap: icon('<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>'),
    'chevron-down': icon('<path d="m6 9 6 6 6-6"/>'),
    trash: icon(
      '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>' +
        '<path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>'
    )
  };
})();
