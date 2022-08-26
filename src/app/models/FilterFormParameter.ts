export interface FilterFormParameter {
    label: string;
    formControlName: string;
    controlType: 'input' | 'select';
    optionValues?: any[];
}

export interface RowFilterForm {
    fields: FilterFormParameter[];
}

export interface FieldValueChange {
    data: string;
    controlName: string;
  }