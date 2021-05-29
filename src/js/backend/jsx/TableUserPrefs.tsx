import React from "react";
import {Button} from "primereact/button";
import {OverlayPanel} from "primereact/overlaypanel";
import {ListBox} from "primereact/listbox";
// @ts-ignore
import tableStyles from "./DataTable.css";
import {Checkbox} from "primereact/checkbox";

declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

interface TProps {
    prefs: { label: string, value: string }[],
    selected: string[],

    onChange(selected: string[]): any
}

interface TState {
    selected: string[],
}

export default class TableUserPrefs extends React.Component<TProps, TState> {
    private readonly overlay: React.RefObject<OverlayPanel>;

    constructor(props: TProps) {
        super(props);

        this.overlay = React.createRef();

        this.state = {
            selected: this.props.selected || []
        }
    }

    render() {
        return (
            <>
                <Button
                    className="p-button-rounded p-button-text p-button-plain p-overlay-badge"
                    icon="pi pi-ellipsis-v"
                    style={{overflow: 'visible'}}
                    tooltip={__('Display settings', 'thebooking')}
                    tooltipOptions={{
                        position: 'top'
                    }}
                    onClick={(event) => this.overlay.current.toggle(event)}
                >
                </Button>
                <OverlayPanel
                    ref={this.overlay}
                >
                    <ListBox
                        className={tableStyles.columnSelector}
                        style={{border: 'none'}}
                        multiple
                        value={this.props.selected}
                        options={this.props.prefs}
                        onChange={(e) => {
                            this.setState({selected: e.value}, () => this.props.onChange(this.state.selected))
                        }}
                        itemTemplate={(option: any) => {
                            return (
                                <div className="p-field-checkbox" style={{marginBottom: '0'}}>
                                    <Checkbox name="columns" value={option.value} checked={this.state.selected.indexOf(option.value) !== -1}/>
                                    <label>{option.label}</label>
                                </div>
                            )
                        }
                        }
                    />
                </OverlayPanel>
            </>
        )
    }
}