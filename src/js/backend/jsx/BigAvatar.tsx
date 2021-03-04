import React from "react";
// @ts-ignore
import styles from './BigAvatar.css';
import {Button} from 'primereact/button';

declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface AProps {
    bgImage?: string,
    bgColor?: string,
    border?: boolean,
    borderColor?: string,

    onUpdate(data: any): any
}

interface AState {
    bgImage: string
}

export default class BigAvatar extends React.Component<AProps, AState> {

    constructor(props: AProps) {
        super(props);


        this.state = {
            bgImage: this.props.bgImage
        }

    }

    mediaUploader = () => {
        const image = wp.media({
            title   : __('Upload image', 'thebooking'),
            multiple: false
        }).open()
            .on('select', (e: any) => {
                const uploaded_image = image.state().get('selection').first();
                console.log(uploaded_image.toJSON());
                this.setState({
                    bgImage: uploaded_image.toJSON().sizes.thumbnail.url
                }, () => this.props.onUpdate(uploaded_image.toJSON().id))
            });
    }

    render() {
        const isEmpty = !this.state.bgImage;
        return (
            <div className={styles.container}>
                <div
                    className={styles.avatar}
                    onClick={this.mediaUploader}
                    style={{
                        backgroundImage: isEmpty ? 'none' : 'url(' + this.state.bgImage + ')',
                        borderColor    : this.props.bgColor
                    }}
                >
                    {isEmpty && (
                        <div className={styles.emptyDiv}>
                            <i className="pi pi-image"/>
                        </div>
                    )}
                    <div className={styles.hoverDiv}>
                        <i className="pi pi-image"/>
                    </div>
                </div>
                {!isEmpty && (
                    <Button icon="pi pi-times" className="p-button-rounded p-button-text p-button-plain" onClick={() => {
                        this.setState({
                            bgImage: null
                        }, () => this.props.onUpdate(null))
                    }}/>
                )}
            </div>
        );
    }
}