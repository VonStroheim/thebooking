// @ts-ignore
import styles from './Form.css';
import React from 'react';
import globals from '../../globals';
import {Button} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Checkbox from './FormElements/Checkbox';
import TextField from './FormElements/TextField';
import FileUpload from './FormElements/FileUpload';
import RadioGroup from './FormElements/RadioGroup';
import Select from './FormElements/Select';
import SelectAddress from './FormElements/SelectAddress';
// @ts-ignore
import jsonLogic, {RulesLogic} from 'json-logic-js';
import {busyReducer} from './App';
import {
    StateAction,
    AllFields,
    tbkCommonF, FormFieldConditionalStates
} from "../../typedefs";

declare const TBK: tbkCommonF;
declare const lodash: any;
declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

export interface DataSubmissionObject {
    [key: string]: {
        value: string | number,
        type: string,
        label: string
    }
}

export interface FormProps {
    fields: { [key: string]: AllFields },
    actions?: any,

    onSubmit(data: any): any
}

interface FormState {
    values: { [key: string]: any },
    isBusy: boolean,
    errors: { [key: string]: any },
    conditionalState: { [key: string]: FormFieldConditionalStates | null },
}

const valueReducer = (state: FormState, action: StateAction) => {
    switch (action.type) {
        case 'CHANGE':
            return {
                ...state,
                values: {...state.values, [action.payload.id]: action.payload.value}
            };
        default:
            return state;
    }
}

const errorReducer = (state: FormState, action: StateAction) => {
    switch (action.type) {
        case 'SET':
            return {
                ...state,
                errors: action.payload
            };
        default:
            return state;
    }
}

const conditionalStateReducer = (state: FormState, action: StateAction) => {
    switch (action.type) {
        case 'SET_CONDITIONAL_STATE':
            return {
                ...state,
                conditionalState: action.payload
            };
        default:
            return state;
    }
}

const redux = globals.combineReducers({
    valueReducer,
    errorReducer,
    busyReducer,
    conditionalStateReducer
});

export default class Form extends React.Component<FormProps, FormState> {

    getInitialState = () => {
        const values = {};
        this.getInitialInputValues(this.props.fields, values);
        return {
            values          : values,
            isBusy          : false,
            errors          : {},
            conditionalState: this.handleLogic(values)
        }
    }

    getInitialInputValues = (fields: { [key: string]: AllFields }, values: { [key: string]: any }) => {
        for (const [key, field] of Object.entries(fields)) {
            if (field.type !== 'paragraph') {
                if (field.type === 'group') {
                    this.getInitialInputValues(field.fields, values);
                } else {
                    values[key] = field.defaultValue;
                }
            }
        }
    }

    constructor(props: FormProps) {
        super(props);

        this.state = this.getInitialState();
    }

    handleInputChange = (field: AllFields, key: string, value: any) => {
        this.setState(redux([
                {
                    type   : 'CHANGE',
                    payload: {
                        id   : key,
                        value: value
                    }
                }
            ], this.state),
            () => {
                const newConditionalStates = this.handleLogic(this.state.values);
                this.setState(redux([
                    {
                        type   : 'SET_CONDITIONAL_STATE',
                        payload: newConditionalStates
                    },
                    {
                        type   : 'SET',
                        payload: this.handleValidation(field, key, this.state.values[key], JSON.parse(JSON.stringify(this.state.errors)), newConditionalStates)
                    }
                ]))
            })
    }

    handleValidation = (field: AllFields, key: string, value: any, errors: any, conditionalStates: { [key: string]: FormFieldConditionalStates | null }) => {
        let isRequired = ('required' in field && field.required) || ('isContact' in field && field.isContact);
        if (typeof conditionalStates[key] !== 'undefined') {
            switch (conditionalStates[key]) {
                case 'hidden':
                    isRequired = false;
                    break;
                case 'visible':
                    break;
                case 'required':
                    isRequired = true;
                    break;
                case 'notRequired':
                    isRequired = false;
                    break;
                default:
                    break;

            }
        }

        if (isRequired && !value) {
            errors[key] = __('This is required.', 'thebooking');
        } else {
            delete errors[key];
        }

        // Clean other errors
        for (const key of Object.keys(errors)) {
            const field = this.props.fields[key];
            let isNotRequired = ('required' in field && !field.required) && ('isContact' in field && !field.isContact);
            if (isNotRequired && conditionalStates[key] !== 'required') {
                delete errors[key];
            }
        }

        return errors;
    }

    handleSubmit = () => {
        const errors = {};
        for (const [key, field] of Object.entries(this.props.fields)) {
            this.handleValidation(field, key, this.state.values[key], errors, this.state.conditionalState);
        }

        this.setState(redux([{type: 'SET', payload: errors}]), () => {
            if (Object.keys(errors).length < 1) {
                this.proceedToSubmit();
            } else {
                this.forceUpdate();
            }
        })
    }

    proceedToSubmit = () => {
        const toSubmit: DataSubmissionObject = {};
        for (const [key, field] of Object.entries(this.props.fields)) {
            if (typeof this.state.values[key] !== 'undefined') {
                toSubmit[key] = {
                    value: this.state.values[key],
                    type : field.type,
                    label: field.label
                }
            }
        }
        this.setState(redux([{type: 'BUSY'}]), () => this.props.onSubmit(toSubmit))
    }

    mapField = (field: AllFields, key: string) => {

        let isRequired = ('required' in field && field.required) || ('isContact' in field && field.isContact);
        if (typeof this.state.conditionalState[key] !== 'undefined') {
            switch (this.state.conditionalState[key]) {
                case 'hidden':
                    break;
                case 'visible':
                    break;
                case 'required':
                    isRequired = true;
                    break;
                case 'notRequired':
                    isRequired = false;
                    break;
                default:
                    break;
            }
        }

        switch (field.type) {
            case 'text':
            case 'number':
                return (
                    <div>
                        <TextField type={field.type}
                                   label={field.label}
                                   value={this.state.values[key]}
                                   required={isRequired}
                                   error={typeof this.state.errors[key] !== 'undefined'}
                                   multiline={'uiType' in field && field.uiType === 'multiline'}
                                   min={'minimum' in field ? field.minimum : null}
                                   max={'maximum' in field ? field.maximum : null}
                                   errorText={typeof this.state.errors[key] !== 'undefined' ? this.state.errors[key] : null}
                                   disabled={this.state.isBusy}
                                   onChange={(e) => {
                                       this.handleInputChange(field, key, field.type === 'number' ? e.target.valueAsNumber : e.target.value);
                                   }}/>
                        <p className={styles.fieldDescription}>{field.description}</p>
                    </div>
                )
            case 'options':
                if ('uiType' in field && field.uiType === 'address' && TBK.gMapsApiKey) {
                    return (
                        <div>
                            <SelectAddress
                                label={field.label}
                                error={typeof this.state.errors[key] !== 'undefined'}
                                errorText={typeof this.state.errors[key] !== 'undefined' ? this.state.errors[key] : null}
                                value={this.state.values[key]}
                                disabled={this.state.isBusy}
                                onChange={(e, selectedOption) => {
                                    this.handleInputChange(field, key, selectedOption === null ? null : selectedOption.description.trim());
                                }}
                            />
                            <p className={styles.fieldDescription}>{field.description}</p>
                        </div>
                    );
                }
                return (
                    <div>
                        <Select
                            options={'options' in field ? field.options : null}
                            label={field.label}
                            required={isRequired}
                            error={typeof this.state.errors[key] !== 'undefined'}
                            errorText={typeof this.state.errors[key] !== 'undefined' ? this.state.errors[key] : null}
                            value={this.state.values[key]}
                            disabled={this.state.isBusy}
                            onChange={(e, selectedOption) => {
                                this.handleInputChange(field, key, selectedOption === null ? null : selectedOption.value.trim());
                            }}

                        />
                        <p className={styles.fieldDescription}>{field.description}</p>
                    </div>
                )
            case 'optionsTODO':
            // const tempName = globals.uuidDOM();
            // return (
            //     <div>
            //         <RadioGroup name={tempName}
            //                     error={field.error}
            //                     errorText={field.errorText}
            //                     required={isRequired}
            //                     label={field.label}
            //                     options={field.options}
            //                     defaultValue={field.value}
            //                     disabled={this.state.isBusy}
            //                     onChange={(e) => {
            //                         field.value = e.target.value;
            //                         this.handleInputChange(field);
            //                     }}/>
            //         <p className={styles.fieldDescription}>{field.description}</p>
            //     </div>
            // )
            case 'boolean':
                return <div>
                    <Checkbox checked={this.state.values[key]}
                              error={typeof this.state.errors[key] !== 'undefined'}
                              errorText={typeof this.state.errors[key] !== 'undefined' ? this.state.errors[key] : null}
                              required={isRequired}
                              label={field.label}
                              disabled={this.state.isBusy}
                              onChange={(e) => {
                                  this.handleInputChange(field, key, e.target.checked);
                              }}/>
                    <p className={styles.fieldDescription}>{field.description}</p>
                </div>
            case 'file':
                return <div>
                    <FileUpload
                        label={field.label}
                        required={isRequired}
                        error={typeof this.state.errors[key] !== 'undefined'}
                        errorText={typeof this.state.errors[key] !== 'undefined' ? this.state.errors[key] : null}
                        disabled={this.state.isBusy}
                        accept={'mimeTypes' in field ? field.mimeTypes : []}
                        maxSize={'maxSize' in field ? field.maxSize : 0}
                        onChange={(fileData) => {
                            this.handleInputChange(field, key, fileData);
                        }}
                    />
                    <p className={styles.fieldDescription}>{field.description}</p>
                </div>
            case 'paragraph':
                return <div dangerouslySetInnerHTML={{__html: globals.sanitizer(field.defaultValue as string)}}/>
            case 'group':
                return <div className={styles.inputGroup}>
                    {this.renderFields(field.fields)}
                </div>
            default:
                return null;
        }
    }

    handleLogic = (values: { [key: string]: any }) => {
        const states: { [key: string]: FormFieldConditionalStates | null } = {};
        for (const [key, field] of Object.entries(this.props.fields)) {
            if ('conditions' in field) {
                if (Array.isArray(field.conditions)) {
                    field.conditions = {};
                }
                if (lodash.isEmpty(field.conditions)) {
                    continue;
                }
                const combinedRule: RulesLogic = {
                    and: []
                };
                for (const [key, rule] of Object.entries(field.conditions)) {
                    combinedRule.and.push(rule);
                }
                states[key] = jsonLogic.apply(combinedRule, values)
            }
        }

        return states;
    }

    renderFields = (fieldsToRender: { [key: string]: AllFields }) => {
        const fields: any[] = [];
        for (const [key, field] of Object.entries(fieldsToRender)) {

            const classes = [styles.fieldContainer];

            if (typeof this.state.conditionalState[key] !== 'undefined') {
                switch (this.state.conditionalState[key]) {
                    case 'hidden':
                        continue;
                    case 'visible':
                        break;
                    default:
                        break;
                }
            }

            fields.push(
                <Grid item xs={12} md={field.type === 'paragraph' ? 12 : 6} key={key} className={classes.join(' ')}>
                    {this.mapField(field, key)}
                </Grid>
            )
        }
        return fields;
    }

    render() {
        return (
            <div className={styles.formContainer}>
                <Grid container spacing={3}>
                    {this.renderFields(this.props.fields)}
                    <Grid item xs={12} className={styles.actions}>
                        {this.props.actions}
                        <Button variant={'contained'} disabled={this.state.isBusy} color={'primary'} onClick={this.handleSubmit}>
                            {__('Book now', 'thebooking')}
                        </Button>
                    </Grid>
                </Grid>
            </div>
        );
    }

}