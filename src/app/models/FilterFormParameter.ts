export interface FilterFormParameter {
    label: string;
    formControlName: string;
    controlType: 'input' | 'select' | 'datePicker';
    optionValues?: any[];
    pipe: '' | 'estadoRegistro' | 'tipoContrato' | 'tipoTransaccion';
    pickerIndex?: number;
}

export interface RowFilterForm {
    fields: FilterFormParameter[];
}

export interface FieldValueChange {
    data: string;
    controlName: string;
}