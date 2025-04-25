import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BonosCarbonoComponent } from './bonos-carbono.component';

describe('BonosCarbonoComponent', () => {
  let component: BonosCarbonoComponent;
  let fixture: ComponentFixture<BonosCarbonoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BonosCarbonoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BonosCarbonoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
