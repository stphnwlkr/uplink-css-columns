<?php
/**
 * Plugin Name:       Uplink CSS Columns
 * Plugin URI:        https://uplink.press/code/uplink-css-columns
 * Description:       Adds CSS Multi-column and fragmentation controls to core blocks, including column spanning for any block inside a Group.
 * Version:           1.1.2
 * Requires at least: 7.0
 * Requires PHP:      8.3
 * Author:            Steve Walker
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       uplink-css-columns
 */

declare(strict_types=1);

namespace UPCC;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const VERSION = '1.1.2';

/**
 * Return all attributes used by the full column controls.
 *
 * @return array<string, array<string, mixed>>
 */
function attributes(): array {
	return array(
		'upccColumnsEnabled'            => array( 'type' => 'boolean', 'default' => false ),
		'upccColumnCount'               => array( 'type' => 'string', 'default' => '' ),
		'upccColumnFill'                => array( 'type' => 'string', 'default' => '' ),
		'upccColumnGap'                 => array( 'type' => 'string', 'default' => '' ),
		'upccColumnHeight'              => array( 'type' => 'string', 'default' => '' ),
		'upccColumnRule'                => array( 'type' => 'string', 'default' => '' ),
		'upccColumnRuleColor'           => array( 'type' => 'string', 'default' => '' ),
		'upccColumnRuleStyle'           => array( 'type' => 'string', 'default' => '' ),
		'upccColumnRuleVisibilityItems' => array( 'type' => 'string', 'default' => '' ),
		'upccColumnRuleWidth'           => array( 'type' => 'string', 'default' => '' ),
		'upccColumnSpan'                => array( 'type' => 'string', 'default' => '' ),
		'upccColumnWidth'               => array( 'type' => 'string', 'default' => '' ),
		'upccColumnWrap'                => array( 'type' => 'string', 'default' => '' ),
		'upccBreakBefore'               => array( 'type' => 'string', 'default' => '' ),
		'upccBreakAfter'                => array( 'type' => 'string', 'default' => '' ),
		'upccBreakInside'               => array( 'type' => 'string', 'default' => '' ),
		'upccBlockPadding'              => array( 'type' => 'string', 'default' => '' ),
		'upccBlockMargin'               => array( 'type' => 'string', 'default' => '' ),
	);
}

/**
 * Return whether a block receives the full set of controls.
 */
function is_container_block( string $block_name ): bool {
	return in_array( $block_name, array( 'core/group', 'core/paragraph', 'core/list' ), true );
}

/**
 * Return whether a block receives fragmentation controls.
 */
function is_fragmentation_block( string $block_name ): bool {
	return is_container_block( $block_name ) || 'core/list-item' === $block_name;
}

/**
 * Register full attributes on container blocks and span on every other block.
 *
 * @param array<string, mixed> $args       Block type arguments.
 * @param string               $block_name Block type name.
 * @return array<string, mixed>
 */
function register_attributes( array $args, string $block_name ): array {
	$all_attributes       = attributes();
	if ( is_container_block( $block_name ) ) {
		$extension_attributes = $all_attributes;
	} else {
		$extension_attributes = array( 'upccColumnSpan' => $all_attributes['upccColumnSpan'] );

		if ( is_fragmentation_block( $block_name ) ) {
			$extension_attributes['upccBreakBefore'] = $all_attributes['upccBreakBefore'];
			$extension_attributes['upccBreakAfter']  = $all_attributes['upccBreakAfter'];
			$extension_attributes['upccBreakInside'] = $all_attributes['upccBreakInside'];
		}
	}

	$args['attributes'] = array_merge( $args['attributes'] ?? array(), $extension_attributes );

	return $args;
}
add_filter( 'register_block_type_args', __NAMESPACE__ . '\\register_attributes', 10, 2 );

/**
 * Enqueue editor controls and preview styles.
 */
function enqueue_editor_assets(): void {
	$script_path = plugin_dir_path( __FILE__ ) . 'assets/uplink-css-columns.js';
	$style_path  = plugin_dir_path( __FILE__ ) . 'assets/editor.css';

	wp_enqueue_script(
		'upcc-editor',
		plugins_url( 'assets/uplink-css-columns.js', __FILE__ ),
		array( 'wp-block-editor', 'wp-blocks', 'wp-components', 'wp-compose', 'wp-data', 'wp-element', 'wp-hooks', 'wp-i18n' ),
		file_exists( $script_path ) ? (string) filemtime( $script_path ) : VERSION,
		true
	);

	wp_enqueue_style(
		'upcc-editor',
		plugins_url( 'assets/editor.css', __FILE__ ),
		array(),
		file_exists( $style_path ) ? (string) filemtime( $style_path ) : VERSION
	);

	wp_set_script_translations( 'upcc-editor', 'uplink-css-columns' );
}
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\\enqueue_editor_assets' );

/**
 * Sanitize a CSS value before adding it to a rendered style attribute.
 *
 * Functions such as var(), calc(), min(), max(), clamp(), and modern color
 * functions remain available. Tokens that can escape a declaration or load an
 * external resource are rejected.
 *
 * @param mixed $value Potential CSS value.
 */
function sanitize_css_value( $value ): string {
	if ( ! is_scalar( $value ) ) {
		return '';
	}

	$value = trim( wp_strip_all_tags( (string) $value, true ) );

	if ( '' === $value || strlen( $value ) > 300 ) {
		return '';
	}

	if ( preg_match( '/[;{}<>`\x00-\x1F\x7F]/', $value ) ) {
		return '';
	}

	if ( preg_match( '/(?:url|expression|image-set|cross-fade)\s*\(/i', $value ) ) {
		return '';
	}

	return $value;
}

/**
 * Build sanitized declarations for a supported block.
 *
 * @param array<string, mixed> $block_attributes Block attributes.
 * @return array<string, string>
 */
function declarations( array $block_attributes ): array {
	$styles                    = array();
	$span                      = sanitize_css_value( $block_attributes['upccColumnSpan'] ?? '' );
	$break_before_after_values = array(
		'auto', 'avoid', 'always', 'all', 'avoid-page', 'page', 'left', 'right',
		'recto', 'verso', 'avoid-column', 'column', 'avoid-region', 'region',
	);
	$break_inside_values       = array( 'auto', 'avoid', 'avoid-page', 'avoid-column', 'avoid-region' );

	if ( in_array( $span, array( 'none', 'all' ), true ) ) {
		$styles['column-span'] = $span;
	}

	$break_before = sanitize_css_value( $block_attributes['upccBreakBefore'] ?? '' );
	$break_after  = sanitize_css_value( $block_attributes['upccBreakAfter'] ?? '' );
	$break_inside = sanitize_css_value( $block_attributes['upccBreakInside'] ?? '' );

	if ( in_array( $break_before, $break_before_after_values, true ) ) {
		$styles['break-before'] = $break_before;
	}

	if ( in_array( $break_after, $break_before_after_values, true ) ) {
		$styles['break-after'] = $break_after;
	}

	if ( in_array( $break_inside, $break_inside_values, true ) ) {
		$styles['break-inside'] = $break_inside;
	}

	if ( empty( $block_attributes['upccColumnsEnabled'] ) ) {
		return $styles;
	}

	$map = array(
		'upccColumnRule'                => 'column-rule',
		'upccColumnCount'               => 'column-count',
		'upccColumnFill'                => 'column-fill',
		'upccColumnGap'                 => 'column-gap',
		'upccColumnHeight'              => 'column-height',
		'upccColumnRuleColor'           => 'column-rule-color',
		'upccColumnRuleStyle'           => 'column-rule-style',
		'upccColumnRuleVisibilityItems' => 'column-rule-visibility-items',
		'upccColumnRuleWidth'           => 'column-rule-width',
		'upccColumnWidth'               => 'column-width',
		'upccColumnWrap'                => 'column-wrap',
		'upccBlockPadding'              => 'padding',
		'upccBlockMargin'               => 'margin',
	);

	foreach ( $map as $attribute_name => $property_name ) {
		$value = sanitize_css_value( $block_attributes[ $attribute_name ] ?? '' );
		if ( '' !== $value ) {
			$styles[ $property_name ] = $value;
		}
	}

	return $styles;
}

/**
 * Add column styles and state classes to the rendered block wrapper.
 *
 * @param string               $block_content Rendered block HTML.
 * @param array<string, mixed> $block         Parsed block data.
 */
function render_block( string $block_content, array $block ): string {
	$block_name = isset( $block['blockName'] ) ? (string) $block['blockName'] : '';

	if ( '' === trim( $block_content ) ) {
		return $block_content;
	}

	$block_attributes = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();

	if ( is_fragmentation_block( $block_name ) ) {
		$styles = declarations( $block_attributes );
	} else {
		$span   = sanitize_css_value( $block_attributes['upccColumnSpan'] ?? '' );
		$styles = in_array( $span, array( 'none', 'all' ), true ) ? array( 'column-span' => $span ) : array();
	}

	if ( empty( $styles ) ) {
		return $block_content;
	}

	$processor = new \WP_HTML_Tag_Processor( $block_content );
	if ( ! $processor->next_tag() ) {
		return $block_content;
	}

	if ( is_container_block( $block_name ) && ! empty( $block_attributes['upccColumnsEnabled'] ) ) {
		$processor->add_class( 'upcc-has-css-columns' );
	}

	if ( isset( $styles['column-span'] ) ) {
		$processor->add_class( 'upcc-has-css-column-span' );
	}

	if ( isset( $styles['break-before'] ) || isset( $styles['break-after'] ) || isset( $styles['break-inside'] ) ) {
		$processor->add_class( 'upcc-has-css-break-control' );
	}

	$existing_style = trim( (string) $processor->get_attribute( 'style' ) );
	$css             = array();

	foreach ( $styles as $property => $value ) {
		$css[] = $property . ':' . $value;
	}

	$style = ( '' !== $existing_style ? rtrim( $existing_style, "; \t\n\r\0\x0B" ) . ';' : '' ) . implode( ';', $css ) . ';';
	$processor->set_attribute( 'style', $style );

	return $processor->get_updated_html();
}
add_filter( 'render_block', __NAMESPACE__ . '\\render_block', 10, 2 );
