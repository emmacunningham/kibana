/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiSpacer } from '@elastic/eui';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  AnnotationDomainTypes,
  Axis,
  Chart,
  HistogramBarSeries,
  getAnnotationId,
  getAxisId,
  getSpecId,
  LineAnnotation,
  Position,
  ScaleType,
  Settings,
  RectAnnotation,
  TooltipValue,
} from '@elastic/charts';

export interface DiscoverHistogramProps {
  chartData: any; // TODO: make this unknown?
  appState: any;
  onBrush: any;
  visLib: any;
}

export class DiscoverHistogram extends Component<DiscoverHistogramProps> {
  static propTypes = {
    chartData: PropTypes.object,
    appState: PropTypes.object,
    onBrush: PropTypes.func,
    visLib: PropTypes.object,
  };

  render() {
    const { chartData, visLib, appState } = this.props;

    if (!chartData || !chartData.series[0]) {
      return null;
    }

    const data = chartData.series[0].values;
    const format = chartData.xAxisFormat.params.pattern;

    /**
     * Deprecation: [interval] on [date_histogram] is deprecated, use [fixed_interval] or [calendar_interval].
     * see https://github.com/elastic/kibana/issues/27410
     */
    const xInterval = chartData.ordered.interval; // We can remove this line only for versions > 8.x

    const xValues = chartData.xAxisOrderedValues;
    const lastXValue = xValues[xValues.length - 1];

    const formatter = (val: string) => {
      return moment(val).format(format);
    };

    const domain = chartData.ordered;
    const domainStart = domain.min.valueOf();
    const domainEnd = domain.max.valueOf();

    const domainMin = data[0].x > domainStart ? domainStart : data[0].x;
    const domainMax = domainEnd - xInterval > lastXValue ? domainEnd - xInterval : lastXValue;

    const xDomain = {
      min: domainMin,
      max: domainMax,
      minInterval: xInterval,
    };

    // Duplicated from point_series.js
    // Domain end of 'now' will be milliseconds behind current time
    // Extend toTime by 1 minute to ensure those cases have a TimeMarker
    const now = moment();
    const isAnnotationAtEdge = domainEnd + 60000 > now && now > domainEnd;
    const lineAnnotationValue = isAnnotationAtEdge ? domainEnd : now;

    const currentTime = {
      dataValue: lineAnnotationValue,
    };

    const lineAnnotationStyle = {
      line: {
        strokeWidth: 2,
        stroke: '#c80000',
        opacity: 0.3,
      },
    };

    const rectAnnotations = [
      {
        coordinates: {
          x0: domainStart,
        },
        details: 'This area may contain partial data',
      },
      {
        coordinates: {
          x1: domainEnd,
        },
        details: 'This area may contain partial data',
      },
    ];

    const onBrushEnd = (min: number, max: number) => {
      const brushData = {
        aggConfigs: visLib.aggs,
        data: chartData,
        range: [min, max],
      };

      visLib.API.events.brush(brushData, appState);
    };

    // TODO: localize
    const partialDataText =
      'Part of this bucket may contain partial data. The selected time range does not fully cover it.';

    const tooltipHeaderFormater = (headerData: TooltipValue): JSX.Element | string => {
      const headerDataValue = headerData.value;
      const formattedValue = formatter(headerDataValue);

      if (headerDataValue < domainStart || headerDataValue + xInterval > domainEnd) {
        return (
          <React.Fragment>
            <EuiFlexGroup alignItems="center" className="dscHistogram__header--partial">
              <EuiFlexItem grow={false}>
                <EuiIcon type="iInCircle" />
              </EuiFlexItem>
              <EuiFlexItem>{partialDataText}</EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="m" />
            <p>{formattedValue}</p>
          </React.Fragment>
        );
      }

      return formattedValue;
    };

    const tooltipProps = {
      headerFormatter: tooltipHeaderFormater,
    };

    return (
      <Chart>
        <Settings xDomain={xDomain} onBrushEnd={onBrushEnd} tooltip={tooltipProps} />
        <Axis
          id={getAxisId('discover-histogram-left-axis')}
          position={Position.Left}
          title={chartData.yAxisLabel}
        />
        <Axis
          id={getAxisId('discover-histogram-bottom-axis')}
          position={Position.Bottom}
          title={chartData.xAxisLabel}
          tickFormat={formatter}
        />
        <LineAnnotation
          annotationId={getAnnotationId('line-annotation')}
          domainType={AnnotationDomainTypes.XDomain}
          dataValues={[currentTime]}
          hideTooltips={true}
          style={lineAnnotationStyle}
        />
        <RectAnnotation
          dataValues={rectAnnotations}
          annotationId={getAnnotationId('rect-annotation')}
          zIndex={2}
        />
        <HistogramBarSeries
          id={getSpecId('discover-histogram')}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={data}
          timeZone={'local'}
          name={'Count'}
        />
      </Chart>
    );
  }
}
