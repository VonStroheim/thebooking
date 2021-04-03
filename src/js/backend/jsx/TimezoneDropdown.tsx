import {Dropdown} from 'primereact/dropdown';
import React from "react";
import {tbkCommonB} from "../../typedefs";
// @ts-ignore
import styles from './CustomersDropdown.css';

declare const tbkCommon: tbkCommonB;
declare const _: any;

export interface TProps {
    selected: string,
    inDialog?: boolean,

    onChange(e: any): any
}

interface TState {
    mounted: boolean
}

export default class TimezoneDropdown extends React.Component<TProps, TState> {
    private readonly container: React.RefObject<any>;
    private readonly items: any;

    constructor(props: TProps) {
        super(props);

        this.container = React.createRef();
        this.items = this.prepareItems();

        this.state = {
            mounted: false
        }
    }

    componentDidMount() {
        this.setState({mounted: true});
    }

    prepareItems = () => {
        const continents = _.groupBy(tbkCommon.timezoneList, 't_continent');
        delete continents['UTC'];
        return Object.keys(continents).map((continent) => {
            return {
                continent: continent,
                cities   : continents[continent].map((city: any) => {
                    return {
                        name: city.t_city + (city.subcity.length ? ' - ' : '') + city.t_subcity,
                        tz  : city.continent + '/' + city.city + (city.subcity.length ? '/' : '') + city.subcity
                    }
                })
            }
        });
    }

    render() {
        return (
            <div ref={this.container} style={{position: "relative"}} key={'timezoneDropdown'}>
                {this.state.mounted && (
                    <Dropdown
                        options={this.items}
                        optionGroupChildren={'cities'}
                        optionGroupLabel={"continent"}
                        value={this.props.selected}
                        optionValue={'tz'}
                        optionLabel={'name'}
                        appendTo={this.props.inDialog ? this.container.current : null}
                        onChange={this.props.onChange}
                        panelClassName={this.props.inDialog ? styles.panelFix : ''}
                    />
                )}
            </div>
        )

    }
}