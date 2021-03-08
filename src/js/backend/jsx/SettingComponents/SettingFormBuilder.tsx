// @ts-ignore
import styles from "./SettingFormBuilder.css";
import {Button} from 'primereact/button';
import {Dropdown} from 'primereact/dropdown';
import {InputText} from 'primereact/inputtext';
import {InputNumber} from 'primereact/inputnumber';
import {InputSwitch} from 'primereact/inputswitch';
import {Checkbox} from 'primereact/checkbox';
import {MultiSelect} from 'primereact/multiselect';
import {Panel} from 'primereact/panel';
import {Editor} from '@tinymce/tinymce-react';
// @ts-ignore
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';
import globals from '../../../globals';

import React from "react";
import {ServiceRecordReservationFormBackend, ServiceRecordReservationFormElementBackend, FormFieldConditionalStates, tbkCommonB} from "../../../typedefs";
import {SelectOption} from "../../../frontend/jsx/FormElements/Select";
import {RulesLogic} from "json-logic-js";

declare const tbkCommon: tbkCommonB;
declare const lodash: any;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface SettingFormBuilderProps {
    settingId: string,
    schema: ServiceRecordReservationFormBackend,

    onChange(value: { [key: string]: any }): any
}

interface SettingFormBuilderState {
    schema: ServiceRecordReservationFormBackend
}

const blankCondition: { [key: string]: RulesLogic } = {
    "DRAFT": {
        "if": [
            {
                "===": [
                    {"var": "DRAFT"}, null
                ]
            },
            null,
            null
        ]
    }
};

class SettingFormBuilder extends React.Component<SettingFormBuilderProps, SettingFormBuilderState> {

    constructor(props: SettingFormBuilderProps) {

        super(props);

        let elements = props.schema.elements || {};
        if (Array.isArray(elements)) {
            elements = {};
        }
        let conditions = props.schema.conditions || {};
        if (Array.isArray(conditions)) {
            conditions = {};
        }

        this.state = {
            schema: {
                elements  : elements,
                required  : props.schema.required || [],
                order     : props.schema.order || [],
                active    : props.schema.active || [],
                conditions: conditions
            }
        }
    }

    handleChange = () => {
        this.props.onChange({
            [this.props.settingId]: this.state.schema
        })
    }

    onDragEnd = (result: any) => {
        if (!result.destination) {
            return;
        }

        const order = this.reorder(
            result.source.index,
            result.destination.index
        );

        this.setState({
            schema: {...this.state.schema, ...{order: order}}
        }, this.handleChange);
    }

    removeSchemaItem = (key: string) => {
        const props = this.state.schema.elements;
        delete props[key];
        const conditions = this.state.schema.conditions;
        delete conditions[key];

        for (const [propKey, value] of Object.entries(conditions)) {
            delete value[key];
            if (lodash.isEmpty(value)) {
                delete conditions[propKey];
            }
        }

        const required = this.state.schema.required;
        const requiredIndex = required.indexOf(key);
        if (requiredIndex !== -1) {
            required.splice(requiredIndex, 1);
        }

        const active = this.state.schema.active;
        const activeIndex = active.indexOf(key);
        if (activeIndex !== -1) {
            active.splice(activeIndex, 1);
        }

        const order = this.state.schema.order;
        const orderIndex = order.indexOf(key);
        if (orderIndex !== -1) {
            order.splice(orderIndex, 1);
        }
        this.setState({
            schema: {
                ...this.state.schema,
                ...{conditions: conditions},
                ...{elements: props},
                ...{required: required},
                ...{order: order},
                ...{active: active},
            }
        }, this.handleChange)
    }

    addSchemaItem = (type: string) => {
        const props = this.state.schema.elements;
        const propKey = 'formField_' + globals.uuidDOM();
        switch (type) {
            case 'text':
                props[propKey] = {
                    type            : 'text',
                    description     : '',
                    hideIfRegistered: false,
                    label           : __('New text field', 'thebooking'),
                }
                break;
            case 'checkbox':
                props[propKey] = {
                    type            : 'boolean',
                    description     : '',
                    label           : __('New checkbox', 'thebooking'),
                    defaultValue    : false,
                    hideIfRegistered: false,
                }
                break;
            case 'number':
                props[propKey] = {
                    type            : 'number',
                    description     : '',
                    label           : __('New number field', 'thebooking'),
                    minimum         : 0,
                    maximum         : 1000,
                    hideIfRegistered: false,
                }
                break;
            case 'options':
                props[propKey] = {
                    type            : 'options',
                    description     : '',
                    label           : __('New options', 'thebooking'),
                    options         : [
                        {
                            value: __('Option 1', 'thebooking'),
                            label: __('Option 1', 'thebooking'),
                        },
                        {
                            value: __('Option 2', 'thebooking'),
                            label: __('Option 2', 'thebooking'),
                        },
                        {
                            value: __('Option 3', 'thebooking'),
                            label: __('Option 3', 'thebooking'),
                        }
                    ],
                    uiType          : 'radio',
                    hideIfRegistered: false,
                }
                break;
            case 'file':
                props[propKey] = {
                    type            : 'file',
                    description     : '',
                    label           : __('New file upload', 'thebooking'),
                    maxSize         : 20,
                    mimeTypes       : [],
                    hideIfRegistered: false,
                }
                break;
            case 'paragraph':
                props[propKey] = {
                    type            : 'paragraph',
                    description     : '',
                    label           : __('New paragraph', 'thebooking'),
                    defaultValue    : '',
                    hideIfRegistered: false,
                }
                break;
        }

        const order = this.state.schema.order;
        order.push(propKey)

        const active = this.state.schema.active;
        active.push(propKey)

        this.setState({
            schema: {
                ...this.state.schema,
                ...{
                    elements: props
                },
                ...{
                    order: order
                },
                ...{
                    active: active
                }
            }
        }, this.handleChange)
    }

    updateSchemaConditionals = (property: string, childKey: string, rulePart: string, value: any) => {

        const getOppositeState = (state: FormFieldConditionalStates | null) => {
            switch (state) {
                case "hidden":
                    return 'visible';
                case "visible":
                    return 'hidden';
                case "required":
                    return 'notRequired';
                case "notRequired":
                    return 'required';
                default:
                    return null;
            }
        }

        let conditions = this.state.schema.conditions[property] || blankCondition;

        if (Array.isArray(conditions)) {
            conditions = {};
        }

        const newCondition = conditions[childKey] || conditions['DRAFT'];

        if (rulePart === 'childKey' && childKey !== value) {
            delete conditions[childKey];
            if (typeof newCondition === 'object' && 'if' in newCondition) {
                const operator: string = Object.keys(newCondition.if[0])[0];
                newCondition.if[0] = {
                    [operator]: [
                        {"var": value},
                        null,
                    ]
                }
                conditions[value] = newCondition;
            }
        } else if (rulePart === 'condition') {
            if (typeof newCondition === 'object' && 'if' in newCondition) {
                const operator: string = Object.keys(newCondition.if[0])[0];
                newCondition.if[0] = {
                    [operator]: [
                        newCondition.if[0][operator][0],
                        value,
                    ]
                }
                conditions[childKey] = newCondition;
            }
        } else if (rulePart === 'operator') {
            if (typeof newCondition === 'object' && 'if' in newCondition) {
                const OLDoperator: string = Object.keys(newCondition.if[0])[0];
                newCondition.if[0] = {
                    [value]: [
                        newCondition.if[0][OLDoperator][0],
                        newCondition.if[0][OLDoperator][1],
                    ]
                }
                conditions[childKey] = newCondition;
            }
        } else if (rulePart === 'state') {
            if (typeof newCondition === 'object' && 'if' in newCondition) {
                if (value === null) {
                    delete conditions[childKey];
                } else {
                    newCondition.if[1] = value;
                    newCondition.if[2] = getOppositeState(value);
                    conditions[childKey] = newCondition;
                }
            }
        }

        const allConditions = this.state.schema.conditions;
        if (lodash.isEmpty(conditions)) {
            delete allConditions[property];
        } else {
            allConditions[property] = conditions;
        }

        this.setState({
            schema: {
                ...this.state.schema,
                ...{
                    conditions: allConditions
                }
            }
        }, this.handleChange)
    }

    updateSchemaProperty = (property: string, key: keyof ServiceRecordReservationFormElementBackend, value: any) => {
        const prop = this.state.schema.elements[property];
        if (value === null) {
            delete prop[key];
        } else {
            // @ts-ignore
            prop[key] = value;
        }
        this.setState({
            schema: {
                ...this.state.schema,
                ...{
                    elements: {
                        ...this.state.schema.elements,
                        ...{
                            [property]: prop
                        }
                    }
                }
            }
        }, this.handleChange);
    }

    updateSchemaOptions = (property: string, value: SelectOption, index: number) => {
        const options = this.state.schema.elements[property].options;
        const oldValue = options[index];

        options[index] = value;

        this.updateSchemaProperty(property, 'options', options);

        // for (const [propKey, propValue] of Object.entries(this.state.schema.conditions)) {
        //     propValue.forEach((n) => {
        //         if (n.condIf === property && n.condIs === oldValue) {
        //             this.updateSchemaConditionals(propKey, n.condIf, value, n.condThen);
        //         }
        //     })
        // }
    }

    addSchemaOption = (property: string) => {
        const options = this.state.schema.elements[property].options;
        options.push({
            label     : __('New option', 'thebooking') + ' ' + options.length,
            value     : __('New option', 'thebooking') + ' ' + options.length,
            additional: ''
        });
        this.updateSchemaProperty(property, 'options', options);
    }

    removeSchemaOption = (property: string, index: number) => {
        const options = this.state.schema.elements[property].options;
        const option = options[index];
        const conditions = this.state.schema.conditions;

        // for (const [propKey, value] of Object.entries(conditions)) {
        //     conditions[propKey] = value.flatMap((n) => {
        //         return (n.condIf === property && n.condIs === option) ? [] : [n]
        //     })
        //     if (conditions[propKey].length < 1) {
        //         delete conditions[propKey];
        //     }
        // }

        this.setState({
            schema: {
                ...this.state.schema,
                ...{
                    conditions: conditions
                }
            }
        })

        options.splice(index, 1);

        this.updateSchemaProperty(property, 'options', options);
        this.forceUpdate();
    }

    renderDependsOnHelper = (condition: { [key: string]: RulesLogic }) => {
        if (!lodash.isEmpty(condition)) {
            let propKey: string;
            for (let key in condition) {
                propKey = key;
                break;
            }
            if (propKey !== 'DRAFT') {
                const rule = condition[propKey];
                if (typeof rule === 'object' && 'if' in rule) {
                    const operator: string = Object.keys(rule.if[0])[0];
                    if (rule.if[1] && rule.if[0][operator][1]) {
                        return (
                            <span className={styles.dependsOn}>
                                <i className={'pi pi-reply'}/>
                                {sprintf(__('depends on %s', 'thebooking'), this.state.schema.elements[propKey].label)}
                            </span>
                        )
                    }
                }
            }
        }
    }

    schemaPropIs = (prop: ServiceRecordReservationFormElementBackend) => {
        if (prop.type === 'options') {
            return 'options';
        }
        if (prop.type === 'paragraph') {
            return 'paragraph';
        }
        if (prop.type === 'text') {
            return 'text';
        }
        if (prop.type === 'boolean') {
            return 'checkbox';
        }
        if (prop.type === 'file') {
            return 'file';
        }
        if (prop.type === 'number') {
            return 'number';
        }
    }

    parseSchema = (propKey: string, dragHandleProps: any) => {
        const prop = this.state.schema.elements[propKey];
        if (!prop) {
            console.log('Something went wrong, check database consistency.');
            return;
        }
        const header =
            <div className={styles.fieldHeader} {...dragHandleProps}>
                    <span>
                        <i className={['pi pi-ellipsis-v', styles.handleIcon].join(' ')}/>
                        <i className={['pi pi-ellipsis-v', styles.handleIcon].join(' ')}/>
                        {prop.label}
                        {(this.state.schema.required.includes(propKey) || propKey === 'email') && (
                            <span className={styles.requiredSymbol}>*</span>
                        )}
                        {this.state.schema.conditions[propKey]
                        && propKey !== 'email'
                        && this.renderDependsOnHelper(this.state.schema.conditions[propKey])}
                    </span>
                <span style={{display: 'flex', alignItems: 'center'}}>
                    {!['email'].includes(propKey) && (
                        <InputSwitch
                            id={propKey + 'fieldIsActive'}
                            style={{marginRight: '6px', zoom: '0.7'}}
                            checked={this.state.schema.active.includes(propKey)}
                            onChange={(e) => {
                                this.setState({
                                    schema: {...this.state.schema, ...{active: lodash.xor(this.state.schema.active, [propKey])}}
                                }, this.handleChange);
                            }}
                        />
                    )}
                    {!['email', 'phone', 'name'].includes(propKey) && (
                        <Button
                            icon={'pi pi-trash'}
                            style={{marginRight: '6px'}}
                            className={['p-panel-header-icon', styles.deleteField].join(' ')}
                            onClick={(e) => {
                                this.removeSchemaItem(propKey)
                            }}
                        />
                    )}
                </span>

            </div>
        return <Panel header={header} toggleable collapsed={true} key={propKey}>
            <div className="p-fluid p-formgrid p-grid">
                <div className="p-field p-col-12 p-lg-6">
                    <label htmlFor={propKey + 'label'} className={'p-d-block'}>{__('Label', 'thebooking')}</label>
                    <InputText
                        id={propKey + 'label'}
                        className={'p-d-block'}
                        value={prop.label}
                        onChange={(e: any) => {
                            this.updateSchemaProperty(propKey, 'label', e.target.value);
                        }}
                    />
                </div>
                <div className="p-field p-col-12 p-lg-6">
                    <label htmlFor={propKey + 'description'} className={'p-d-block'}>{__('Description', 'thebooking')}</label>
                    <InputText
                        id={propKey + 'description'}
                        className={'p-d-block'}
                        value={prop.description}
                        onChange={(e: any) => {
                            this.updateSchemaProperty(propKey, 'description', e.target.value);
                        }}
                    />
                </div>

                {this.schemaPropIs(prop) === 'paragraph' && (
                    <div className="p-field p-col-12">
                        <Editor
                            tinymceScriptSrc={tbkCommon.pluginUrl + 'js/backend/tiny/tinymce.min.js'}
                            value={String(prop.defaultValue)}
                            init={{
                                menubar      : false,
                                relative_urls: false,
                                plugins      : 'fullscreen preview code link',
                                toolbar      : 'undo redo | fullscreen preview code | bold italic | forecolor backcolor | alignleft aligncenter alignright alignjustify | outdent indent | removeformat link'
                            }}
                            onEditorChange={(content) => this.updateSchemaProperty(propKey, 'defaultValue', content)}
                        />
                    </div>
                )}

                {this.schemaPropIs(prop) !== 'paragraph' && propKey !== 'email' && (
                    <div className="p-field-checkbox p-col-12 p-lg-6">
                        <Checkbox
                            inputId={propKey + 'required'}
                            checked={this.state.schema.required.includes(propKey)}
                            onChange={(e) => {
                                this.setState({
                                    schema: {...this.state.schema, ...{required: lodash.xor(this.state.schema.required, [propKey])}}
                                }, this.handleChange);
                            }}
                        />
                        <label htmlFor={propKey + 'required'}>{__('Required', 'thebooking')}</label>
                    </div>
                )}

                {this.schemaPropIs(prop) === 'text' && (
                    <div className="p-field-checkbox p-col-12 p-lg-6">
                        <Checkbox
                            inputId={propKey + 'multiline'}
                            checked={prop.uiType === 'multiline'}
                            onChange={(e) => {
                                this.updateSchemaProperty(propKey, 'uiType', e.checked ? 'multiline' : null);
                            }}
                        />
                        <label htmlFor={propKey + 'required'}>{__('Multiline', 'thebooking')}</label>
                    </div>
                )}

                {this.schemaPropIs(prop) === 'file' && (
                    <>
                        <div className="p-field p-col-12 p-lg-6">
                            <label htmlFor={propKey + 'maxSize'} className={'p-d-block'}>{__('Size limit', 'thebooking')}</label>
                            <InputNumber
                                id={propKey + 'maxSize'}
                                min={1}
                                suffix={'MB'}
                                showButtons
                                value={prop.maxSize}
                                onValueChange={(e) => {
                                    this.updateSchemaProperty(propKey, 'maxSize', e.value);
                                }}
                            />
                        </div>
                        <div className="p-field p-col-12">
                            <label htmlFor={propKey + 'mimeTypes'} className={'p-d-block'}>{__('Allowed file types', 'thebooking')}</label>
                            <MultiSelect
                                id={propKey + 'mimeTypes'}
                                optionLabel={'desc'}
                                optionValue={'mime'}
                                filter={false}
                                options={globals.mimeTypes()}
                                value={prop.mimeTypes}
                                onChange={(e) => {
                                    this.updateSchemaProperty(propKey, 'mimeTypes', e.value);
                                }}
                            />
                        </div>
                    </>
                )}

                {this.schemaPropIs(prop) === 'number' && (
                    <>
                        <div className="p-field p-col-12 p-lg-3">
                            <label htmlFor={propKey + 'min'} className={'p-d-block'}>{__('Min', 'thebooking')}</label>
                            <InputNumber
                                id={propKey + 'min'}
                                min={0}
                                max={prop.maximum - 1}
                                value={prop.minimum}
                                showButtons
                                onValueChange={(e) => {
                                    this.updateSchemaProperty(propKey, 'minimum', e.value);
                                }}
                            />
                        </div>
                        <div className="p-field p-col-12 p-lg-3">
                            <label htmlFor={propKey + 'max'} className={'p-d-block'}>{__('Max', 'thebooking')}</label>
                            <InputNumber
                                id={propKey + 'max'}
                                min={1}
                                value={prop.maximum}
                                showButtons
                                onValueChange={(e) => {
                                    this.updateSchemaProperty(propKey, 'maximum', e.value);
                                }}
                            />
                        </div>
                    </>
                )}

            </div>
            {this.schemaPropIs(prop) === 'options' && this.optionsPanel(propKey)}
            {this.schemaPropIs(prop) === 'text' && propKey !== 'email' && this.validationPanel(propKey)}
            {propKey !== 'email' && this.conditionalPanel(propKey)}
            {this.advancedPanel(propKey)}
        </Panel>
    }

    reorder = (startIndex: number, endIndex: number) => {
        const result = Array.from(this.state.schema.order);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    };

    optionsPanel = (key: string) => {
        const options = this.state.schema.elements[key].options;
        const header =
            <span>
            Options
            <span className={styles.numberOfOptions}>
                ({options.length})
            </span>
        </span>
        return (
            <Panel header={header} className={styles.innerPanel} toggleable collapsed={true}>
                <div className="p-fluid p-formgrid p-grid">

                    {options.map((option, i) => (
                        <div className={'p-field p-col-12'}>
                            <div className={'p-inputgroup'}>
                                <InputText value={option.value} onChange={(e: any) => this.updateSchemaOptions(key, {
                                    value     : e.target.value,
                                    label     : e.target.value,
                                    additional: ''
                                }, i)}/>
                                <Button
                                    icon={'pi pi-times'}
                                    className={'p-button-danger p-button-text'}
                                    onClick={() => this.removeSchemaOption(key, i)}
                                />
                            </div>
                        </div>
                    ))}

                    <div className={'p-field p-col-12'}>
                        <Button
                            label={'Add'}
                            icon={'pi pi-plus'}
                            className={'p-button-sm p-button-secondary'}
                            onClick={() => this.addSchemaOption(key)}
                        />
                    </div>
                </div>
            </Panel>
        )
    }

    conditionalPanel = (key: string) => {
        const otherFields = [];
        const otherFieldsValidTypes = ['options', 'checkbox', 'number']

        const FieldStates: { value: FormFieldConditionalStates, label: string }[] = (this.schemaPropIs(this.state.schema.elements[key]) === 'paragraph')
            ? [
                {value: 'visible', label: __('Visible', 'thebooking')},
                {value: 'hidden', label: __('Hidden', 'thebooking')}
            ]
            : [
                {value: 'visible', label: __('Visible', 'thebooking')},
                {value: 'hidden', label: __('Hidden', 'thebooking')},
                {value: 'required', label: __('Required', 'thebooking')},
                {value: 'notRequired', label: __('Not required', 'thebooking')},
            ];

        for (const [propKey, prop] of Object.entries(this.state.schema.elements)) {
            const propType = this.schemaPropIs(prop);
            if (key !== propKey && (otherFieldsValidTypes.includes(propType))) {
                let options: any[] = [];
                switch (propType) {
                    case 'checkbox':
                        options = [{label: __('Checked', 'thebooking'), value: true}, {label: __('Not checked', 'thebooking'), value: false}];
                        break;
                    case 'options':
                        options = prop.options.map(option => (
                            {label: option.label, value: option.value}
                        ))
                        break;
                    case 'number':
                        options = [
                            {label: __('Greated than', 'thebooking'), value: '>'},
                            {label: __('Less than', 'thebooking'), value: '<'},
                            {label: __('Equal to', 'thebooking'), value: '='}
                        ];
                        break;
                }
                otherFields.push({
                    value  : propKey,
                    label  : prop.label,
                    options: options
                });
            }
        }

        const currentConditions: { [key: string]: RulesLogic } = this.state.schema.conditions[key] || blankCondition;

        const stacks: any[] = [];

        for (const [childKey__VALUE1, currentCondition] of Object.entries(currentConditions)) {
            const IF_CONDS: RulesLogic[] = (typeof currentCondition === 'object' && 'if' in currentCondition) ? currentCondition.if : null;

            /**
             * Sectioning the JSONlogic IF rule (3 parts, IF THEN ELSE)
             */
            if (IF_CONDS) {
                const CONDITION: RulesLogic | null = IF_CONDS[0];
                const STATE__VALUE2: string | null = IF_CONDS[1] as string;
                const OPERATOR: string = Object.keys(CONDITION)[0];
                const CONDITION_IS__VALUE3 = CONDITION[OPERATOR as keyof RulesLogic][1];

                const currentValues = otherFields.filter(obj => {
                    return obj.value === childKey__VALUE1
                });
                const isOptions = currentValues[0] ? currentValues[0].options : [];

                stacks.push(
                    <div className={'p-fluid p-formgrid p-grid'}>
                        <div className={'p-field p-col-12'}>
                            <label htmlFor={key + 'conditional_THEN'} className={'p-d-block'}>
                                {__('The field is', 'thebooking')}
                            </label>
                            <Dropdown
                                inputId={key + 'conditional_THEN'}
                                value={STATE__VALUE2}
                                options={FieldStates}
                                placeholder={otherFields.length < 1 ? __('No valid fields in this form', 'thebooking') : __('Select a state', 'thebooking')}
                                disabled={otherFields.length < 1}
                                showClear
                                onChange={(e) => {
                                    this.updateSchemaConditionals(key, childKey__VALUE1, 'state', e.value);
                                }}
                            />
                        </div>
                        <div className={'p-field p-col-12'}>
                            <label htmlFor={key + 'conditional_IF'} className={'p-d-block'}>
                                {__('depending on', 'thebooking')}
                            </label>
                            <Dropdown
                                inputId={key + 'conditional_IF'}
                                value={childKey__VALUE1}
                                options={otherFields}
                                placeholder={otherFields.length < 1 ? __('No valid fields in this form', 'thebooking') : __('Select a field', 'thebooking')}
                                disabled={otherFields.length < 1}
                                onChange={(e: any) => {
                                    this.updateSchemaConditionals(key, childKey__VALUE1, 'childKey', e.value);
                                }}
                            />
                        </div>
                        {childKey__VALUE1 && this.state.schema.elements[childKey__VALUE1] && (
                            <>
                                <div className={'p-field p-col-12 ' + (this.schemaPropIs(this.state.schema.elements[childKey__VALUE1]) === 'number' ? 'p-lg-6' : '')}>
                                    <label htmlFor={key + 'conditional_IS'} className={'p-d-block'}>
                                        {__('being', 'thebooking')}
                                    </label>
                                    <Dropdown
                                        inputId={key + 'conditional_IS'}
                                        value={this.schemaPropIs(this.state.schema.elements[childKey__VALUE1]) === 'number' ? OPERATOR : CONDITION_IS__VALUE3}
                                        options={isOptions}
                                        placeholder={isOptions.length < 2 ? __('Parent field options must be 2 or more', 'thebooking') : __('Select a value', 'thebooking')}
                                        disabled={isOptions.length < 2}
                                        onChange={(e: any) => {
                                            this.updateSchemaConditionals(
                                                key,
                                                childKey__VALUE1,
                                                this.schemaPropIs(this.state.schema.elements[childKey__VALUE1]) === 'number' ? 'operator' : 'condition',
                                                e.value);
                                        }}
                                    />
                                </div>
                                {this.schemaPropIs(this.state.schema.elements[childKey__VALUE1]) === 'number' && (
                                    <div className={'p-field p-col-12 p-lg-6'}>
                                        <label htmlFor={key + 'conditional_IS_1'} className={'p-d-block'}>
                                            {__('this number', 'thebooking')}
                                        </label>
                                        <InputNumber
                                            inputId={key + 'conditional_IS_1'}
                                            value={CONDITION_IS__VALUE3}
                                            min={this.state.schema.elements[childKey__VALUE1].minimum}
                                            max={this.state.schema.elements[childKey__VALUE1].maximum}
                                            showButtons
                                            onChange={(e) => {
                                                this.updateSchemaConditionals(key, childKey__VALUE1, 'condition', e.value);
                                            }}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            }


        }

        return (
            <Panel header={'Conditional'} className={styles.innerPanel} toggleable collapsed={true}>
                {stacks}
            </Panel>
        );
    }

    validationPanel = (key: string) => {
        return (
            <Panel header={'Validation'} className={styles.innerPanel} toggleable collapsed={true}>
                <div className="p-fluid p-formgrid p-grid">
                    <div className={'p-field p-col-12'}>
                        <label htmlFor={key + 'pattern'} className={'p-d-block'}>
                            {__('Regex', 'thebooking')} (<a target={'_blank'} href={'https://regex101.com/library'}>{__('Need help with regex expressions?', 'thebooking')}</a>)
                        </label>
                        <InputText
                            id={key + 'pattern'}
                            className={'p-d-block'}
                            value={this.state.schema.elements[key].pattern || ''}
                            onChange={(e: any) => {
                                this.updateSchemaProperty(key, 'pattern', e.target.value || null);
                            }}
                        />
                    </div>
                </div>
                <div className="p-buttonset">
                    <Button className={'p-button-text p-button-plain p-button-sm'} label={__('No validation', 'thebooking')}
                            onClick={() => {
                                this.updateSchemaProperty(key, 'pattern', null)
                            }}
                    />
                    <Button className={'p-button-text p-button-plain p-button-sm'} label={__('Email', 'thebooking')}
                            onClick={() => {
                                this.updateSchemaProperty(key, 'pattern', '/^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6})*$/')
                            }}
                    />
                    <Button className={'p-button-text p-button-plain p-button-sm'} label={__('Phone (international)', 'thebooking')}
                            onClick={() => {
                                this.updateSchemaProperty(key, 'pattern', '/^(?:(?:\\(?(?:00|\\+)([1-4]\\d\\d|[1-9]\\d?)\\)?)?[\\-\\.\\ \\\\\\/]?)?((?:\\(?\\d{1,}\\)?[\\-\\.\\ \\\\\\/]?){0,})(?:[\\-\\.\\ \\\\\\/]?(?:#|ext\\.?|extension|x)[\\-\\.\\ \\\\\\/]?(\\d+))?$/')
                            }}
                    />
                    <Button className={'p-button-text p-button-plain p-button-sm'} label={__('Alphanumeric with space', 'thebooking')}
                            onClick={() => {
                                this.updateSchemaProperty(key, 'pattern', '/^[a-zA-Z0-9 ]*$/')
                            }}
                    />
                    <Button className={'p-button-text p-button-plain p-button-sm'} label={__('URL', 'thebooking')}
                            onClick={() => {
                                this.updateSchemaProperty(key, 'pattern', '/https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#()?&//=]*)/')
                            }}
                    />
                </div>
            </Panel>
        )
    }

    advancedPanel = (key: string) => {
        return (
            <Panel header={__('Advanced', 'thebooking')} className={styles.innerPanel} toggleable collapsed={true}>
                <div className="p-fluid p-formgrid p-grid">

                    <div className={'p-field p-col-12 p-lg-6'}>
                        <label htmlFor={key + 'hideIfRegistered'} className={'p-d-block'}>
                            {__('Hide from registered users', 'thebooking')}
                        </label>
                        <InputSwitch
                            id={key + 'hideIfRegistered'}
                            checked={this.state.schema.elements[key].hideIfRegistered}
                            onChange={(e) => {
                                this.updateSchemaProperty(key, 'hideIfRegistered', e.value);
                            }}
                        />
                    </div>
                    <div className={'p-field p-col-12 p-lg-6'}>
                        <label htmlFor={key + 'hook'} className={'p-d-block'}>
                            {__('Notification template placeholder', 'thebooking')}
                        </label>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">[</span>
                            <InputText
                                id={key + 'hook'}
                                keyfilter={/^[a-zA-Z0-9-_]+$/}
                                value={this.state.schema.elements[key].hook || ''}
                                onChange={(e: any) => {
                                    this.updateSchemaProperty(key, 'hook', e.target.value || null);
                                }}
                            />
                            <span className="p-inputgroup-addon">]</span>
                        </div>
                        <p>{__('This placeholder, when found inside a notification template, will be replaced with the value of the field. It must be unique in the context of the service.', 'thebooking')}</p>
                    </div>
                    {(this.schemaPropIs(this.state.schema.elements[key]) === 'text'
                        || this.schemaPropIs(this.state.schema.elements[key]) === 'number') && (
                        <div className={'p-field p-col-12 p-lg-6'}>
                            <label htmlFor={key + 'metakey'} className={'p-d-block'}>
                                {__('Pre-fill user meta-key', 'thebooking')}
                            </label>
                            <Dropdown
                                inputId={key + 'metakey'}
                                value={this.state.schema.elements[key].metakey}
                                options={[
                                    {
                                        label: __('Email', 'thebooking'),
                                        value: 'user_email'
                                    },
                                    {
                                        label: __('First name', 'thebooking'),
                                        value: 'first_name'
                                    },
                                    {
                                        label: __('Last name', 'thebooking'),
                                        value: 'last_name'
                                    },
                                    {
                                        label: __('User URL', 'thebooking'),
                                        value: 'user_url'
                                    },
                                ]}
                                placeholder={__('Write a metakey or select one', 'thebooking')}
                                showClear
                                editable
                                onChange={(e) => {
                                    this.updateSchemaProperty(key, 'metakey', e.value);
                                }}
                            />
                            <p>{__('The field will be pre-populated with the corresponding user meta when available (even if the field is hidden).', 'thebooking')}</p>
                        </div>
                    )}
                </div>
            </Panel>
        )
    }

    render() {
        return (
            <div className={styles.formBuilder}>
                <div className={styles.form}>
                    {this.state.schema.order.length < 1 && (
                        <div className={styles.emptyState}>
                            <img src={tbkCommon.pluginUrl + 'assets/empty-state.svg'}/>
                            <h2>{__('There are no fields in this form.', 'thebooking')}</h2>
                        </div>
                    )}
                    {this.state.schema.order.length > 0 && (
                        <DragDropContext onDragEnd={this.onDragEnd}>
                            <Droppable droppableId={'components'}>
                                {
                                    (provided: any, snapshot: any) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={styles.droppable}
                                        >
                                            {this.state.schema.order.map((propKey, i) => (
                                                    <Draggable key={propKey} draggableId={propKey} index={i}>
                                                        {
                                                            (provided: any, snapshot: any) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className={styles.field}
                                                                    style={provided.draggableProps.style}
                                                                    key={propKey}
                                                                >
                                                                    {this.parseSchema(propKey, provided.dragHandleProps)}
                                                                </div>
                                                            )
                                                        }
                                                    </Draggable>
                                                )
                                            )}
                                            {provided.placeholder}

                                        </div>
                                    )
                                }
                            </Droppable>
                        </DragDropContext>
                    )}
                </div>
                <div className={styles.elements}>
                    <Button label={__('Text', 'thebooking')} icon={'pi pi-pencil'} className={'p-button-text p-button-plain'} onClick={() => this.addSchemaItem('text')}/>
                    <Button label={__('Checkbox', 'thebooking')} icon={'pi pi-check-square'} className={'p-button-text p-button-plain'} onClick={() => this.addSchemaItem('checkbox')}/>
                    <Button label={__('Number', 'thebooking')} icon={'pi pi-sort-numeric-down'} className={'p-button-text p-button-plain'} onClick={() => this.addSchemaItem('number')}/>
                    <Button label={__('Options', 'thebooking')} icon={'pi pi-list'} className={'p-button-text p-button-plain'} onClick={() => this.addSchemaItem('options')}/>
                    <Button label={__('File upload', 'thebooking')} icon={'pi pi-upload'} className={'p-button-text p-button-plain'} onClick={() => this.addSchemaItem('file')}/>
                    <Button label={__('Paragraph', 'thebooking')} icon={'pi pi-align-left'} className={'p-button-text p-button-plain'} onClick={() => this.addSchemaItem('paragraph')}/>
                </div>
            </div>
        );
    }

}

export default SettingFormBuilder;