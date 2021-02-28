import {GoogleMap, LoadScript} from '@react-google-maps/api';
import React from "react";
import {tbkCommonF} from "../../typedefs";
import {Alert} from '@material-ui/lab';

declare const TBK: tbkCommonF;

export interface GMapsProps {
    zoom?: number,
    address: string,
}

export interface GMapsState {
    error: boolean | string,
    hidden: boolean
}

export default class GMaps extends React.PureComponent<GMapsProps, GMapsState> {
    constructor(props: GMapsProps) {
        super(props);

        let error: any = false;

        this.state = {
            error : error,
            hidden: true
        }

    }

    private map: google.maps.Map;
    private markers: google.maps.Marker[] = [];

    componentDidUpdate(prevProps: Readonly<GMapsProps>, prevState: Readonly<GMapsState>, snapshot?: any) {
        this._loadMap();
    }

    _showMarkers = () => {
        this._setMapOnAllMarkers(this.map);
    }

    _setMapOnAllMarkers = (map: google.maps.Map | null) => {
        for (let i = 0; i < this.markers.length; i++) {
            this.markers[i].setMap(map);
        }
    }

    _clearMarkers = () => {
        this._setMapOnAllMarkers(null);
    }

    _deleteMarkers = () => {
        this._clearMarkers();
        this.markers = [];
    }

    _loadMap = () => {
        const geocoder = new google.maps.Geocoder();
        const map = this.map;
        geocoder.geocode({
            address: this.props.address
        }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location)

                this._deleteMarkers();

                const marker = new google.maps.Marker({
                    position: results[0].geometry.location,
                    map,
                    title   : this.props.address,
                });

                this.markers.push(marker);

                this.setState({
                    hidden: false
                })

            } else if (status === google.maps.GeocoderStatus.REQUEST_DENIED) {
                this.setState({
                    error: 'This Google API key is not authorized to use the Geocoding Service.'
                })
            } else if (status === google.maps.GeocoderStatus.INVALID_REQUEST || google.maps.GeocoderStatus.ZERO_RESULTS) {
                this.setState({
                    error: "The address can't be geocoded by Google."
                })
            } else {
                console.log(status);
                console.log(results);
            }

        })
    }


    render() {

        if (this.state.error) {
            return <Alert severity={'warning'}>
                {this.state.error}
            </Alert>
        }

        return (
            <LoadScript googleMapsApiKey={TBK.gMapsApiKey} preventGoogleFontsLoading={true}>
                <GoogleMap
                    zoom={this.props.zoom || 16}
                    onLoad={map => {
                        this.map = map;
                        this._loadMap();
                    }}
                    mapContainerStyle={{
                        height : this.state.hidden ? '0px' : '260px',
                        border : '1px solid lightgrey',
                        display: this.state.hidden ? 'none' : 'block',
                    }}
                    options={{
                        mapTypeControl   : false,
                        streetViewControl: false
                    }}
                >

                </GoogleMap>
            </LoadScript>
        );
    }
}