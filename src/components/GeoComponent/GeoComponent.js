import React, { useState, useEffect, useMemo } from 'react';
import { csvParse } from 'd3-dsv';
import get from 'axios';
import { geoEqualEarth, geoPath } from "d3-geo";
import { uniq } from 'lodash';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';

import { generatePalette } from '../../helpers/misc';
import { resetIdCounter } from 'vega-lite';

const Input = ({
  value: inputValue,
  onBlur,
  ...props
}) => {
  const [value, setValue] = useState(inputValue)
  useEffect(() => {
    setValue(inputValue)
  }, [inputValue])

  return <input
    value={value}
    onChange={(e) => {
      setValue(e.target.value)
    }}
    onBlur={(e) => {
      onBlur(e.target.value)
    }}
  />
}

const Button = ({
  children,
  onMouseDown,
  ...props
}) => {
  const[isMouseDown, setState] = useState(false)

  useEffect(() => {
    let interval 
    if (isMouseDown){
      console.log("setInterval")
      interval = setInterval(onMouseDown, 100)
    }
    return ()=>{
      console.log("clearInterval")
      clearInterval(interval)
    }
  }, [isMouseDown, onMouseDown])

  return <button 
            {...props} 
            onMouseDown={() => {
              setState(true)
            }}
            onMouseUp={() => {
              setState(false)
            }}
            style={{background: isMouseDown ? 'red' : undefined}}
            > 
            {children} 
          </button>
}


const GeoComponent = ({
  dataFilename,
  backgroundFilename,
  width = 1800,
  height = 1500,
  label,
  markerSize,
  markerColor,
  showLabels,
  centerOnRegion,
  rotationDegree = 0,
  debug = false
}) => {
  // viz params variables
  const [scale, setScale] = useState(200)
  const [rotation, setRotation] = useState(0)
  const [translationX, setTranslationX] = useState(width / 2)
  const [translationY, setTranslationY] = useState(height / 2)

  // raw marker data
  const [data, setData] = useState(null);
  // map background data
  const [backgroundData, setBackgroundData] = useState(null);
  const [colorsMap, setColorsMap] = useState(null);

  const [loadingData, setLoadingData] = useState(true);
  const [loadingBackground, setLoadingBackground] = useState(true);


  /**
   * Marker data loading
   */
  useEffect(() => {
    if (dataFilename) {
      const dataURL = `${process.env.PUBLIC_URL}/data/${dataFilename}`;
      get(dataURL)
        .then(({ data: csvString }) => {
          const newData = csvParse(csvString);

          setData(newData);
          setLoadingData(false);
        })
        .catch((err) => {
          setLoadingData(false);
        })
    }

  }, [dataFilename])

  /**
   * Data aggregation for viz (note : could be personalized if we visualize other things than points)
   */
  const markerData = useMemo(() => {
    if (data) {
      // regroup data by coordinates
      const coordsMap = {};
      data.forEach(datum => {
        const mark = datum.latitude + ',' + datum.longitude;
        if (!coordsMap[mark]) {
          coordsMap[mark] = {
            label: showLabels && label ? datum[label] : undefined,
            latitude: datum.latitude,
            longitude: datum.longitude,
            color: datum[markerColor],
            size: isNaN(+datum[markerSize]) ? 0 : +datum[markerSize]
          }
        } else {
          coordsMap[mark].size += (isNaN(+datum[markerSize]) ? 0 : +datum[markerSize])
        }
      })
      let grouped = Object.entries(coordsMap).map(([_mark, datum]) => datum);
      const colorValues = uniq(grouped.map(g => g.color));
      const palette = generatePalette('map', colorValues.length);
      const thatColorsMap = colorValues.reduce((res, key, index) => ({
        ...res,
        [key]: palette[index]
      }), {});
      setColorsMap(thatColorsMap);

      const sizeExtent = extent(grouped.map(g => g.size));
      const sizeScale = scaleLinear().domain(sizeExtent).range([1, width / 100])
      grouped = grouped.map(datum => ({
        ...datum,
        color: thatColorsMap[datum.color],
        size: sizeScale(datum.size)
      }))
      return grouped;
    }
  }, [data, markerColor, markerSize, width, label, showLabels])

  /**
   * Map background data loading
   */
  useEffect(() => {
    if (backgroundFilename) {
      const backgroundURL = `${process.env.PUBLIC_URL}/data/${backgroundFilename}`;
      get(backgroundURL)
        .then(({ data: bgData }) => {
          setBackgroundData(bgData);
          setLoadingBackground(false);
        })
        .catch((err) => {
          setLoadingBackground(false);
        })
    }

  }, [backgroundFilename])

  /**
   * d3 projection making
   */
  const projection = useMemo(() => {
    let projection = geoEqualEarth() // ce qui vaut dans tous les cas ...
      .scale(scale)
      .translate([translationX, translationY]) // put the center of the map at the center of the box in which the map takes place ?

    if (backgroundData) { // que si center on region
      if (rotationDegree != 0) { // seul cas où on veut une carte tournée pour le moment c'est dans le cas step 1 main viz part 3
        projection
          .angle(rotation)
          .translate([translationX, translationY]) // besoin de décaler la carte vers la droite 
      }
      if (centerOnRegion) {
        projection
          .scale(scale) // 50000 for a centered map
          .center([-1.7475027, 46.573642])
      } else {
        // if bg data is available fit on whole geometry
        projection
          .fitSize([width, height], backgroundData)
      }

    }
    return projection;
  }, [backgroundData, width, height, centerOnRegion, scale, rotation, translationX, translationY])



  if (loadingBackground || loadingData) {
    return (
      <div>Chargement des données ...</div>
    )
  } else if (!backgroundData || !data) {
    return (
      <div>Erreur ...</div>
    )
  }

  const [centerX, centerY] = projection([-1.7475027, 46.573642]);

  return (
    <div>

      {
        debug ?
          <>
            scale: {scale}, rotation: {rotation}, translationX: {translationX}, translationY: {translationY}
            <div>
              <ul>
                <li>
                  <ul>
                    <li>
                      <Button onMouseDown={() => setScale(scale * 1.6)}>scale+</Button>
                    </li>
                    <li>
                      <Button onMouseDown={() => setScale(scale / 1.6)}>scale-</Button>
                    </li>
                    <li>
                      <Input value={scale} placeHolder={"entrez une valeur pour la scale"} onBlur={(str) => {
                        const val = isNaN(+str) ? scale : +str
                        setScale(val)
                      }} />
                    </li>
                  </ul>
                </li>
                <li>
                  <ul>
                    <li>
                      <button onMouseDown={() => { console.log("DOWN !!"); setRotation(rotation + 2) }}>rotation+</button>
                    </li>
                    <li>
                      <button onMouseDown={() => setRotation(rotation - 2)}>rotation-</button>
                    </li>
                  </ul>
                </li>
                <li>
                  <ul>
                    <li>
                      <button onClick={() => setTranslationX(translationX * 1.2)}>translationX+</button>
                    </li>
                    <li>
                      <button onClick={() => setTranslationX(translationX * 0.8)}>translationX-</button>
                    </li>
                    <li>
                      <button onClick={() => setTranslationY(translationY * 1.2)}>translationY+</button>
                    </li>
                    <li>
                      <button onClick={() => setTranslationY(translationY * 0.8)}>translationY-</button>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </>
          : null
      }

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ border: '1px solid lightgrey' }}>
        <g className="background">
          {
            backgroundData.features.map((d, i) => {
              return (
                <path
                  key={`path-${i}`}
                  d={geoPath().projection(projection)(d)}
                  className="geopart"
                  fill={`rgba(38,50,56,${1 / backgroundData.features.length * i})`}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                />
              )
            })
          }
        </g>
        <g className="markers">
          {
            markerData
              .filter(({ latitude, longitude }) => latitude && longitude && !isNaN(latitude) && !isNaN(longitude))
              .map((datum, index) => {
                const { latitude, longitude, size, color, label } = datum;
                const [x, y] = projection([+longitude, +latitude]);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <circle
                      key={index}
                      cx={0}
                      cy={0}
                      r={size}
                      fill={color}
                      className="marker"
                    />
                    {
                      label ?
                        <text
                          x={size + 5}
                          y={size / 2}
                        >
                          {label}
                        </text>
                        : null
                    }
                  </g>
                );
              })
          }
        </g>
        {
          colorsMap ?
            <g className="legend" transform={`translate(${width * .85}, ${height - (Object.keys(colorsMap).length + 1) * 20})`}>
              <g>
                <text style={{ fontWeight: 800 }}>
                  {markerColor}
                </text>
              </g>
              {
                Object.entries(colorsMap)
                  .map(([label, color], index) => {
                    return (
                      <g transform={`translate(0, ${(index + 1) * 20})`}>
                        <rect
                          x={0}
                          y={-8}
                          width={10}
                          height={10}
                          fill={color}
                        />
                        <text x={15} y={0}>
                          {label || 'Indéterminé'}
                        </text>
                      </g>
                    )
                  })
              }
            </g>
            : null
        }
        <circle cx={centerX} cy={centerY} r={5} fill={'red'} />
      </svg>
    </div>
  )
}

export default GeoComponent;
