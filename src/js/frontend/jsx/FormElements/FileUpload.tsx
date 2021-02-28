import globals from '../../../globals';
import {Button, LinearProgress, Box, FormControl, FormHelperText, ButtonGroup} from '@material-ui/core';
import PublishIcon from '@material-ui/icons/Publish';
import ClearIcon from '@material-ui/icons/Clear';
import React from "react";
import Api from "../../../Api";

declare const wpApiSettings: { nonce: any; };
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface FileUploadProps {
    label: string,
    required: boolean,
    error: boolean,
    disabled: boolean,
    errorText: string,
    defaultValue?: string | number,
    value?: string,
    accept: string[],
    maxSize: number

    onChange(fileData: any): any
}

interface FileUploadState {
    currentFile: any,
    progress: number,
    message: string,
    isError: boolean,
    isBusy: boolean
}

export default class FileUpload extends React.Component<FileUploadProps, FileUploadState> {

    private readonly fileInput: React.RefObject<HTMLInputElement>;

    constructor(props: FileUploadProps) {
        super(props);

        this.fileInput = React.createRef();

        this.state = {
            currentFile: undefined,
            progress   : 0,
            message    : props.label,
            isError    : false,
            isBusy     : false
        };

    }

    uploadService = (file: string | Blob, onUploadProgress: any) => {
        let formData = new FormData();
        formData.append("file", file);

        return Api.post('/frontend/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-WP-Nonce'  : wpApiSettings.nonce
            },
            onUploadProgress
        })

    }

    clear = () => {
        this.fileInput.current.value = '';
        this.setState({
            progress   : 0,
            currentFile: undefined,
            isError    : false,
            isBusy     : false,
            message    : this.props.label
        }, () => {
            this.props.onChange(null);
        });
    }

    upload = (event: any) => {
        let currentFile = event.target.files[0];

        if (currentFile.size > this.props.maxSize * 1000000) {
            this.fileInput.current.value = '';
            this.setState({
                progress   : 0,
                message    : sprintf(__('The file is too big, max size is %s MB'), this.props.maxSize.toString()),
                currentFile: undefined,
                isError    : true,
                isBusy     : false
            }, () => {
                this.props.onChange(null)
            });

        } else if (!this.props.accept.includes(currentFile.type)) {
            this.fileInput.current.value = '';
            this.setState({
                progress   : 0,
                message    : __('File format not accepted.', 'the-booking'),
                currentFile: undefined,
                isError    : true,
                isBusy     : false
            }, () => {
                this.props.onChange(null)
            });
        } else {
            this.setState({
                progress   : 0,
                currentFile: currentFile,
                isError    : false,
                isBusy     : true
            });

            this.uploadService(currentFile, (event: any) => {
                this.setState({
                    progress: Math.round((100 * event.loaded) / event.total),
                });
            })
                .then((response) => {
                    console.log(response);
                    this.setState({
                        message: this.state.currentFile.name,
                        isBusy : false,
                        isError: false
                    }, () => {
                        this.props.onChange('hash' in response.data ? response.data.hash : null)
                    });
                })
                .catch((error) => {
                    console.log(error.response.data.message);
                    this.fileInput.current.value = '';
                    this.setState({
                        progress   : 0,
                        message    : __('Could not upload the file.', 'the-booking'),
                        currentFile: undefined,
                        isError    : true,
                        isBusy     : false
                    }, () => {
                        this.props.onChange(null)
                    });
                });
        }
    }

    render() {
        return (
            <div>
                <FormControl error={this.props.error} required={this.props.required} fullWidth={true}>
                    <input
                        ref={this.fileInput}
                        style={{display: 'none'}}
                        type={'file'}
                        onChange={this.upload}
                        accept={this.props.accept.join(',')}
                    />
                    <ButtonGroup>
                        <Button
                            style={{flex: 1, padding: '14px'}}
                            color="default"
                            variant="contained"
                            disableElevation
                            startIcon={<PublishIcon/>}
                            disabled={this.state.isBusy}
                            onClick={() => {
                                this.fileInput.current.click();
                            }}
                        >
                            {this.state.message}
                        </Button>
                        {this.state.currentFile && this.state.progress === 100 && (
                            <Button
                                color="default"
                                variant="contained"
                                disableElevation
                                disabled={this.state.isBusy}
                            >
                                <ClearIcon onClick={this.clear}/>
                            </Button>
                        )}
                    </ButtonGroup>

                    {this.state.currentFile && (
                        <Box className="mb25" display="flex" alignItems="center">
                            <Box width="100%" mt={'-4px'}>
                                <LinearProgress variant="determinate" value={this.state.progress}/>
                            </Box>
                        </Box>)
                    }
                    {this.props.errorText && (
                        <FormHelperText>{this.props.errorText}</FormHelperText>
                    )}
                </FormControl>
            </div>
        )
    }
}