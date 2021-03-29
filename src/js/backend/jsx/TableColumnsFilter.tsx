import React from "react";
import {Badge} from "primereact/badge";
import {Button} from "primereact/button";
import {OverlayPanel} from "primereact/overlaypanel";
import {ListBox} from "primereact/listbox";
// @ts-ignore
import tableStyles from "./DataTable.css";
import {Checkbox} from "primereact/checkbox";

declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

interface TProps {
    columns: { label: string, value: string }[],
    selected: string[],

    onChange(selected: string[]): any
}

interface TState {
    selected: string[],
}

export default class TableColumnsFilter extends React.Component<TProps, TState> {
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
                    icon="pi pi-filter"
                    style={{overflow: 'visible'}}
                    tooltip={__('Filter columns', 'thebooking')}
                    onClick={(event) => this.overlay.current.toggle(event)}
                >
                    {this.state.selected.length < this.props.columns.length && (
                        <Badge severity="info" style={
                            {
                                width   : '0.5rem',
                                minWidth: '0.5rem',
                                height  : '0.5rem',
                                top     : '4px',
                                right   : '4px'
                            }
                        }/>
                    )}
                </Button>
                <OverlayPanel
                    ref={this.overlay}
                >
                    <label className={'p-px-3 p-text-bold'}>
                        {__('Columns to display', 'thebooking')}
                    </label>
                    <ListBox
                        className={tableStyles.columnSelector}
                        style={{border: 'none'}}
                        multiple
                        value={this.props.selected}
                        options={this.props.columns}
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