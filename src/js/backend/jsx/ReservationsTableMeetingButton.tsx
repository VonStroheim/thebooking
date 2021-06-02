import React from "react";
import {ReservationRecordBackend, tbkCommonB} from "../../typedefs";
import {Button} from "primereact/button";
import {OverlayPanel} from "primereact/overlaypanel";

declare const tbkCommon: tbkCommonB;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface RProps {
    reservation: ReservationRecordBackend,
}

export default class ReservationsTableMeetingButton extends React.Component<RProps> {

    private readonly overlay: React.RefObject<OverlayPanel>;

    constructor(props: RProps) {
        super(props);

        this.overlay = React.createRef();
    }

    render() {
        const isDirect = !(this.props.reservation.meta.zoomMeetingId && this.props.reservation.meta.gcal_meet_link);
        return (
            <>
                <Button
                    icon={'pi pi-video'}
                    tooltip={__('Start meeting', 'thebooking')}
                    tooltipOptions={{
                        position: 'top'
                    }}
                    className={'p-button-rounded p-button-text p-button-plain'}
                    onClick={(event) => {
                        if (isDirect) {
                            window.open(this.props.reservation.meta.zoomMeetingId.join_url)
                        } else {
                            this.overlay.current.toggle(event);
                        }
                    }}
                />
                <OverlayPanel ref={this.overlay}>
                    <div className="p-grid">
                        {tbkCommon.modules.includes('zoom') && this.props.reservation.meta.zoomMeetingId && this.props.reservation.meta.zoomMeetingId.join_url && (
                            <div className="p-col-12">
                                <Button
                                    className={'p-col-12'}
                                    label={__('Zoom meeting', 'thebooking')}
                                    onClick={(e) => window.open(this.props.reservation.meta.zoomMeetingId.join_url)}
                                />
                            </div>
                        )}
                        {this.props.reservation.meta.gcal_meet_link && (
                            <div className="p-col-12">
                                <Button
                                    className={'p-col-12'}
                                    label={__('Google Meet', 'thebooking')}
                                    onClick={(e) => window.open(this.props.reservation.meta.gcal_meet_link)}
                                />
                            </div>
                        )}
                    </div>
                </OverlayPanel>
            </>
        )
    }
}