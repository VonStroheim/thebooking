import {GoogleMap, LoadScript, Marker} from '@react-google-maps/api';
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

export default class GMaps extends React.Component<GMapsProps, GMapsState> {
    constructor(props: GMapsProps) {
        super(props);

        let error: any = false;

        this.state = {
            error : error,
            hidden: true
        }

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
                        const geocoder = new google.maps.Geocoder();
                        geocoder.geocode({
                            address: this.props.address
                        }, (results, status) => {
                            if (status === google.maps.GeocoderStatus.OK) {
                                map.setCenter(results[0].geometry.location)

                                new google.maps.Marker({
                                    position: results[0].geometry.location,
                                    map,
                                    title   : this.props.address,
                                });

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
                    }}
                    mapContainerStyle={{
                        height      : this.state.hidden ? '0px' : '260px',
                        borderRadius: '4px'
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