// import {useEffect} from 'react'

// import { Provider } from 'react-redux';
// import { useDispatch } from 'react-redux'
// import store from './store';

// import KeplerGl from 'kepler.gl';
// import {addDataToMap} from 'kepler.gl/actions';


// const WIDTH = 800;
// const HEIGHT = 500;

// const sampleData = [
//   {
//     name: 'Paris',
//     latitude: 48.8588377,
//     longitude: 2.2770201
//   },
//   {
//       name: 'Boulogne',
//       latitude: 48.834854,
//       longitude: 2.222985
//   }
// ]

// function KeplerViz (props) {

//   const dispatch = useDispatch();

//   useEffect(() => {
//     dispatch(
//       addDataToMap({
//         // datasets
//         datasets: {
//           info: {
//             label: 'Sample Taxi Trips in New York City',
//             id: 'test_trip_data'
//           },
//           data: sampleData
//         },
//         // option
//         option: {
//           centerMap: true,
//           readOnly: false
//         },
//         // config
//         config: {
//           mapStyle: {styleType: 'light'}
//         }
//       })
//     )
    
//   }, []);

//   return (
//     <div>
//       <KeplerGl
//         id="map"
//         width={WIDTH}
//         height={HEIGHT}
//         mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
//       />
//     </div>
//   );
// }

// function KeplerComponent (props) {
//     return (
//       <Provider store={store}>
//         <KeplerViz {...{props}} />
//       </Provider>
//     )
// } 

// export default KeplerComponent;

export default () => null;