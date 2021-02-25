import globals from '../../../globals';
import stylesPanel from "../SettingsPanel.css";

const {Button, ButtonGroup} = wp.components;

class SettingButtonGroup extends wp.element.Component {
    constructor(props) {
        super(props);
        this.element = wp.element.createRef();
        this.state = {
            value: props.value || null
        };
    }

    componentDidMount() {
        globals.eventSystem.subscribe('settingsPanelDispatch', this.deliver, this.props.settingId);
    }

    componentWillUnmount() {
        globals.eventSystem.unsubscribe('settingsPanelDispatch', this.props.settingId);
    }

    deliver = (dispatcher) => {
        const panelRef = this.element.current.closest('.' + stylesPanel.settingPanel).dataset.panelRef;
        if (dispatcher.panelRef === panelRef) {
            dispatcher.settings[this.props.settingId] = this.state.value;
        }
    }

    handleChange = (value) => {
        this.setState({value: value});
        globals.eventSystem.trigger('uiPanelSettingUpdated', {
            type   : 'UPDATE_PROP',
            payload: {
                settingId: this.props.settingId,
                props    : {
                    value: value
                }
            }
        });
    }

    render() {
        return (
            <div ref={this.element}>
                <ButtonGroup>
                    {
                        this.props.options.map((option) => {
                            return (<Button
                                isPressed={this.state.value === option.value}
                                isSecondary={this.state.value !== option.value}
                                onClick={() => this.handleChange(option.value)}
                            >
                                {option.label}
                            </Button>);
                        })
                    }
                </ButtonGroup>
            </div>
        )
    }
}

export default SettingButtonGroup;