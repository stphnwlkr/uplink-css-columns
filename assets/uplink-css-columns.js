( function () {
	'use strict';

	const { addFilter } = wp.hooks;
	const { createHigherOrderComponent } = wp.compose;
	const { useSelect } = wp.data;
	const { Fragment, createElement: el } = wp.element;
	const { InspectorControls } = wp.blockEditor;
	const { BaseControl, Button, Notice, PanelBody, SelectControl, TextControl, ToggleControl } = wp.components;
	const { __ } = wp.i18n;

	const containerBlocks = [ 'core/group', 'core/paragraph', 'core/list' ];
	const fragmentationBlocks = [ ...containerBlocks, 'core/list-item' ];
	const extensionAttributes = {
		upccColumnsEnabled: { type: 'boolean', default: false },
		upccColumnCount: { type: 'string', default: '' },
		upccColumnFill: { type: 'string', default: '' },
		upccColumnGap: { type: 'string', default: '' },
		upccColumnHeight: { type: 'string', default: '' },
		upccColumnRule: { type: 'string', default: '' },
		upccColumnRuleColor: { type: 'string', default: '' },
		upccColumnRuleStyle: { type: 'string', default: '' },
		upccColumnRuleVisibilityItems: { type: 'string', default: '' },
		upccColumnRuleWidth: { type: 'string', default: '' },
		upccColumnSpan: { type: 'string', default: '' },
		upccColumnWidth: { type: 'string', default: '' },
		upccColumnWrap: { type: 'string', default: '' },
		upccBreakBefore: { type: 'string', default: '' },
		upccBreakAfter: { type: 'string', default: '' },
		upccBreakInside: { type: 'string', default: '' },
		upccBlockPadding: { type: 'string', default: '' },
		upccBlockMargin: { type: 'string', default: '' },
	};

	const isContainerBlock = ( name ) => containerBlocks.includes( name );
	const isFragmentationBlock = ( name ) => fragmentationBlocks.includes( name );
	const hasValue = ( value ) => value !== undefined && value !== null && String( value ).trim() !== '';

	function addAttributes( settings, name ) {
		const attributes = isContainerBlock( name )
			? extensionAttributes
			: {
				upccColumnSpan: extensionAttributes.upccColumnSpan,
				...( isFragmentationBlock( name ) ? {
					upccBreakBefore: extensionAttributes.upccBreakBefore,
					upccBreakAfter: extensionAttributes.upccBreakAfter,
					upccBreakInside: extensionAttributes.upccBreakInside,
				} : {} ),
			};

		return {
			...settings,
			attributes: { ...settings.attributes, ...attributes },
		};
	}

	addFilter( 'blocks.registerBlockType', 'upcc/attributes', addAttributes );

	function cssValueControl( props ) {
		return el( TextControl, {
			label: props.label,
			help: props.help,
			value: props.value || '',
			__next40pxDefaultSize: true,
			__nextHasNoMarginBottom: false,
			onChange: ( value ) => props.setAttributes( { [ props.attributeName ]: value.trim() } ),
		} );
	}

	function selectControl( label, value, options, attributeName, setAttributes, help ) {
		return el( SelectControl, {
			label,
			help,
			value: value || '',
			options,
			__next40pxDefaultSize: true,
			__nextHasNoMarginBottom: false,
			onChange: ( nextValue ) => setAttributes( { [ attributeName ]: nextValue } ),
		} );
	}

	const defaultOption = { label: __( 'Not set (browser/theme default)', 'uplink-css-columns' ), value: '' };
	const ruleStyleOptions = [
		defaultOption,
		{ label: __( 'None', 'uplink-css-columns' ), value: 'none' },
		{ label: __( 'Hidden', 'uplink-css-columns' ), value: 'hidden' },
		{ label: __( 'Solid', 'uplink-css-columns' ), value: 'solid' },
		{ label: __( 'Dotted', 'uplink-css-columns' ), value: 'dotted' },
		{ label: __( 'Dashed', 'uplink-css-columns' ), value: 'dashed' },
		{ label: __( 'Double', 'uplink-css-columns' ), value: 'double' },
		{ label: __( 'Groove', 'uplink-css-columns' ), value: 'groove' },
		{ label: __( 'Ridge', 'uplink-css-columns' ), value: 'ridge' },
		{ label: __( 'Inset', 'uplink-css-columns' ), value: 'inset' },
		{ label: __( 'Outset', 'uplink-css-columns' ), value: 'outset' },
	];
	const breakBeforeAfterOptions = [
		defaultOption,
		{ label: __( 'Auto', 'uplink-css-columns' ), value: 'auto' },
		{ label: __( 'Avoid any break', 'uplink-css-columns' ), value: 'avoid' },
		{ label: __( 'Always force nearest break', 'uplink-css-columns' ), value: 'always' },
		{ label: __( 'Force all fragmentation contexts', 'uplink-css-columns' ), value: 'all' },
		{ label: __( 'Avoid column break', 'uplink-css-columns' ), value: 'avoid-column' },
		{ label: __( 'Force column break', 'uplink-css-columns' ), value: 'column' },
		{ label: __( 'Avoid page break', 'uplink-css-columns' ), value: 'avoid-page' },
		{ label: __( 'Force page break', 'uplink-css-columns' ), value: 'page' },
		{ label: __( 'Left page', 'uplink-css-columns' ), value: 'left' },
		{ label: __( 'Right page', 'uplink-css-columns' ), value: 'right' },
		{ label: __( 'Recto page', 'uplink-css-columns' ), value: 'recto' },
		{ label: __( 'Verso page', 'uplink-css-columns' ), value: 'verso' },
		{ label: __( 'Avoid region break', 'uplink-css-columns' ), value: 'avoid-region' },
		{ label: __( 'Force region break', 'uplink-css-columns' ), value: 'region' },
	];
	const breakInsideOptions = [
		defaultOption,
		{ label: __( 'Auto', 'uplink-css-columns' ), value: 'auto' },
		{ label: __( 'Avoid any break', 'uplink-css-columns' ), value: 'avoid' },
		{ label: __( 'Avoid column break', 'uplink-css-columns' ), value: 'avoid-column' },
		{ label: __( 'Avoid page break', 'uplink-css-columns' ), value: 'avoid-page' },
		{ label: __( 'Avoid region break', 'uplink-css-columns' ), value: 'avoid-region' },
	];

	const withControls = createHigherOrderComponent( ( BlockEdit ) => ( props ) => {
		const supportsColumns = isContainerBlock( props.name );
		const supportsFragmentation = isFragmentationBlock( props.name );
		const isInsideGroup = useSelect( ( select ) => {
			if ( ! props.clientId ) {
				return false;
			}

			const blockEditor = select( 'core/block-editor' );
			return blockEditor.getBlockParents( props.clientId ).some(
				( parentId ) => blockEditor.getBlockName( parentId ) === 'core/group'
			);
		}, [ props.clientId ] );
		const supportsSpan = supportsColumns || isInsideGroup;

		if ( ! supportsSpan && ! supportsFragmentation ) {
			return el( BlockEdit, props );
		}

		const { attributes, setAttributes } = props;
		const resetAttributes = supportsColumns
			? extensionAttributes
			: {
				...( supportsSpan ? { upccColumnSpan: extensionAttributes.upccColumnSpan } : {} ),
				...( supportsFragmentation ? {
					upccBreakBefore: extensionAttributes.upccBreakBefore,
					upccBreakAfter: extensionAttributes.upccBreakAfter,
					upccBreakInside: extensionAttributes.upccBreakInside,
				} : {} ),
			};
		const reset = () => setAttributes( Object.fromEntries(
			Object.entries( resetAttributes ).map( ( [ name, schema ] ) => [ name, schema.type === 'boolean' ? false : '' ] )
		) );

		return el(
			Fragment,
			null,
			el( BlockEdit, props ),
			el(
				InspectorControls,
				null,
				el(
					PanelBody,
					{ title: __( 'CSS Columns', 'uplink-css-columns' ), initialOpen: false },
					supportsColumns && el( ToggleControl, {
						label: __( 'Enable multi-column layout', 'uplink-css-columns' ),
						help: attributes.upccColumnsEnabled
							? __( 'Flow this block’s contents through CSS columns.', 'uplink-css-columns' )
							: __( 'Keep this block in normal document flow.', 'uplink-css-columns' ),
						checked: !! attributes.upccColumnsEnabled,
						__nextHasNoMarginBottom: false,
						onChange: ( value ) => setAttributes( { upccColumnsEnabled: value } ),
					} ),
					supportsColumns && attributes.upccColumnsEnabled && el(
						PanelBody,
						{ title: __( 'Layout', 'uplink-css-columns' ), initialOpen: true },
						el( cssValueControl, {
							label: __( 'Column count', 'uplink-css-columns' ),
							help: __( 'Leave blank to let the browser determine the count. Enter a positive integer, auto, or a CSS variable; for example, 3.', 'uplink-css-columns' ),
							value: attributes.upccColumnCount, attributeName: 'upccColumnCount', setAttributes,
						} ),
						el( cssValueControl, {
							label: __( 'Minimum column width', 'uplink-css-columns' ),
							help: __( 'Leave blank for auto. Enter a CSS length such as 18rem or var(--content-column-width). A minimum width is usually the most responsive choice.', 'uplink-css-columns' ),
							value: attributes.upccColumnWidth, attributeName: 'upccColumnWidth', setAttributes,
						} ),
						el( cssValueControl, {
							label: __( 'Column gap', 'uplink-css-columns' ),
							help: __( 'Leave blank for the browser or theme gap. Enter a non-negative CSS length such as 2rem or var(--space-l).', 'uplink-css-columns' ),
							value: attributes.upccColumnGap, attributeName: 'upccColumnGap', setAttributes,
						} ),
						el( cssValueControl, {
							label: __( 'CSS Column Padding', 'uplink-css-columns' ),
							help: __( 'Applies padding to the selected multi-column block, not to each generated column. Enter one to four CSS values, such as 1rem, 1rem 2rem, or var(--space-m).', 'uplink-css-columns' ),
							value: attributes.upccBlockPadding, attributeName: 'upccBlockPadding', setAttributes,
						} ),
						el( cssValueControl, {
							label: __( 'CSS Column Margin', 'uplink-css-columns' ),
							help: __( 'Applies margin around the selected multi-column block. Enter one to four CSS values, such as 0 0 2rem or var(--space-l) 0.', 'uplink-css-columns' ),
							value: attributes.upccBlockMargin, attributeName: 'upccBlockMargin', setAttributes,
						} ),
						selectControl(
							__( 'Column fill', 'uplink-css-columns' ), attributes.upccColumnFill,
							[ defaultOption, { label: __( 'Balance', 'uplink-css-columns' ), value: 'balance' }, { label: __( 'Balance all', 'uplink-css-columns' ), value: 'balance-all' }, { label: __( 'Auto', 'uplink-css-columns' ), value: 'auto' } ],
							'upccColumnFill', setAttributes
						),
						el( cssValueControl, {
							label: __( 'Column height (experimental)', 'uplink-css-columns' ),
							help: __( 'Leave blank for auto. Enter a non-negative CSS length such as 30rem. This is a draft feature; unsupported browsers ignore it.', 'uplink-css-columns' ),
							value: attributes.upccColumnHeight, attributeName: 'upccColumnHeight', setAttributes,
						} ),
						selectControl(
							__( 'Column wrap (experimental)', 'uplink-css-columns' ), attributes.upccColumnWrap,
							[ defaultOption, { label: __( 'Auto', 'uplink-css-columns' ), value: 'auto' }, { label: __( 'Wrap', 'uplink-css-columns' ), value: 'wrap' }, { label: __( 'No wrap', 'uplink-css-columns' ), value: 'nowrap' } ],
							'upccColumnWrap', setAttributes, __( 'Draft CSS feature. Unsupported browsers ignore it.', 'uplink-css-columns' )
						)
					),
					supportsColumns && attributes.upccColumnsEnabled && el(
						PanelBody,
						{ title: __( 'Column rule', 'uplink-css-columns' ), initialOpen: false },
						el( cssValueControl, {
							label: __( 'Rule shorthand', 'uplink-css-columns' ),
							help: __( 'Pattern: width style color. For example: 1px solid currentColor, thin dashed #999, or 0.125rem double var(--border-color). Longhand settings below take precedence.', 'uplink-css-columns' ),
							value: attributes.upccColumnRule, attributeName: 'upccColumnRule', setAttributes,
						} ),
						el( cssValueControl, {
							label: __( 'Rule width', 'uplink-css-columns' ),
							help: __( 'Leave blank for the browser or theme width. Enter a CSS line width such as 1px, thin, medium, or thick.', 'uplink-css-columns' ),
							value: attributes.upccColumnRuleWidth, attributeName: 'upccColumnRuleWidth', setAttributes,
						} ),
						selectControl( __( 'Rule style', 'uplink-css-columns' ), attributes.upccColumnRuleStyle, ruleStyleOptions, 'upccColumnRuleStyle', setAttributes ),
							el( cssValueControl, {
								label: __( 'Rule color', 'uplink-css-columns' ),
								help: __( 'Leave blank for the browser or theme color. Enter any CSS color, such as currentColor, var(--border-color), oklch(), rgb(), or a hex value.', 'uplink-css-columns' ),
								value: attributes.upccColumnRuleColor,
								attributeName: 'upccColumnRuleColor',
								setAttributes,
							} ),
						selectControl(
							__( 'Rule visibility beside empty items (experimental)', 'uplink-css-columns' ), attributes.upccColumnRuleVisibilityItems,
							[ defaultOption, { label: __( 'Normal', 'uplink-css-columns' ), value: 'normal' }, { label: __( 'All', 'uplink-css-columns' ), value: 'all' }, { label: __( 'Around items', 'uplink-css-columns' ), value: 'around' }, { label: __( 'Between items', 'uplink-css-columns' ), value: 'between' } ],
							'upccColumnRuleVisibilityItems', setAttributes, __( 'Draft CSS feature. Unsupported browsers ignore it.', 'uplink-css-columns' )
						)
					),
					supportsSpan && el(
						PanelBody,
						{ title: __( 'Item behavior', 'uplink-css-columns' ), initialOpen: false },
						selectControl(
							__( 'Span parent columns', 'uplink-css-columns' ), attributes.upccColumnSpan,
							[ defaultOption, { label: __( 'None', 'uplink-css-columns' ), value: 'none' }, { label: __( 'All columns', 'uplink-css-columns' ), value: 'all' } ],
							'upccColumnSpan', setAttributes, __( 'Applies to this block when it is inside a multi-column Group.', 'uplink-css-columns' )
						)
					),
					supportsFragmentation && el(
						PanelBody,
						{ title: __( 'Fragmentation', 'uplink-css-columns' ), initialOpen: false },
						selectControl( __( 'Break before', 'uplink-css-columns' ), attributes.upccBreakBefore, breakBeforeAfterOptions, 'upccBreakBefore', setAttributes, __( 'Control a column, page, or region break before this block.', 'uplink-css-columns' ) ),
						selectControl( __( 'Break after', 'uplink-css-columns' ), attributes.upccBreakAfter, breakBeforeAfterOptions, 'upccBreakAfter', setAttributes, __( 'Control a column, page, or region break after this block.', 'uplink-css-columns' ) ),
						selectControl( __( 'Break inside', 'uplink-css-columns' ), attributes.upccBreakInside, breakInsideOptions, 'upccBreakInside', setAttributes, __( 'Discourage fragmentation within this block.', 'uplink-css-columns' ) )
					),
					supportsColumns && ( hasValue( attributes.upccColumnHeight ) || hasValue( attributes.upccColumnWrap ) || hasValue( attributes.upccColumnRuleVisibilityItems ) ) && el(
						Notice,
						{ status: 'warning', isDismissible: false },
						__( 'One or more draft CSS features are set. Test them in every browser you support; unsupported properties are ignored.', 'uplink-css-columns' )
					),
					el( BaseControl, { className: 'upcc-reset-control', __nextHasNoMarginBottom: true },
						el( Button, { variant: 'secondary', onClick: reset }, supportsColumns
							? __( 'Reset column settings', 'uplink-css-columns' )
							: supportsFragmentation
								? __( 'Reset item settings', 'uplink-css-columns' )
								: __( 'Reset span setting', 'uplink-css-columns' ) )
					)
				)
			)
		);
	}, 'withUpccControls' );

	addFilter( 'editor.BlockEdit', 'upcc/controls', withControls );

	function editorStyleProps( attributes ) {
		const style = {};
		const map = {
			upccColumnCount: '--upcc-column-count',
			upccColumnFill: '--upcc-column-fill',
			upccColumnGap: '--upcc-column-gap',
			upccColumnHeight: '--upcc-column-height',
			upccColumnRule: '--upcc-column-rule',
			upccColumnRuleColor: '--upcc-column-rule-color',
			upccColumnRuleStyle: '--upcc-column-rule-style',
			upccColumnRuleVisibilityItems: '--upcc-column-rule-visibility-items',
			upccColumnRuleWidth: '--upcc-column-rule-width',
			upccColumnWidth: '--upcc-column-width',
			upccColumnWrap: '--upcc-column-wrap',
			upccColumnSpan: '--upcc-column-span',
			upccBreakBefore: '--upcc-break-before',
			upccBreakAfter: '--upcc-break-after',
			upccBreakInside: '--upcc-break-inside',
			upccBlockPadding: '--upcc-block-padding',
			upccBlockMargin: '--upcc-block-margin',
		};

		Object.entries( map ).forEach( ( [ attribute, property ] ) => {
			if ( hasValue( attributes[ attribute ] ) ) {
				style[ property ] = attributes[ attribute ];
			}
		} );

		return style;
	}

	const withEditorPreview = createHigherOrderComponent( ( BlockListBlock ) => ( props ) => {
		if (
			! isContainerBlock( props.name ) &&
			! hasValue( props.attributes.upccColumnSpan ) &&
			! hasValue( props.attributes.upccBreakBefore ) &&
			! hasValue( props.attributes.upccBreakAfter ) &&
			! hasValue( props.attributes.upccBreakInside )
		) {
			return el( BlockListBlock, props );
		}

		const classes = [
			props.className,
			props.attributes.upccColumnsEnabled ? 'upcc-has-css-columns' : '',
			props.attributes.upccColumnsEnabled && hasValue( props.attributes.upccBlockPadding ) ? 'upcc-has-block-padding' : '',
			props.attributes.upccColumnsEnabled && hasValue( props.attributes.upccBlockMargin ) ? 'upcc-has-block-margin' : '',
			hasValue( props.attributes.upccColumnSpan ) ? 'upcc-has-css-column-span' : '',
			( hasValue( props.attributes.upccBreakBefore ) || hasValue( props.attributes.upccBreakAfter ) || hasValue( props.attributes.upccBreakInside ) ) ? 'upcc-has-css-break-control' : '',
		].filter( Boolean ).join( ' ' );

		return el( BlockListBlock, {
			...props,
			className: classes,
			wrapperProps: {
				...( props.wrapperProps || {} ),
				style: { ...( props.wrapperProps?.style || {} ), ...editorStyleProps( props.attributes ) },
			},
		} );
	}, 'withUpccEditorPreview' );

	addFilter( 'editor.BlockListBlock', 'upcc/editor-preview', withEditorPreview );
}() );
