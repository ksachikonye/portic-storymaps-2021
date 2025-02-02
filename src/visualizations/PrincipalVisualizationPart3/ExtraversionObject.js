import React, { useEffect, useState, useContext } from 'react';
import { animated, useSpring } from 'react-spring';
import cx from 'classnames';
import colorsPalettes from '../../colorPalettes';

import partialCircle from 'svg-partial-circle';
import { max } from 'd3';
import ReactTooltip from 'react-tooltip';
import { fixSvgDimension } from '../../helpers/misc';

import { SettingsContext } from '../../helpers/contexts';
import translate from '../../i18n/translate';


/**
 * Renders custom viz object (triangles + donuts)
 * @param {array<number>} navigoValues
 * @param {number} toflitPct - pct of exports of locally produced products
 * @param {string} transformGroup - css transform
 * @param {number} circleRadius
 * @param {number} width
 * @param {number} height
 * @param {string} name
 * @param {boolean} legendMode
 * @param {boolean} isActive
 * @param {boolean} isMinified
 * @param {function} onClick
 * @returns {React.ReactElement} - React component
 */
const ExtraversionObject = ({
  navigoValues: [metric1, metric2],
  toflitPct,
  transformGroup,
  circleRadius: inputCircleRadius,
  width: inputWidth,
  height: inputHeight,
  name,
  legendMode,
  isActive,
  isMinified,
  onClick,
}) => {
  const circleRadius = fixSvgDimension(inputCircleRadius);
  const width = fixSvgDimension(inputWidth);
  const height = fixSvgDimension(inputHeight);

  const [isInited, setIsInited] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setIsInited(true)
    })
  }, []);

  useEffect(() => {
    ReactTooltip.rebuild();
  })

  const { transform } = useSpring({
    to: {
      transform: transformGroup
    },
    immediate: !isInited
  });


  const maxTriangleHeight = (circleRadius) * 1.4;
  // dimensionning triangles based on their area (and not triangle height)
  // Area = (height * base) / 2;
  const maxArea = maxTriangleHeight * (maxTriangleHeight) / 2;
  const area1 = metric1 * maxArea;
  const area2 = metric2 * maxArea;
  const leftTriangleHeight = Math.sqrt(area1 * metric1);
  const rightTriangleHeight = Math.sqrt(area2 * metric2);

  let start = null
  let end = null
  let leftPath;
  let rightPath;
  if (toflitPct) {
    // let transformGeo = {`translate(${x},${y})`} // ce serzit param qui se mmodifie en attribue de positionnement réparti en bas à droite si co sans coords

    // calcul des angles de départ et d'arrivée de l'arc de cercle, en fonction des données
    start = Math.PI / 2 + (toflitPct - 50) / 100 * Math.PI
    end = Math.PI * 3 / 2 - (toflitPct - 50) / 100 * Math.PI

    leftPath = partialCircle(
      0, 0,         // center X and Y
      circleRadius,              // radius
      start,          // start angle in radians --> Math.PI / 4
      end             // end angle in radians --> Math.PI * 7 / 4
    )
      .map((command) => command.join(' '))
      .join(' ')

    rightPath = partialCircle(
      0, 0,             // center X and Y
      circleRadius,                  // radius
      start,              // start angle in radians --> Math.PI / 4
      end - 2 * Math.PI   // end angle in radians --> Math.PI * 7 / 4
    )
      .map((command) => command.join(' '))
      .join(' ')
  }

  const { lang } = useContext(SettingsContext);

  let labelFontSize = parseInt(height * 0.013);
  labelFontSize = labelFontSize > 8 ? labelFontSize : 8;
  return (
    <animated.g
      className={cx('ExtraversionObject', { 'is-active': isActive, 'is-minified': isMinified })}
      // transform={noOverlapTransform}
      transform={transform}
      onClick={() => typeof onClick === 'function' ? onClick(name) : undefined}
    // { datum.longitude === 0 ? x=1 : null }
    >

      <>
        {
          toflitPct && leftPath != null ?
            <>

              <path
                d={`${leftPath}
                  `}
                stroke={legendMode ? 'darkgrey' : colorsPalettes.generic.accent2}
                strokeWidth={width * 0.005} // à ajuster en fonction de la largeur de l'écran
                fill="transparent"
                data-for="geo-tooltip"
                // data-tip={`${(100 - toflitPct ).toFixed(1)}% de valeur d'exports de produits fabriqués hors de la direction ${typeof onClick === 'function' ? '(cliquer pour voir le détail des ports)' : ''}`}
                data-tip={
                  (lang === 'fr' && translate('viz-principale-partie-3', 'value_export_out', lang, { number: (100 - toflitPct ).toFixed(1), onclick: typeof onClick === 'function' ? '(cliquer pour voir le détail des ports)' : '' })) ||
                  translate('viz-principale-partie-3', 'value_export_out', lang, { number: (100 - toflitPct ).toFixed(1), onclick: typeof onClick === 'function' ? '(click to see the details of the ports)' : '' })
                }
              />

              <path
                d={`${rightPath}
                  `}
                stroke={legendMode ? 'grey' : colorsPalettes.ui.colorAccentBackground}
                strokeWidth={width * 0.005} // à ajuster en fonction de la largeur de l'écran
                fill="transparent"
                data-for="geo-tooltip"
                data-tip={
                  (lang === 'fr' && translate('viz-principale-partie-3', 'value_export_in', lang, { number: (toflitPct).toFixed(1), onclick: typeof onClick === 'function' ? '(cliquer pour voir le détail des ports)' : '' })) ||
                  translate('viz-principale-partie-3', 'value_export_in', lang, { number: (toflitPct).toFixed(1), onclick: typeof onClick === 'function' ? '(click to see the details of the ports)' : '' })
                }
              />
            </>
            :
            null
        }
        <path className='left-triangle'
          fill={legendMode ? 'darkgrey' : colorsPalettes.generic.accent2}
          d={`M ${0} ${-leftTriangleHeight / 2}
            V ${leftTriangleHeight / 2}
            L ${-leftTriangleHeight} ${0}
            Z
                `}
                data-for="geo-tooltip"
                data-tip={
                  (lang === 'fr' && translate('viz-principale-partie-3', 'value_tonnage_out', lang, { number: (metric1 * 100 ).toFixed(1), onclick: typeof onClick === 'function' ? '(cliquer pour voir le détail des ports)' : '' })) ||
                  translate('viz-principale-partie-3', 'value_tonnage_out', lang, { number: (metric1 * 100 ).toFixed(1), onclick: typeof onClick === 'function' ? '(click to see the details of the ports)' : '' })
                }
        />

        <path
          className='right-triangle'
          fill={legendMode ? 'grey' : colorsPalettes.ui.colorAccentBackground}
          d={`M ${0} ${-rightTriangleHeight / 2}
            L ${rightTriangleHeight} ${0}
            L ${0} ${rightTriangleHeight / 2}
            Z
            `}
            data-for="geo-tooltip"
            data-tip={
              (lang === 'fr' && translate('viz-principale-partie-3', 'value_tonnage_in', lang, { number: (metric2 * 100 ).toFixed(1), onclick: typeof onClick === 'function' ? '(cliquer pour voir le détail des ports)' : '' })) ||
              translate('viz-principale-partie-3', 'value_tonnage_in', lang, { number: (metric2 * 100 ).toFixed(1), onclick: typeof onClick === 'function' ? '(click to see the details of the ports)' : '' })
            }
        />
        <g
          transform={`translate(${parseInt(0)}, ${toflitPct ? parseInt(circleRadius) + 15 : max([leftTriangleHeight, rightTriangleHeight]) / 2 + 10})`}
        >
          <text
            className='object-label'
            font-size={labelFontSize}
            textAnchor="middle"
          >
            {name}
          </text>
        </g>
      </>
      {
        legendMode ?
          <g className="legend-container">
            <foreignObject
              width={circleRadius * 2}
              height={circleRadius * 2}
              x={-circleRadius * 3}
              y={-circleRadius * 1.7}
              className="top left"
            >
              <div className="label-wrapper">
                <span>
                  {translate('viz-principale-partie-3', 'foreignObject_export_out', lang)}
                </span>
              </div>
            </foreignObject>
            <line
              x1={-circleRadius * .95}
              y1={-circleRadius * 1.5}
              x2={-circleRadius * .5}
              y2={-circleRadius * 1}
              markerEnd="url(#triangle-end)"
            />
            <foreignObject
              width={circleRadius * 2}
              height={circleRadius * 2}
              x={circleRadius * 1.2}
              y={-circleRadius * 1.7}
              className="top right"
            >
              <div className="label-wrapper">
                <span>
                {translate('viz-principale-partie-3', 'foreignObject_export_in', lang)}
                </span>
              </div>
            </foreignObject>
            <line
              x1={circleRadius * 1.15}
              y1={-circleRadius * 1.5}
              x2={circleRadius * .5}
              y2={-circleRadius * 1}
              markerEnd="url(#triangle-end)"
            />
            <foreignObject
              width={circleRadius * 2}
              height={circleRadius * 2}
              x={-circleRadius * 3}
              y={0}
              className="bottom left"
            >
              <div className="label-wrapper">
                <span>
                  {translate('viz-principale-partie-3', 'foreignObject_flow_out', lang)}
                </span>
              </div>
            </foreignObject>
            <line
              x1={-circleRadius * 1.8}
              y1={circleRadius * .2}
              x2={-circleRadius * .3}
              y2={circleRadius * .1}
              markerEnd="url(#triangle-end)"
            />
            <foreignObject
              width={circleRadius * 2}
              height={circleRadius * 2}
              x={circleRadius * 1.2}
              y={0}
              className="bottom right"
            >
              <div className="label-wrapper">
                <span>
                  {translate('viz-principale-partie-3', 'foreignObject_flow_in', lang)}
                </span>
              </div>
            </foreignObject>
            <line
              x1={circleRadius * 2}
              y1={circleRadius * .2}
              x2={circleRadius * .3}
              y2={circleRadius * .1}
              markerEnd="url(#triangle-end)"
            />

          </g>
          : null
      }
    </animated.g>);
}

export default ExtraversionObject;