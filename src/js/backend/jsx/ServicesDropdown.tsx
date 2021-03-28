import {Dropdown} from 'primereact/dropdown';
import React from "react";
import {ServiceRecordBackend, tbkCommonB} from "../../typedefs";

// @ts-ignore
import styles from './CustomersDropdown.css';

declare const tbkCommon: tbkCommonB;

export interface SProps {
    services: {
        [key: number]: ServiceRecordBackend
    },
    selected: string,
    inDialog?: boolean,

    onChange(e: any): any
}

interface SState {
    mounted: boolean
}

export default class ServicesDropdown extends React.Component<SProps, SState> {
    private readonly container: React.RefObject<any>;

    constructor(props: SProps) {
        super(props);

        this.container = React.createRef();

        this.state = {
            mounted: false
        }
    }

    itemTemplate = (option: ServiceRecordBackend) => {
        if (option === null) return;
        return (
            <div className={'p-d-flex p-ai-center'}>
                <div style={{backgroundColor: option.color, width: '2rem', height: '2rem', borderRadius: '50%', flexShrink: 0}} className={'p-mr-2'}>
                </div>
                <div>
                    <div>
                        {option.name}
                    </div>
                </div>
            </div>
        )
    }

    componentDidMount() {
        this.setState({mounted: true});
    }

    render() {
        return (
            <div ref={this.container} style={{position: "relative"}} key={'servicesDropdown'}>
                {this.state.mounted && (
                    <Dropdown
                        options={Object.values(this.props.services)}
                        value={this.props.selected}
                        optionValue={'uid'}
                        optionLabel={'name'}
                        filter
                        appendTo={this.props.inDialog ? this.container.current : null}
                        valueTemplate={this.itemTemplate}
                        itemTemplate={this.itemTemplate}
                        onChange={this.props.onChange}
                        panelClassName={this.props.inDialog ? styles.panelFix : ''}
                    />
                )}
            </div>
        )

    }
}