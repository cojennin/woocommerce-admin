/** @format */
/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import { Component } from '@wordpress/element';
import { escapeRegExp, findIndex, identity, noop } from 'lodash';
import PropTypes from 'prop-types';
import { withFocusOutside, withSpokenMessages } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import List from './list';
import Tags from './tags';
import SearchControl from './control';

/**
 * A search box which autocompletes results while typing, allowing for the user to select an option.
 */
class Autocomplete extends Component {
	static getInitialState() {
		return {
			filteredOptions: [],
			selectedIndex: 0,
			query: '',
		};
	}

	constructor( props ) {
		super( props );
		this.state = this.constructor.getInitialState();

		this.bindNode = this.bindNode.bind( this );
		this.search = this.search.bind( this );
		this.selectResult = this.selectResult.bind( this );
		this.updateSelectedIndex = this.updateSelectedIndex.bind( this );
	}

	bindNode( node ) {
		this.node = node;
	}

	reset() {
		this.setState( this.constructor.getInitialState() );
	}

	handleFocusOutside() {
		this.reset();
	}

	isExpanded() {
		const { filteredOptions, query } = this.state;

		return filteredOptions.length > 0 || query;
	}

	selectResult( option ) {
		const { selected, onChange, query } = this.props;

		// Check if this is already selected
		const isSelected = findIndex( selected, { key: option.key } );
		if ( -1 === isSelected ) {
			this.setState( { query: '' } );
			onChange( [ ...selected, option ], query );
		}

		this.reset();
	}

	updateSelectedIndex( value ) {
		this.setState( { selectedIndex: value } );
	}

	announce( filteredOptions ) {
		const { debouncedSpeak } = this.props;
		if ( ! debouncedSpeak ) {
			return;
		}
		if ( !! filteredOptions.length ) {
			debouncedSpeak(
				sprintf(
					_n(
						'%d result found, use up and down arrow keys to navigate.',
						'%d results found, use up and down arrow keys to navigate.',
						filteredOptions.length,
						'woocommerce-admin'
					),
					filteredOptions.length
				),
				'assertive'
			);
		} else {
			debouncedSpeak( __( 'No results.', 'woocommerce-admin' ), 'assertive' );
		}
	}

	getFilteredOptions( query ) {
		const { excludeSelectedOptions, getSearchExpression, maxResults, options, selected } = this.props;
		const selectedKeys = selected.map( option => option.key );
		const filtered = [];

		// Create a regular expression to filter the options.
		const expression = getSearchExpression( escapeRegExp( query ) );
		const search = expression ? new RegExp( expression, 'i' ) : /^$/;

		for ( let i = 0; i < options.length; i++ ) {
			const option = options[ i ];

			if ( excludeSelectedOptions && selectedKeys.includes( option.key ) ) {
				continue;
			}

			// Merge label into keywords
			let { keywords = [] } = option;
			if ( 'string' === typeof option.label ) {
				keywords = [ ...keywords, option.label ];
			}

			const isMatch = keywords.some( keyword => search.test( keyword ) );
			if ( ! isMatch ) {
				continue;
			}

			filtered.push( option );

			// Abort early if max reached
			if ( maxResults && filtered.length === maxResults ) {
				break;
			}
		}

		return filtered;
	}

	search( event ) {
		const query = event.target.value;

		// @todo Add a hook to alter options or search event before and after filtering.
		const filteredOptions = this.getFilteredOptions( query );
		this.setState( { selectedIndex: 0, filteredOptions, query }, () => this.announce( filteredOptions ) );
	}

	render() {
		const {
			className,
			inlineTags,
			instanceId,
			options,
		} = this.props;
		const { selectedIndex } = this.state;

		const isExpanded = this.isExpanded();
		const { key: selectedKey = '' } = options[ selectedIndex ] || {};
		const listboxId = isExpanded ? `woocommerce-autocomplete__listbox-${ instanceId }` : null;
		const activeId = isExpanded
			? `woocommerce-autocomplete__option-${ instanceId }-${ selectedKey }`
			: null;

		return (
			<div
				className={ classnames( 'woocommerce-autocomplete', className, {
					'has-inline-tags': inlineTags,
				} ) }
				ref={ this.bindNode }
			>
				<SearchControl
					{ ...this.props }
					{ ...this.state }
					activeId={ activeId }
					listboxId={ listboxId }
					isExpanded={ isExpanded }
					onSearch={ this.search }
				/>
				{ ! inlineTags && <Tags { ...this.props } /> }
				{ isExpanded &&
					<List
						{ ...this.props }
						{ ...this.state }
						activeId={ activeId }
						listboxId={ listboxId }
						node={ this.node }
						onChange={ this.updateSelectedIndex }
						onSelect={ this.selectResult }
					/>
				}
			</div>
		);
	}
}

Autocomplete.propTypes = {
	/**
	 * Class name applied to parent div.
	 */
	className: PropTypes.string,
	/**
	 * Exclude already selected options from the options list.
	 */
	excludeSelectedOptions: PropTypes.bool,
	/**
	 * Function to add regex expression to the filter the results, passed the search query.
	 */
	getSearchExpression: PropTypes.func,
	/**
	 * Function called when selected results change, passed result list.
	 */
	onChange: PropTypes.func,
	/**
	 * An array of objects for the options list.  The option along with its key, label and
	 * value will be returned in the onChange event.
	 */
	options: PropTypes.arrayOf(
		PropTypes.shape( {
			isDisabled: PropTypes.bool,
			key: PropTypes.oneOfType( [
				PropTypes.number,
				PropTypes.string,
			] ).isRequired,
			keywords: PropTypes.arrayOf( PropTypes.string ),
			label: PropTypes.string,
			value: PropTypes.any,
		} )
	).isRequired,
	/**
	 * A placeholder for the search input.
	 */
	placeholder: PropTypes.string,
	/**
	 * An array of objects describing selected values. If the label of the selected
	 * value is omitted, the Tag of that value will not be rendered inside the
	 * search box.
	 */
	selected: PropTypes.arrayOf(
		PropTypes.shape( {
			key: PropTypes.oneOfType( [
				PropTypes.number,
				PropTypes.string,
			] ).isRequired,
			label: PropTypes.string,
		} )
	),
	/**
	 * Render tags inside input, otherwise render below input.
	 */
	inlineTags: PropTypes.bool,
	/**
	 * A limit for the number of results shown in the options menu.  Set to 0 for no limit.
	 */
	maxResults: PropTypes.number,
	/**
	 * Render a 'Clear' button next to the input box to remove its contents.
	 */
	showClearButton: PropTypes.bool,
	/**
	 * Render results list positioned statically instead of absolutely.
	 */
	staticResults: PropTypes.bool,
};

Autocomplete.defaultProps = {
	excludeSelectedOptions: true,
	getSearchExpression: identity,
	inlineTags: false,
	onChange: noop,
	maxResults: 0,
	selected: [],
	showClearButton: false,
	staticResults: false,
};

export default compose( [
	withSpokenMessages,
	withInstanceId,
	withFocusOutside, // this MUST be the innermost HOC as it calls handleFocusOutside
] )( Autocomplete );