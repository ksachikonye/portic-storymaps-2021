


const CustomObjectLayer = ({ layer, projection, width, height }) => {

    return (
        <g className="CustomObjectsLayer">
          {
            typeof layer.renderObjects === 'function' ?
                layer.renderObjects({data: layer.data, projection, width, height})
            :
            layer.data
              // .filter(({ latitude, longitude }) => latitude && longitude && !isNaN(latitude) && !isNaN(longitude))
              .map((datum, index) => {
                // const { latitude, longitude, size, color, label } = datum;
                // const [x, y] = projection([+longitude, +latitude]);
                return layer.renderObject({ datum, projection, width, height })
              })
          }
        </g>
      );
}

export default CustomObjectLayer;