
import { scaleLinear, scaleBand } from 'd3-scale';
import { extent, range, max } from 'd3-array';
import { useRef, useState, useEffect } from 'react';
import { groupBy } from 'lodash';
import { axisPropsFromTickScale } from 'react-d3-axis';
import Tooltip from 'react-tooltip';
import { uniq } from 'lodash';

import colorsPalettes from '../../colorPalettes';
import { generatePalette } from '../../helpers/misc';

const { generic } = colorsPalettes;


/**
 * BarChart component - returns a <figure> containing a svg linechart
 * 
 * @param {array} data 
 * @param {string} title 
 * @param {string} orientation ['horizontal', 'vertical'] 
 * @param {string} layout ['stack', 'groups'] 
 * @param {width} number 
 * @param {height} number 
 * 
 * @param {object} color
 * @param {string} color.field
 * @param {string} color.title
 * @param {object} color.palette
 * 
 * @param {object} x
 * @param {string} x.field
 * @param {string} x.title
 * @param {number} x.tickSpan
 * @param {function} x.tickFormat
 * @param {array} x.domain
 * @param {object} x.sort
 * @param {string} x.sort.field
 * @param {boolean} x.sort.ascending
 * @param {string} x.sort.type ['number', 'string']
 * 
 * @param {object} x
 * @param {string} y.field
 * @param {string} y.title
 * @param {number} y.tickSpan
 * @param {function} y.tickFormat
 * @param {array} y.domain
 * @param {boolean} y.fillGaps
 * @param {object} y.sort
 * @param {string} y.sort.field
 * @param {boolean} y.sort.ascending
 * @param {string} y.sort.type
 * 
 * @param {object} margins
 * @param {number} margins.left
 * @param {number} margins.top
 * @param {number} margins.right
 * @param {number} margins.bottom
 * 
 * @param {function} tooltip
 * 
 * @returns {react}
 */
const HorizontalBarChart = ({
  data,
  title,
  orientation = 'horizontal',
  layout = 'stack',
  width : initialWidth = 1000,
  height: initialHeight = 400,
  color,
  x,
  y,
  tooltip,
  margins: inputMargins = {}
}) => {
  const [headersHeight, setHeadersHeight] = useState(0);
  const [legendWidth, setLegendWidth] = useState(0);

  const legendRef = useRef(null);
  const headerRef = useRef(null);
  
  const width = initialWidth - legendWidth;
  const height = initialHeight - headersHeight;

  useEffect(() => {
    setTimeout(() => {
      const newHeadersHeight = headerRef.current ?  headerRef.current.getBoundingClientRect().height : 0;
      const newLegendWidth = legendRef.current ?  legendRef.current.getBoundingClientRect().width : 0;
      setHeadersHeight(newHeadersHeight);
      setLegendWidth(newLegendWidth);
    })
  }, [width, height, color, data])
  const margins = {
    left: 100,
    top: 30,
    bottom: 20,
    right: 20,
    ...inputMargins
  };

  const {
    tickFormat: yTickFormat,
    tickSpan: yTickSpan,
    domain: initialYDomain,
    field: yField,
    sort: sortY = {}
  } = y;
  const {
    tickFormat: xTickFormat,
    tickSpan: xTickSpan,
    domain: initialXDomain,
    fillGaps: fillXGaps,
    field: xField,
    sort : sortX = {},
  } = x;
  const {
    field: sortYField = yField,
    ascending: sortYAscending = true,
    type: sortYType = 'number'
  } = sortY;
  const {
    field: sortXField = xField,
    ascending: sortXAscending = true,
    type: sortXType
  } = sortX;
  let colorPalette;
  let colorModalities;
  if (color) {
    colorModalities = uniq(data.map(d => d[color.field]));
  }
  if (color && color.palette) {
    colorPalette = color.palette;
  } else if (color) {
    const colorValues = generatePalette(color.field, colorModalities.length);
    colorPalette = colorModalities.reduce((res, modality, index) => ({
      ...res,
      [modality]: colorValues[index]
    }), {})
  }
  let xValues = uniq(data.filter(d => +d[y.field]).map(d => d[x.field]));
  let vizWidth = width - margins.left - margins.right;

  let xDomain = xValues;
  let bandsNb = xValues.length;
  let columnWidth = vizWidth / bandsNb;
  let xScale = scaleBand().domain(xDomain).range([margins.left + columnWidth / 2, width - margins.right - columnWidth / 2]);

  if (initialXDomain) {
    xDomain = range(initialXDomain);
    xValues = xDomain;
    bandsNb = xValues.length;
    columnWidth = vizWidth / bandsNb;
    xScale = scaleLinear().domain(extent(xDomain)).range([margins.left + columnWidth / 2, width - margins.right - columnWidth / 2]).nice();
  } else if (fillXGaps) {
    const xExtent = extent(xValues.filter(v => +v).map(v => +v));
    if (xTickSpan) {
      xExtent[0] = xExtent[0] - xExtent[0] % xTickSpan;
      xExtent[1] = xExtent[1] + (xTickSpan - xExtent[0] % xTickSpan);
    }
    xDomain = range(xExtent[0], xExtent[1]);
    xValues = xDomain;
    bandsNb = xValues.length;
    columnWidth = vizWidth / bandsNb;
    xScale = scaleLinear().domain(extent(xDomain)).range([margins.left + columnWidth / 2, width - margins.right - columnWidth / 2]).nice();
  }  

  const groups = Object.entries(groupBy(data, d => d[x.field])) // color ? Object.entries(groupBy(data, d => d[color.field])) : [[undefined, data]];

  const yDomain = initialYDomain || layout === 'stack' ? 
    // stack -> max = max sum for a given x modality
    [0, max(
      groups.map(
        ([_groupName, values]) => 
          values.reduce((sum, datum) => sum + +(datum[y.field]), 0)
      )
      )
    ]
    :
    // group -> max = abs max
    [0, max(data.map(d => +d[y.field]))];

    let bandWidth = layout === 'stack' ? columnWidth / 2 : (columnWidth / colorModalities.length) * .5;
    const yScale = scaleLinear().domain(yDomain).range([height - margins.bottom, margins.top]).nice();
    const yStackScale = yScale.copy().range([0, height - margins.bottom - margins.top]);

  

  // let { values: xAxisValues } = axisPropsFromTickScale(xScale);
  const xAxisValues = xValues;
  let { values: yAxisValues } = axisPropsFromTickScale(yScale, 10);

  if (yTickSpan) {
    yDomain[0] = yDomain[0] - yDomain[0] % yTickSpan;
    yDomain[1] = yDomain[1] + (yTickSpan - yDomain[0] % yTickSpan);
    yAxisValues = range(yDomain[0], yDomain[1], yTickSpan);
    yScale.domain(yDomain)
  }
  return (
    <>
      <figure style={{width: initialWidth, height: initialHeight}} className="BarChart is-horizontal GenericVisualization">
        <div ref={headerRef} className="row">
          {title ? <h5 className="visualization-title" style={{ marginLeft: margins.left }}>{title}</h5> : null}
        </div>
        <div className="row vis-row">
          <svg className="chart" width={width} height={height}>
            <g className="axis left-axis ticks">
              <text x={margins.left - 10} y={margins.top - 10} className="axis-title">
                {y.title || y.field}
              </text>
              {
                yAxisValues.map((value, valueIndex) => (
                  <g
                    key={value}
                    transform={`translate(0, ${yScale(value)})`}
                  >
                    <text x={margins.left - 10} y={3}>
                      {typeof yTickFormat === 'function' ? yTickFormat(value, valueIndex) : value}
                    </text>
                    <line
                      className="tick-mark"
                      x1={margins.left - 5}
                      x2={margins.left}
                      y1={0}
                      y2={0}
                    />
                    <line
                      className="background-line"
                      x1={margins.left}
                      x2={xScale(xAxisValues[xAxisValues.length - 1])}
                      y1={0}
                      y2={0}
                    />
                  </g>
                ))
              }
            </g>
            <g className="axis bottom-axis ticks">
              {
                xAxisValues.map((value, valueIndex) => (
                  <g
                    key={value}
                    transform={`translate(${xScale(value)}, 0)`}
                  >
                    <text x={0} y={height - margins.bottom + 20}>
                      {typeof xTickFormat === 'function' ? xTickFormat(value, valueIndex) : value}
                    </text>
                    <line
                      className="background-line"
                      x1={0}
                      x2={0}
                      y1={yScale(yAxisValues[yAxisValues.length - 1])}
                      y2={height - margins.bottom}
                    />
                    <line
                      className="tick-mark"
                      x1={0}
                      x2={0}
                      y1={height - margins.bottom}
                      y2={height - margins.bottom + 5}
                    />
                  </g>
                ))
              }
            </g>
            <g className="bars-container">
              {
                groups
                .sort((a, b) => {
                  const multiplier = sortXAscending ? 1 : -1;
                  if (sortXField === x.field) {
                    const aVal = sortXType === 'number' ? +a[0] : a[0];
                    const bVal = sortXType === 'number' ? +b[0] : b[0];
                    if (aVal < bVal) {
                      return -1 * multiplier;
                    }
                    return 1 * multiplier;
                  }
                  const aVal = sortXType === 'number' ? 
                    +a[1].reduce((sum, datum) => sum + +datum[sortXField], 0) 
                    : a[1][sortXField];
                  const bVal = sortXType === 'number' ? 
                    +b[1].reduce((sum, datum) => sum + +datum[sortXField], 0) 
                    : b[1][sortXField];
                  if (aVal < bVal) {
                    return -1 * multiplier;
                  }
                  return 1 * multiplier;
                  
                })
                .map(([xModality, items], groupIndex) => {
                  let stackDisplaceY = height - margins.bottom;
                  return (
                    <g key={groupIndex} transform={`translate(${xScale(items[0][x.field])}, 0)`}>
                      {
                        items
                        .sort((a, b) => {
                          const multiplier = sortYAscending ? 1 : -1;
                          const aVal = sortYType === 'number' ? +a[sortYField] : a[sortYField];
                          const bVal = sortYType === 'number' ? +b[sortYField] : b[sortYField];
                          if (aVal > +bVal) {
                            return -1 * multiplier;
                          }
                          return 1 * multiplier;
                        })
                        .map((item, itemIndex) => {
                          const thatX = layout === 'stack' ? -bandWidth / 2 : itemIndex * ((columnWidth * .5) / items.length) - columnWidth / 4;
                          const thatHeight = layout === 'stack' ? yStackScale(item[y.field]) : height - margins.bottom - yScale(item[y.field]) || 0;
                          
                          const thatY = layout === 'stack' ? stackDisplaceY - thatHeight : yScale(item[y.field]);
                          if (layout === 'stack') {
                            stackDisplaceY -= thatHeight;
                          }
                          const thatColor = colorPalette ? colorPalette[item[color.field]] : generic.dark;
                          return (
                            <>
                              {
                                +item[y.field] > 0 ?
                                  <rect key={itemIndex}
                                    fill={thatColor}
                                    width={bandWidth}
                                    x={thatX}
                                    y={thatY}
                                    height={thatHeight}
                                    data-for="bar-tooltip"
                                    data-tip={typeof tooltip === 'function' ? tooltip(item, itemIndex, groupIndex) : undefined}
                                  />
                                  : null
                              }
                            </>
                          )
                        })
                      }
                    </g>
                  );
                })
              }
            </g>
          </svg>
          {
            color ?
              <div
                className="ColorLegend"
                ref={legendRef}
                style={{
                  top: headersHeight + margins.top
                }}
              >
                <h5>{color.title || 'Légende'}</h5>
                <ul className="color-legend">
                  {
                    Object.entries(colorPalette)
                      .map(([modality, color]) => (
                        <li
                          key={modality}
                        >
                          <span className="color-box"
                            style={{ background: color }}
                          />
                          <span className="color-label">
                            {modality}
                          </span>
                        </li>
                      ))
                  }
                </ul>
              </div>
              : null
          }
        </div>
      </figure>
      <Tooltip id="bar-tooltip" />
    </>
  )
}

export default HorizontalBarChart;