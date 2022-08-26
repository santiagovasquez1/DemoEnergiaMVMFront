import { FormGroup, FormBuilder } from '@angular/forms';
import { Component, Input, OnInit, Output, EventEmitter, ViewChildren, QueryList, AfterViewInit, AfterContentChecked, ChangeDetectorRef } from '@angular/core';
import { FieldValueChange, RowFilterForm } from 'src/app/models/FilterFormParameter';
import { MatDatepicker } from '@angular/material/datepicker';


@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styles: [
  ]
})
export class FilterComponent implements OnInit, AfterContentChecked {

  @Input() rowsForm: RowFilterForm[] = [];
  @Output() onfieldValueChange: EventEmitter<FieldValueChange>
  @ViewChildren(MatDatepicker) pickers: QueryList<MatDatepicker<any>>
  filterForm: FormGroup
  controlsNames: string[] = [];

  constructor(private fb: FormBuilder,
    private changeDetector: ChangeDetectorRef) {
    this.onfieldValueChange = new EventEmitter();
    this.filterForm = fb.group({});

  }

  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges()
  }

  ngOnInit(): void {
    this.initForm();
    this.controlsNames = Object.keys(this.filterForm.controls);

    this.controlsNames.forEach(controlName => {
      this.filterForm.get(controlName).valueChanges.subscribe(data => {
        this.onfieldValueChange.emit({ data, controlName })
      })
    });
  }

  initForm() {
    this.rowsForm.forEach(row => {
      row.fields.forEach(formControl => {
        this.filterForm.addControl(formControl.formControlName, this.fb.control(''));
      })
    })
  }

}
