/** @format */
/**
 * External dependencies
 */
import { Component } from '@wordpress/element';
import { uniqueId } from 'lodash';

/**
 * Internal dependencies
 */
import './setting.scss';
import sanitizeHTML from 'lib/sanitize-html';

export default class Settings extends Component {
	renderInput = () => {
		const { handleChange, name, inputType, options, value } = this.props;
		const id = uniqueId( name );

		switch ( inputType ) {
			case 'checkboxGroup':
				return options.map(
					optionGroup =>
						optionGroup.options.length > 0 && (
							<div className="woocommerce-setting__options-group" key={ optionGroup.key }>
								{ optionGroup.label && (
									<span className="woocommerce-setting__options-group-label">
										{ optionGroup.label }
									</span>
								) }
								{ this.renderCheckboxOptions( optionGroup.options ) }
							</div>
						)
				);
			case 'checkbox':
				return this.renderCheckboxOptions( options );
			default:
				return (
					<input id={ id } type="text" name={ name } onChange={ handleChange } value={ value } />
				);
		}
	};

	renderCheckboxOptions( options ) {
		const { handleChange, name, value } = this.props;

		return options.map( option => {
			const id = uniqueId( name + '-' + option.value );
			return (
				<label htmlFor={ id } key={ option.value }>
					<input
						id={ id }
						type="checkbox"
						name={ name }
						onChange={ handleChange }
						aria-label={ option.description }
						checked={ value && value.includes( option.value ) }
						value={ option.value }
					/>
					{ option.label }
				</label>
			);
		} );
	}

	render() {
		const { helpText, label } = this.props;

		return (
			<div className="woocommerce-setting">
				<div className="woocommerce-setting__label">{ label }</div>
				<div className="woocommerce-setting__options">
					{ this.renderInput() }
					<span
						className="woocommerce-setting__help"
						dangerouslySetInnerHTML={ sanitizeHTML( helpText ) }
					/>
				</div>
			</div>
		);
	}
}