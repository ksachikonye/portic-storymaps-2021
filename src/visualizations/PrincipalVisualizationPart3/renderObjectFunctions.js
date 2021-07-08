export function renderLabel (datum, projection, {width}) { // à terme on pourrait mettre un objet 
    // console.log("datum : ",datum)
  
    const [x, y] = projection([+datum.longitude, +datum.latitude])
  
    return (
      <g transform={`translate(${x},${y})`}>
        <text size={width*0.05}>{datum.label}</text>
      </g>);
  }


  export function renderStep3Object (datum, projection, { width }) { // à priori plus besoin de datum et de width qui sont déjà passés au composant CustomObjectLayer
  
    const [x, y] = projection([+datum.longitude, +datum.latitude])
    
    let sizeCoef = width * 0.05;
    const totalTonnage = parseFloat(datum.else.cumulated_tonnage_out_region) + parseFloat(datum.else.cumulated_tonnage_in_region)
    // console.log("tonnage total : ",totalTonnage)
  
    if (datum.else.type_of_object === "port") {
      // définition des coefficients de taille des triangles en 3 classes distinctes (pour l'instant la définition des classes est expérimentale)
  
      // se gérerait bien avec un switch
      if (totalTonnage < 1000) { // * 1000
        sizeCoef = width * 0.025
      }
      else {
        if (totalTonnage > 5000) {
          sizeCoef = width * 0.075
        }
      }
    }
  
    const leftTriangleHeight = parseFloat(datum.else.cumulated_tonnage_out_region) / totalTonnage * sizeCoef;
    const rightTriangleHeight = parseFloat(datum.else.cumulated_tonnage_in_region) / totalTonnage * sizeCoef; // je pourrais déduire cette donnée de la taille du triangle gauche
  
    let leftPath = null
    let rightPath = null
  
    if (datum.else.type_of_object === "customs_office") {
  
      const totalValue = parseFloat(datum.else.cumulated_exports_value_from_region) + parseFloat(datum.else.cumulated_exports_value_from_ext)
      const inPercentage = parseFloat(datum.else.cumulated_exports_value_from_region) / totalValue * 100
      // console.log("inPercentage ", datum.label," : ", inPercentage)
  
      const partialCircle = require('svg-partial-circle')
  
      let start = null
      let end = null
      // let transformGeo = {`translate(${x},${y})`} // ce serzit param qui se mmodifie en attribue de positionnement réparti en bas à droite si co sans coords
  
      // calcul des angles de départ et d'arrivée de l'arc de cercle, en fonction des données
      start = Math.PI / 2 + (inPercentage - 50) / 100 * Math.PI
      end = Math.PI * 3 / 2 - (inPercentage - 50) / 100 * Math.PI
  
      leftPath = partialCircle(
        0, 0,         // center X and Y
        leftTriangleHeight + rightTriangleHeight,              // radius
        start,          // start angle in radians --> Math.PI / 4
        end             // end angle in radians --> Math.PI * 7 / 4
      )
        .map((command) => command.join(' '))
        .join(' ')
  
      rightPath = partialCircle(
        0, 0,             // center X and Y
        leftTriangleHeight + rightTriangleHeight,                  // radius
        start,              // start angle in radians --> Math.PI / 4
        end - 2 * Math.PI   // end angle in radians --> Math.PI * 7 / 4
      )
        .map((command) => command.join(' '))
        .join(' ')
  
    }
  
    return (
      <g 
        className='double-triangle' 
        transform={`translate(${x},${y})`}
        // { datum.longitude === 0 ? x=1 : null }
        >
  
        <path className='left-triangle' fill='rgb(39, 129, 141)'
          d={`M ${0} ${0}
                V ${leftTriangleHeight / 2}
                L ${-Math.pow(5, 0.5) * leftTriangleHeight / 2} ${0}
                L ${0} ${-leftTriangleHeight / 2}
                Z
                `}
        />
  
        <path className='right-triangle' fill='rgb(44, 74, 156)'
          d={`M ${0} ${0}
                V ${rightTriangleHeight / 2}
                L ${Math.pow(5, 0.5) * rightTriangleHeight / 2} ${0}
                L ${0} ${-rightTriangleHeight / 2}
                Z
                `}
        />
  
        <text font-size="smaller"> {datum.label} </text>
        
        <>
          {
            // datum.else.type_of_object === "customs_office" ?
            leftPath != null ?
  
              <>
  
                <path
                  d={`${leftPath}
                  `}
                  stroke="blue"
                  stroke-width={width*0.005} // à ajuster en fonction de la largeur de l'écran
                  fill="transparent"
                />
  
                <path
                  d={`${rightPath}
                  `}
                  stroke="red"
                  stroke-width={width*0.005} // à ajuster en fonction de la largeur de l'écran
                  fill="transparent"
                />
              </>
              :
              null
          }
        </>
      </g>);
  }
  