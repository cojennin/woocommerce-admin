/** @format */
/**
 * External dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { charts, filters } from './config';
import getSelectedChart from 'lib/get-selected-chart';
import ReportChart from 'analytics/components/report-chart';
import ReportSummary from 'analytics/components/report-summary';
import TaxesReportTable from './table';
import ReportFilters from 'analytics/components/report-filters';

export default class TaxesReport extends Component {
	getChartMeta() {
		const { query } = this.props;
		const isCompareTaxView = 'compare-taxes' === query.filter;
		const mode = isCompareTaxView ? 'item-comparison' : 'time-comparison';
		const itemsLabel = __( '%d taxes', 'woocommerce-admin' );

		return {
			itemsLabel,
			mode,
		};
	}

	render() {
		const { isRequesting, query, path } = this.props;
		const { mode, itemsLabel } = this.getChartMeta();

		const chartQuery = {
			...query,
		};

		if ( 'item-comparison' === mode ) {
			chartQuery.segmentby = 'tax_rate_id';
		}
		return (
			<Fragment>
				<ReportFilters query={ query } path={ path } filters={ filters } report="taxes" />
				<ReportSummary
					charts={ charts }
					endpoint="taxes"
					isRequesting={ isRequesting }
					query={ chartQuery }
					selectedChart={ getSelectedChart( query.chart, charts ) }
					filters={ filters }
				/>
				<ReportChart
					filters={ filters }
					mode={ mode }
					endpoint="taxes"
					query={ chartQuery }
					path={ path }
					isRequesting={ isRequesting }
					itemsLabel={ itemsLabel }
					selectedChart={ getSelectedChart( query.chart, charts ) }
				/>
				<TaxesReportTable isRequesting={ isRequesting } query={ query } filters={ filters } />
			</Fragment>
		);
	}
}
TaxesReport.propTypes = {
	query: PropTypes.object.isRequired,
};
