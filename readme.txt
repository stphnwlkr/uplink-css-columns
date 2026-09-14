=== Uplink CSS Columns ===
Contributors: stphnwlkr
Tags: blocks, columns, gutenberg, layout, typography
Requires at least: 7.0
Tested up to: 7.1
Requires PHP: 8.3
Stable tag: 1.1.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Add CSS Multi-column layout, rules, spanning, and fragmentation controls to core WordPress blocks.

== Description ==

Uplink CSS Columns adds an accessible inspector panel, an editor preview, and
server-rendered front-end styles for CSS Multi-column layouts. It has been tested
with WordPress 7.1.

Group, Paragraph, and List blocks receive the complete set of controls. Any
other registered block nested inside a Group receives the Span parent columns
control without receiving unrelated container settings. Individual List Item
blocks receive fragmentation controls for managing breaks between list items.

= Features =

* Column count, width, gap, and fill.
* Column rule shorthand, width, style, color, and draft visibility controls.
* Optional padding and margin for the selected multi-column block.
* Draft column height and wrapping controls with editor warnings.
* Column spanning for any registered block inside a Group.
* Break before, break after, and break inside fragmentation controls.
* CSS custom properties and functions such as var(), calc(), min(), max(), and clamp().
* Sanitized server-side output that avoids modifying core block save markup.
* Clear blank/default behavior and examples in control descriptions.

The plugin stores its settings as namespaced block attributes. Front-end
declarations are sanitized and injected during block rendering, which avoids
the block-validation errors caused by changing core block save markup.

The established Level 1 CSS properties have broad browser support. Column
height, column wrap, and column rule visibility are draft features and are
clearly marked as experimental. Unsupported properties are ignored by browsers.

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/` or install its ZIP file from Plugins > Add Plugin.
2. Activate Uplink CSS Columns.
3. Select a supported block and open the CSS Columns panel in the block inspector.
4. Enable multi-column layout and configure only the declarations you need.

== Frequently Asked Questions ==

= Which blocks can create columns? =

Core Group, Paragraph, and List blocks receive the full set of container and
fragmentation controls. Core List Item blocks receive fragmentation controls
without receiving unrelated column-container settings.

= Can other blocks span a Group's columns? =

Yes. Any registered block nested inside a Group receives a Span parent columns
control. Direct children are the most reliable because an intermediate CSS
formatting context can prevent native `column-span` behavior.

= What does leaving a field blank do? =

A blank field writes no declaration, allowing the browser or theme value to
apply. Examples appear in help text rather than as input placeholders.

= Are the experimental properties safe to use? =

They degrade safely: browsers that do not recognize a draft property ignore it.
Test column height, column wrap, and column rule visibility in every browser you
support before using them in production.

== Screenshots ==

1. A Group block flowing paragraph content across two columns while a heading spans the full column width.
2. A List block distributing ten list items across two balanced columns.
3. The CSS Columns inspector controls for layout, fragmentation, column rules, experimental properties, and parent-column spanning.

== Changelog ==

= 1.1.2 =
* Updated the minimum required WordPress version to 7.0 and confirmed compatibility through WordPress 7.1. No functional code changes.

= 1.1.1 =
* Added break-before, break-after, and break-inside controls to individual Core List Item blocks.

= 1.1.0 =
* Added padding and margin controls for the selected multi-column block.
* Expanded the column-rule shorthand guidance with its expected pattern and examples.
* Organized the editor controls into collapsible Layout, Column rule, Item behavior, and Fragmentation sections.

= 1.0.0 =
* Initial release with column layout, rules, spanning, fragmentation, editor preview, input guidance, and sanitized front-end rendering.
